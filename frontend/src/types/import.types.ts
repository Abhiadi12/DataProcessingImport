import type { PaginationParams } from "./api.types";

export type ImportStatus =
  "UPLOADING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type ImportStage =
  "FILE_VALIDATION" | "SCHEMA_VALIDATION" | "IMPORTING" | "REPORT_GENERATION";

// Mirrors the backend's ImportView. Dates arrive as ISO strings.
export interface ImportRecord {
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
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ImportListItem extends ImportRecord {
  schemaName: string;
  uploadedByName: string;
  hasErrorReport: boolean;
}

export interface ImportListParams extends PaginationParams {
  // Omit to list imports in every status.
  status?: ImportStatus;
}

// Step 1's request: what the browser says it is about to upload. The API
// checks the stored file against these when the import is started.
export interface PrepareUploadInput {
  filename: string;
  sizeBytes: number;
  contentType: string;
  schemaId: string;
}

// Step 1's answer: the new import's id and a short-lived URL to PUT the file to.
export interface PreparedUpload {
  id: string;
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface UploadFormValues {
  file: File | null;
  schemaId: string;
}

export type UploadStep = "idle" | "preparing" | "uploading" | "starting";

export interface UploadImportVariables {
  projectId: string;
  file: File;
  schemaId: string;
  idempotencyKey: string;
}

// One try at uploading a particular file with a particular schema, and the
// idempotency key it was sent with.
export interface UploadAttempt {
  file: File;
  schemaId: string;
  key: string;
}
