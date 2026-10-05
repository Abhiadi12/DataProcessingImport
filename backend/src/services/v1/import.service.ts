import { randomUUID } from "node:crypto";
import { ImportStatus, Role } from "@prisma/client";
import { env } from "../../config/env.js";
import {
  IMPORT_MESSAGES,
  PROJECT_MESSAGES,
  ROLE_RANK,
  STORAGE_KEYS,
} from "../../constants/index.js";
import { BadRequestError } from "../../errors/bad-request.error.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import type { ImportPublisher } from "../../queue/import-publisher.js";
import type { ImportRepository } from "../../repositories/v1/import.repository.js";
import type { ImportSchemaRepository } from "../../repositories/v1/import-schema.repository.js";
import type { ProjectRepository } from "../../repositories/v1/project.repository.js";
import { allowedExtensionFor } from "../../utils/filename.js";
import { logger } from "../../utils/logger.js";
import type { CreateImportBody } from "../../api/schemas/v1/import.schema.js";
import type { AuthenticatedUser } from "./auth.service.js";
import { toImportView, type ImportView, type PreparedUploadView } from "./import.mapper.js";
import type { StorageService } from "./storage.service.js";

export class ImportService {
  constructor(
    private readonly importRepository: ImportRepository,
    private readonly importSchemaRepository: ImportSchemaRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly storageService: StorageService,
    private readonly importPublisher: ImportPublisher,
  ) {}

  /**
   * Step 1 of the upload: reserve the import and hand back a presigned PUT.
   *
   * The row is created BEFORE the URL because the object key embeds the import
   * id — so the id has to exist first. It's generated here with randomUUID
   * rather than left to the database default, which keeps key construction and
   * insertion in one place instead of needing an insert-then-update.
   *
   * Nothing is trusted yet: at this point `sizeBytes` and `contentType` are only
   * claims. `start()` is where reality is checked.
   */
  async prepareUpload(
    user: AuthenticatedUser,
    projectId: string,
    input: CreateImportBody,
  ): Promise<PreparedUploadView> {
    const extension = allowedExtensionFor(input.filename);
    if (extension === null) {
      // Unreachable via the route (the zod schema rejects it first); kept so the
      // service is safe to call from anywhere, including the worker.
      throw new BadRequestError(IMPORT_MESSAGES.UNSUPPORTED_EXTENSION);
    }

    await this.requireUsableSchema(projectId, input.schemaId);

    const importId = randomUUID();
    const objectKey = STORAGE_KEYS.importOriginal(projectId, importId, extension);

    const record = await this.importRepository.create({
      id: importId,
      projectId,
      schemaId: input.schemaId,
      uploadedById: user.id,
      filename: input.filename,
      objectKey,
      sizeBytes: input.sizeBytes,
      contentType: input.contentType,
    });

    // ContentType is deliberately NOT signed — see StorageService.presignPut.
    const uploadUrl = await this.storageService.presignPut(objectKey);

    logger.info(
      { importId: record.id, projectId, objectKey, sizeBytes: input.sizeBytes },
      "Upload prepared",
    );

    return {
      id: record.id,
      objectKey,
      uploadUrl,
      expiresIn: env.PRESIGN_EXPIRY_SECONDS,
    };
  }

  /**
   * Step 2: verify the upload actually landed, then queue the import.
   *
   * The client calling this is not evidence that anything was uploaded, so the
   * object is checked in storage first. Without that a worker would be handed a
   * job whose file doesn't exist, fail, retry, and end up in the DLQ — a
   * confusing failure for what is really a bad request.
   */
  async start(user: AuthenticatedUser, importId: string, requestId: string): Promise<ImportView> {
    const record = await this.requireAccessibleImport(user, importId);

    if (record.status !== ImportStatus.UPLOADING) {
      // Distinguish "already moving" from "wrong state entirely" so a
      // double-clicked Start reads as a conflict rather than a validation error.
      throw new ConflictError(
        record.status === ImportStatus.QUEUED || record.status === ImportStatus.PROCESSING
          ? IMPORT_MESSAGES.ALREADY_STARTED
          : IMPORT_MESSAGES.NOT_AWAITING_UPLOAD,
      );
    }

    const object = await this.storageService.headObject(record.objectKey);
    if (!object.exists) {
      throw new BadRequestError(IMPORT_MESSAGES.OBJECT_MISSING);
    }

    const declaredSize = Number(record.sizeBytes);
    if (object.size !== declaredSize) {
      // A mismatch means the client uploaded something other than what it
      // described — a truncated upload, or a different file entirely. Byte
      // progress divides by this number, so an untrue size makes progress lie.
      throw new BadRequestError(IMPORT_MESSAGES.sizeMismatch(declaredSize, object.size));
    }

    const claimed = await this.importRepository.markQueued(importId);
    if (!claimed) {
      // Lost the race with a concurrent start(); that one already queued it.
      throw new ConflictError(IMPORT_MESSAGES.ALREADY_STARTED);
    }

    // Publish AFTER the conditional update, never before: if markQueued lost
    // the race there must be no message. The reverse order would also race —
    // a worker could consume the message and find the row still UPLOADING.
    try {
      await this.importPublisher.publish({ importId, attempt: 1, requestId });
    } catch (error) {
      // The row says QUEUED but no message exists, so nothing would ever pick
      // it up and start() refuses to re-run on a non-UPLOADING import. Put it
      // back so the caller can simply try again.
      await this.importRepository.revertToUploading(importId);
      throw error;
    }

    logger.info({ importId, objectKey: record.objectKey, requestId }, "Import queued");

    const queued = await this.importRepository.findById(importId);
    if (!queued) throw new NotFoundError(IMPORT_MESSAGES.NOT_FOUND);
    return toImportView(queued);
  }

  /**
   * The schema must exist, be live, and be reachable from this project — a
   * global schema (null projectId) or this project's own.
   *
   * Checked here rather than left to the foreign key because an FK can only say
   * "no such row"; these three failures deserve three different messages.
   */
  private async requireUsableSchema(projectId: string, schemaId: string): Promise<void> {
    const schema = await this.importSchemaRepository.findById(schemaId);
    if (!schema) {
      throw new NotFoundError(IMPORT_MESSAGES.SCHEMA_NOT_FOUND);
    }
    if (schema.archivedAt !== null) {
      throw new ConflictError(IMPORT_MESSAGES.SCHEMA_ARCHIVED);
    }
    if (schema.projectId !== null && schema.projectId !== projectId) {
      throw new ForbiddenError(IMPORT_MESSAGES.SCHEMA_NOT_VISIBLE);
    }
  }

  /**
   * Access check for the flat `/imports/:id` routes, which carry no projectId
   * for `requireProjectAccess` to read. Any member of the owning project may act
   * on its imports; ADMIN bypasses membership as everywhere else.
   */
  private async requireAccessibleImport(user: AuthenticatedUser, importId: string) {
    const record = await this.importRepository.findById(importId);
    if (!record) {
      throw new NotFoundError(IMPORT_MESSAGES.NOT_FOUND);
    }

    if (ROLE_RANK[user.role] >= ROLE_RANK[Role.ADMIN]) return record;

    const isMember = await this.projectRepository.isMember(record.projectId, user.id);
    if (!isMember) {
      throw new ForbiddenError(PROJECT_MESSAGES.NOT_A_MEMBER);
    }

    return record;
  }
}
