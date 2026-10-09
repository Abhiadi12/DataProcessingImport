import { z } from "zod";
import {
  FIELD_TYPES,
  NON_UNIQUE_FIELD_TYPE,
  SCHEMA_DESCRIPTION_MAX_LENGTH,
  SCHEMA_FIELD_NAME_MAX_LENGTH,
  SCHEMA_FIELD_NAME_PATTERN,
  SCHEMA_MAX_FIELDS,
  SCHEMA_NAME_MAX_LENGTH,
  VALIDATION_MESSAGES,
} from "@/constants";
import type { SchemaFormValues } from "@/types";

const schemaFieldSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, VALIDATION_MESSAGES.FIELD_NAME_REQUIRED)
      .max(SCHEMA_FIELD_NAME_MAX_LENGTH, VALIDATION_MESSAGES.FIELD_NAME_TOO_LONG)
      .regex(SCHEMA_FIELD_NAME_PATTERN, VALIDATION_MESSAGES.FIELD_NAME_INVALID),
    type: z.enum(FIELD_TYPES),
    required: z.boolean(),
    unique: z.boolean(),
  })
  .refine((field) => !field.unique || field.required, {
    path: ["unique"],
    message: VALIDATION_MESSAGES.UNIQUE_MUST_BE_REQUIRED,
  })
  .refine((field) => !field.unique || field.type !== NON_UNIQUE_FIELD_TYPE, {
    path: ["unique"],
    message: VALIDATION_MESSAGES.UNIQUE_CANNOT_BE_BOOLEAN,
  });

export const schemaFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.SCHEMA_NAME_REQUIRED)
    .max(SCHEMA_NAME_MAX_LENGTH, VALIDATION_MESSAGES.SCHEMA_NAME_TOO_LONG),
  description: z
    .string()
    .trim()
    .max(SCHEMA_DESCRIPTION_MAX_LENGTH, VALIDATION_MESSAGES.SCHEMA_DESCRIPTION_TOO_LONG),
  isGlobal: z.boolean(),
  fields: z
    .array(schemaFieldSchema)
    .min(1, VALIDATION_MESSAGES.SCHEMA_NEEDS_FIELD)
    .max(SCHEMA_MAX_FIELDS, VALIDATION_MESSAGES.SCHEMA_TOO_MANY_FIELDS)
    // Not a backend rule as such — the API takes fields as an object keyed by
    // name, so a repeated name would silently overwrite the earlier field.
    // Flag the later occurrence, on its own name input.
    .superRefine((fields, context) => {
      const seen = new Set<string>();
      fields.forEach((field, index) => {
        if (field.name && seen.has(field.name)) {
          context.addIssue({
            code: "custom",
            path: [index, "name"],
            message: VALIDATION_MESSAGES.FIELD_NAME_DUPLICATE,
          });
        }
        seen.add(field.name);
      });
    })
    .refine((fields) => fields.length === 0 || fields.some((field) => field.unique), {
      message: VALIDATION_MESSAGES.SCHEMA_NEEDS_UNIQUE_FIELD,
    }),
}) satisfies z.ZodType<SchemaFormValues>;
