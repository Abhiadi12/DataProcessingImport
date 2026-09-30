import { z } from "zod";
import {
  ALLOWED_IMPORT_CONTENT_TYPES,
  IMPORT_MESSAGES,
  NAME_MAX_LENGTH,
} from "../../../constants/index.js";
import { env } from "../../../config/env.js";
import { allowedExtensionFor, extensionOf } from "../../../utils/filename.js";

/**
 * What the client declares BEFORE uploading. Every field here is a claim, not a
 * fact — `sizeBytes` and `contentType` are what the browser says it is about to
 * send. They're recorded so that `POST /imports/:id/start` can verify the object
 * that actually landed against what was promised.
 */
export const createImportSchema = z
  .object({
    filename: z
      .string()
      .trim()
      .min(1)
      .max(NAME_MAX_LENGTH)
      // Reject path separators and NUL outright. The filename never reaches an
      // object key (see allowedExtensionFor), but it is stored and later echoed
      // back in a Content-Disposition header on download.
      .refine((value) => !/[/\\\0]/.test(value), {
        message: "Filename must not contain path separators",
      })
      .refine((value) => allowedExtensionFor(value) !== null, {
        message: IMPORT_MESSAGES.UNSUPPORTED_EXTENSION,
      }),
    sizeBytes: z.coerce
      .number()
      .int()
      .positive()
      .max(env.MAX_UPLOAD_BYTES, { message: IMPORT_MESSAGES.FILE_TOO_LARGE }),
    contentType: z.string().trim().min(1).max(NAME_MAX_LENGTH),
    schemaId: z.string().uuid(),
  })
  // Cross-field: the declared content type has to be plausible for the
  // extension. Browsers are inconsistent here, so the allow-list is generous.
  .refine(
    (body) => {
      const extension = allowedExtensionFor(body.filename);
      if (extension === null) return true; // already reported by the field-level check
      return ALLOWED_IMPORT_CONTENT_TYPES[extension].includes(body.contentType.toLowerCase());
    },
    { message: IMPORT_MESSAGES.UNSUPPORTED_CONTENT_TYPE, path: ["contentType"] },
  );

export const importIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateImportBody = z.infer<typeof createImportSchema>;
export type ImportIdParam = z.infer<typeof importIdParamSchema>;

export { extensionOf };
