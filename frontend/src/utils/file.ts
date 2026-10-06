import {
  ALLOWED_IMPORT_CONTENT_TYPES,
  ALLOWED_IMPORT_EXTENSIONS,
  DEFAULT_IMPORT_CONTENT_TYPE,
} from "@/constants";

// "report.final.CSV" → "csv". null when there is no extension (including
// dotfiles like ".csv", which have a name but no extension).
export function extensionOf(filename: string): string | null {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return null;
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

export function hasAllowedImportExtension(filename: string): boolean {
  const extension = extensionOf(filename);
  return extension !== null && ALLOWED_IMPORT_EXTENSIONS.includes(extension);
}

// The content type to declare for a file. Browsers sometimes report none, or
// an unusual one, for a perfectly good CSV; since the extension has already
// been checked, anything the API would not accept is sent as text/csv.
export function importContentTypeOf(file: File): string {
  const type = file.type.toLowerCase();
  return ALLOWED_IMPORT_CONTENT_TYPES.includes(type) ? type : DEFAULT_IMPORT_CONTENT_TYPE;
}

const BYTE_UNITS = ["B", "KB", "MB", "GB"];

// 1536 → "1.5 KB". Uses 1024 steps, to match the 2 GB (GiB) upload limit.
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? String(value) : value.toFixed(1);
  return `${rounded} ${BYTE_UNITS[unit]}`;
}

// A random key for the Idempotency-Key header. crypto.randomUUID only exists
// on secure origins (HTTPS or localhost), hence the fallback.
export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
