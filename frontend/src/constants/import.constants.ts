import type { UploadStep } from "@/types";

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
