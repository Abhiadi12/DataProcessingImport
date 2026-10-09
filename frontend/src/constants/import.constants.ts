import type { ImportFileKind, ImportStage, ImportStatus, UploadStep } from "@/types";

// Mirrors backend/src/constants/storage.constants.ts and MAX_UPLOAD_BYTES in
// its env config. The backend is the real check; these let the form refuse a
// file before any request is made.
export const ALLOWED_IMPORT_EXTENSIONS: readonly string[] = ["csv"];

// Passed to the file input's `accept`, so the OS file dialog filters too.
export const IMPORT_FILE_ACCEPT = ".csv,text/csv";

// Browsers report CSV inconsistently: "text/csv", "application/vnd.ms-excel"
// on Windows with Excel installed, or nothing at all.
export const ALLOWED_IMPORT_CONTENT_TYPES: readonly string[] = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
];

// Sent when the browser gives no type, or one the API would reject.
export const DEFAULT_IMPORT_CONTENT_TYPE = "text/csv";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

// Lets the API recognise a repeated "prepare upload" request and return the
// first answer instead of creating a second import.
export const IDEMPOTENCY_HEADER = "Idempotency-Key";

export const UPLOAD_STEP = {
  IDLE: "idle",
  PREPARING: "preparing",
  UPLOADING: "uploading",
  STARTING: "starting",
} as const satisfies Record<string, UploadStep>;

export const IMPORT_STATUS = {
  UPLOADING: "UPLOADING",
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const satisfies Record<ImportStatus, ImportStatus>;

// In the order an import moves through them; also the order of the filter.
export const IMPORT_STATUSES = Object.values(IMPORT_STATUS);

// Not finished yet, so the numbers on screen are still changing.
export const ACTIVE_IMPORT_STATUSES: readonly ImportStatus[] = [
  IMPORT_STATUS.UPLOADING,
  IMPORT_STATUS.QUEUED,
  IMPORT_STATUS.PROCESSING,
];

// Value of the status filter's "show everything" option.
export const ALL_STATUSES = "ALL";

// The pipeline's stages, in the order the worker goes through them.
export const IMPORT_STAGES: readonly ImportStage[] = [
  "FILE_VALIDATION",
  "SCHEMA_VALIDATION",
  "IMPORTING",
  "REPORT_GENERATION",
];

// Only a finished-badly import can be run again (the API refuses the rest).
export const RETRYABLE_IMPORT_STATUSES: readonly ImportStatus[] = [
  IMPORT_STATUS.FAILED,
  IMPORT_STATUS.CANCELLED,
];

export const IMPORT_FILE_KIND = {
  ORIGINAL: "original",
  ERROR_REPORT: "error-report",
} as const satisfies Record<string, ImportFileKind>;
