import { z } from "zod";
import {
  IMPORT_SCHEMA_MESSAGES,
  SCHEMA_FIELD_NAME_MAX_LENGTH,
  SCHEMA_MAX_FIELDS,
} from "../../constants/index.js";

export const FIELD_TYPES = ["string", "number", "integer", "boolean", "date"] as const;

const UNIQUE_CAPABLE_TYPES: readonly string[] = ["string", "number", "integer", "date"];

const fieldDefinitionSchema = z
  .object({
    type: z.enum(FIELD_TYPES),
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
  })
  .strict();

const fieldNameSchema = z
  .string()
  .min(1)
  .max(SCHEMA_FIELD_NAME_MAX_LENGTH)
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, IMPORT_SCHEMA_MESSAGES.INVALID_FIELD_NAME);

export const fieldsDefinitionSchema = z
  .record(fieldNameSchema, fieldDefinitionSchema)
  .refine((fields) => Object.keys(fields).length >= 1, {
    message: IMPORT_SCHEMA_MESSAGES.NEEDS_AT_LEAST_ONE_FIELD,
  })
  .refine((fields) => Object.keys(fields).length <= SCHEMA_MAX_FIELDS, {
    message: IMPORT_SCHEMA_MESSAGES.TOO_MANY_FIELDS,
  })
  .refine((fields) => Object.values(fields).some((field) => field.unique), {
    message: IMPORT_SCHEMA_MESSAGES.NEEDS_UNIQUE_FIELD,
  })
  .refine((fields) => Object.values(fields).every((field) => !field.unique || field.required), {
    message: IMPORT_SCHEMA_MESSAGES.UNIQUE_MUST_BE_REQUIRED,
  })
  .refine(
    (fields) =>
      Object.values(fields).every(
        (field) => !field.unique || UNIQUE_CAPABLE_TYPES.includes(field.type),
      ),
    { message: IMPORT_SCHEMA_MESSAGES.UNIQUE_TYPE_UNSUITABLE },
  );

export type FieldType = (typeof FIELD_TYPES)[number];
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;
export type FieldsDefinition = z.infer<typeof fieldsDefinitionSchema>;

export function uniqueFieldNames(fields: FieldsDefinition): string[] {
  return Object.entries(fields)
    .filter(([, definition]) => definition.unique)
    .map(([name]) => name);
}

/** Field names carrying `required: true`. Used by SCHEMA_VALIDATION on the header row. */
export function requiredFieldNames(fields: FieldsDefinition): string[] {
  return Object.entries(fields)
    .filter(([, definition]) => definition.required)
    .map(([name]) => name);
}
