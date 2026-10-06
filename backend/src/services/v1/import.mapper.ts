import type { Import, ImportStage, ImportStatus } from "@prisma/client";

export interface ImportView {
  id: string;
  projectId: string;
  schemaId: string;
  uploadedById: string;
  filename: string;
  objectKey: string;
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

export interface ImportDetailView extends ImportView {
  schemaName: string;
  uploadedByName: string;
  /** First N errors, so the details page needs no extra request. */
  errorSample: {
    rowNumber: number;
    rawRow: string;
    errors: { field: string; message: string }[];
  }[];
  hasErrorReport: boolean;
}

export interface ImportProgressView {
  importId: string;
  status: ImportStatus;
  stage: ImportStage | null;
  /** bytesRead / sizeBytes — NOT processed/total, which is unknowable mid-stream. */
  progressPercent: number;
  bytesRead: number;
  sizeBytes: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  /** null until COMPLETED: counting rows requires reading the whole file. */
  totalRows: number | null;
  rowsPerSecond: number | null;
  /** "redis" while running, "database" once terminal or the key has expired. */
  source: "redis" | "database";
}

export function percentOf(bytesRead: number, sizeBytes: number): number {
  if (sizeBytes <= 0) return 0;
  // Clamped: a final flush can report marginally more than the declared size.
  return Math.min(100, Math.round((bytesRead / sizeBytes) * 1000) / 10);
}
