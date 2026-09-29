import { z } from "zod";
import {
  IMPORT_SCHEMA_MESSAGES,
  SCHEMA_DESCRIPTION_MAX_LENGTH,
  SCHEMA_FIELD_NAME_MAX_LENGTH,
  SCHEMA_MAX_FIELDS,
  SCHEMA_NAME_MAX_LENGTH,
} from "../../../constants/index.js";
import { paginationQuerySchema } from "./pagination.schema.js";

export const FIELD_TYPES = ["string", "number", "integer", "boolean", "date"] as const;

/** Types that can meaningfully identify a record. A boolean cannot — two values total. */
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

export const createImportSchemaSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_NAME_MAX_LENGTH),
  description: z.string().trim().max(SCHEMA_DESCRIPTION_MAX_LENGTH).optional(),
  fields: fieldsDefinitionSchema,
});

export const importSchemaIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listImportSchemasQuerySchema = paginationQuerySchema;

export type FieldType = (typeof FIELD_TYPES)[number];
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;
export type FieldsDefinition = z.infer<typeof fieldsDefinitionSchema>;
export type CreateImportSchemaBody = z.infer<typeof createImportSchemaSchema>;
export type ImportSchemaIdParam = z.infer<typeof importSchemaIdParamSchema>;
export type ListImportSchemasQuery = z.infer<typeof listImportSchemasQuerySchema>;

/** INFO: The field names carrying `unique: true`, in declaration order. */
export function uniqueFieldNames(fields: FieldsDefinition): string[] {
  return Object.entries(fields)
    .filter(([, definition]) => definition.unique)
    .map(([name]) => name);
}

/** INFO: The field names carrying `required: true`. Used by SCHEMA_VALIDATION on the header row. */
export function requiredFieldNames(fields: FieldsDefinition): string[] {
  return Object.entries(fields)
    .filter(([, definition]) => definition.required)
    .map(([name]) => name);
}
