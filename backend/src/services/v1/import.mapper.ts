import type { Import, ImportStage, ImportStatus } from "@prisma/client";

export interface ImportView {
  id: string;
  projectId: string;
  schemaId: string;
  uploadedById: string;
  filename: string;
  objectKey: string;
  /**
   * Converted from BigInt on purpose: `JSON.stringify` THROWS on a BigInt
   * ("Do not know how to serialize a BigInt"), so returning the Prisma value
   * directly would 500 the endpoint. Number is safe here because
   * MAX_UPLOAD_BYTES (2 GiB) is far below Number.MAX_SAFE_INTEGER.
   */
  sizeBytes: number;
  bytesRead: number;
  contentType: string;
  status: ImportStatus;
  stage: ImportStage | null;
  attempt: number;
  failureReason: string | null;
  totalRows: number | null;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  /** Bytes-based, because the row count is unknowable until the file is fully read. */
  progressPercent: number;
  errorReportKey: string | null;
  queuedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface PreparedUploadView {
  id: string;
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

function progressPercentOf(record: Import): number {
  const size = Number(record.sizeBytes);
  if (size <= 0) return 0;
  const percent = (Number(record.bytesRead) / size) * 100;
  // Clamp: a final flush can report bytesRead slightly over the declared size.
  return Math.min(100, Math.round(percent * 10) / 10);
}

export function toImportView(record: Import): ImportView {
  return {
    id: record.id,
    projectId: record.projectId,
    schemaId: record.schemaId,
    uploadedById: record.uploadedById,
    filename: record.filename,
    objectKey: record.objectKey,
    sizeBytes: Number(record.sizeBytes),
    bytesRead: Number(record.bytesRead),
    contentType: record.contentType,
    status: record.status,
    stage: record.stage,
    attempt: record.attempt,
    failureReason: record.failureReason,
    totalRows: record.totalRows,
    processedRows: record.processedRows,
    successfulRows: record.successfulRows,
    failedRows: record.failedRows,
    duplicateRows: record.duplicateRows,
    progressPercent: progressPercentOf(record),
    errorReportKey: record.errorReportKey,
    queuedAt: record.queuedAt,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
  };
}
