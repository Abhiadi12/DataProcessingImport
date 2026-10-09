import { ALLOWED_IMPORT_EXTENSIONS, type AllowedImportExtension } from "../constants/index.js";

/**
 * The lower-cased extension of a filename, without the dot.
 *
 * Returns null when there isn't one, rather than guessing. Only the final
 * segment counts, so "archive.tar.csv" is a csv and "noext" is nothing.
 */
export function extensionOf(filename: string): string | null {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) return null;
  return filename.slice(lastDot + 1).toLowerCase();
}

export function isAllowedImportExtension(value: string | null): value is AllowedImportExtension {
  return value !== null && (ALLOWED_IMPORT_EXTENSIONS as readonly string[]).includes(value);
}

/**
 * The extension to use in the object key.
 *
 * Returns the value from our own allow-list rather than the slice of the user's
 * filename, so nothing attacker-controlled reaches a storage key even if the
 * comparison above were ever loosened.
 */
export function allowedExtensionFor(filename: string): AllowedImportExtension | null {
  const extension = extensionOf(filename);
  if (!isAllowedImportExtension(extension)) return null;
  return ALLOWED_IMPORT_EXTENSIONS.find((allowed) => allowed === extension) ?? null;
}
