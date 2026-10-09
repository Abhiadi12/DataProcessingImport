import { z } from "zod";
import { MAX_UPLOAD_BYTES, VALIDATION_MESSAGES } from "@/constants";
import type { UploadFormValues } from "@/types";
import { hasAllowedImportExtension } from "@/utils/file";

const fileSchema = z.custom<File | null>().superRefine((file, context) => {
  const fail = (message: string) => context.addIssue({ code: "custom", message });

  if (!file) {
    fail(VALIDATION_MESSAGES.FILE_REQUIRED);
  } else if (!hasAllowedImportExtension(file.name)) {
    fail(VALIDATION_MESSAGES.FILE_TYPE_UNSUPPORTED);
  } else if (file.size === 0) {
    fail(VALIDATION_MESSAGES.FILE_EMPTY);
  } else if (file.size > MAX_UPLOAD_BYTES) {
    fail(VALIDATION_MESSAGES.FILE_TOO_LARGE);
  }
});

export const uploadImportSchema = z.object({
  file: fileSchema,
  schemaId: z.string().min(1, VALIDATION_MESSAGES.SCHEMA_REQUIRED),
}) satisfies z.ZodType<UploadFormValues>;
