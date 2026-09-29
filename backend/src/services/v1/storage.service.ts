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
