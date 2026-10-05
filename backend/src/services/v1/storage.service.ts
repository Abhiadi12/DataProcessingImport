import type { Readable } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { S3_DELETE_BATCH_SIZE, STORAGE_MESSAGES } from "../../constants/index.js";
import { InternalError } from "../../errors/internal.error.js";
import { logger } from "../../utils/logger.js";

export interface ObjectMetadata {
  exists: boolean;
  size: number;
  contentType?: string;
}

function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return metadata?.httpStatusCode;
}

function isNotFound(error: unknown): boolean {
  return httpStatusOf(error) === 404;
}

function wrap(error: unknown, message: string, context: Record<string, unknown>): InternalError {
  logger.error({ err: error, ...context }, message);
  return new InternalError(message, { status: httpStatusOf(error) });
}

function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export class StorageService {
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string,
  ) {}

  async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      logger.debug({ bucket: this.bucket }, "Storage bucket present");
      return;
    } catch (error) {
      if (!isNotFound(error)) {
        throw wrap(error, STORAGE_MESSAGES.BUCKET_ENSURE_FAILED, { bucket: this.bucket });
      }
    }

    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      logger.info({ bucket: this.bucket }, "Storage bucket created");
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "BucketAlreadyOwnedByYou" || name === "BucketAlreadyExists") {
        logger.debug({ bucket: this.bucket }, "Storage bucket created concurrently");
        return;
      }
      throw wrap(error, STORAGE_MESSAGES.BUCKET_ENSURE_FAILED, { bucket: this.bucket });
    }
  }

  presignPut(key: string, contentType?: string): Promise<string> {
    try {
      return getSignedUrl(
        this.s3,
        new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
        { expiresIn: env.PRESIGN_EXPIRY_SECONDS },
      );
    } catch (error) {
      throw wrap(error, STORAGE_MESSAGES.PRESIGN_FAILED, { key, operation: "put" });
    }
  }

  presignGet(key: string, downloadFilename?: string): Promise<string> {
    try {
      return getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ResponseContentDisposition: downloadFilename
            ? contentDisposition(downloadFilename)
            : undefined,
        }),
        { expiresIn: env.PRESIGN_EXPIRY_SECONDS },
      );
    } catch (error) {
      throw wrap(error, STORAGE_MESSAGES.PRESIGN_FAILED, { key, operation: "get" });
    }
  }

  /**
   * Opens the object as a READ STREAM — the whole point of the pipeline.
   *
   * `GetObject` does not download the file. It returns as soon as the response
   * headers arrive, and `.Body` is a Node Readable that yields the bytes in
   * chunks (~64KB) as they come off the socket. A 2GB object therefore costs a
   * few hundred KB of memory, not 2GB: each chunk is processed and discarded
   * before the next is read.
   *
   * Contrast `.Body.transformToByteArray()` or `transformToString()`, which
   * buffer the ENTIRE object in memory. Those are fine for a 2KB file and fatal
   * here — a 2GB string is not even representable in V8.
   *
   * The caller must consume or destroy the stream. An abandoned stream holds a
   * socket from the SDK's connection pool until it times out.
   */
  async getObjectStream(key: string): Promise<Readable> {
    try {
      const result = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!result.Body) {
        throw new InternalError(STORAGE_MESSAGES.GET_FAILED, { key });
      }
      // In Node the SDK always gives a Readable here; the union in the types
      // exists because the same client runs in browsers, where it's a
      // ReadableStream instead.
      return result.Body as Readable;
    } catch (error) {
      if (error instanceof InternalError) throw error;
      throw wrap(error, STORAGE_MESSAGES.GET_FAILED, { key });
    }
  }

  /**
   * Reads only the first `length` bytes.
   *
   * Used by SCHEMA_VALIDATION to inspect the header row without transferring
   * the rest of the file: a `Range` header makes S3 send just that slice. The
   * last line of the result is almost certainly cut mid-row, so callers must
   * discard it rather than parse it.
   */
  async getObjectRange(key: string, length: number): Promise<string> {
    try {
      const result = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${length - 1}` }),
      );
      if (!result.Body) {
        throw new InternalError(STORAGE_MESSAGES.GET_FAILED, { key });
      }
      // Safe to buffer: `length` is bounded by the caller (64KB).
      return await (result.Body as Readable)
        .setEncoding("utf8")
        .toArray()
        .then((p) => p.join(""));
    } catch (error) {
      if (error instanceof InternalError) throw error;
      throw wrap(error, STORAGE_MESSAGES.GET_FAILED, { key });
    }
  }

  /**
   * Uploads from a WRITE STREAM whose total size is unknown in advance.
   *
   * This is why `@aws-sdk/lib-storage` is a dependency. A plain `PutObject`
   * needs `Content-Length` up front, because S3 does not accept chunked
   * transfer encoding — so you cannot hand it a stream you are still writing
   * to. `Upload` solves that by buffering into `partSize` chunks and performing
   * a multipart upload, completing it when the stream ends.
   *
   * The error report uses this: rows are written as they are found, so the file
   * is never held in memory even when every row in a 5M-row file is invalid.
   */
  uploadStream(key: string, body: Readable, contentType: string): Promise<void> {
    const upload = new Upload({
      client: this.s3,
      params: { Bucket: this.bucket, Key: key, Body: body, ContentType: contentType },
      // 5MB is S3's minimum part size (except the last part).
      partSize: 5 * 1024 * 1024,
      queueSize: 1,
    });

    return upload
      .done()
      .then(() => {
        logger.debug({ key }, "Stream uploaded");
      })
      .catch((error: unknown) => {
        throw wrap(error, STORAGE_MESSAGES.UPLOAD_FAILED, { key });
      });
  }

  async headObject(key: string): Promise<ObjectMetadata> {
    try {
      const result = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return {
        exists: true,
        size: result.ContentLength ?? 0,
        ...(result.ContentType === undefined ? {} : { contentType: result.ContentType }),
      };
    } catch (error) {
      if (isNotFound(error)) return { exists: false, size: 0 };
      throw wrap(error, STORAGE_MESSAGES.HEAD_FAILED, { key });
    }
  }

  async deletePrefix(prefix: string): Promise<number> {
    let continuationToken: string | undefined;
    let deleted = 0;

    do {
      let page;
      try {
        page = await this.s3.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
            MaxKeys: S3_DELETE_BATCH_SIZE,
          }),
        );
      } catch (error) {
        throw wrap(error, STORAGE_MESSAGES.LIST_FAILED, { prefix });
      }

      const keys = (page.Contents ?? []).flatMap((object) =>
        object.Key ? [{ Key: object.Key }] : [],
      );

      if (keys.length > 0) {
        try {
          await this.s3.send(
            new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys } }),
          );
        } catch (error) {
          throw wrap(error, STORAGE_MESSAGES.DELETE_FAILED, { prefix, count: keys.length });
        }
        deleted += keys.length;
      }

      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);

    logger.info({ prefix, deleted }, "Deleted objects by prefix");
    return deleted;
  }
}
