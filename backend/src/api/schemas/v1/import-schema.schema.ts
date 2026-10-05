import { z } from "zod";
import { SCHEMA_DESCRIPTION_MAX_LENGTH, SCHEMA_NAME_MAX_LENGTH } from "../../../constants/index.js";
import { fieldsDefinitionSchema } from "../../../services/v1/import-schema.definition.js";
import { paginationQuerySchema } from "./pagination.schema.js";

export const createImportSchemaSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_NAME_MAX_LENGTH),
  description: z.string().trim().max(SCHEMA_DESCRIPTION_MAX_LENGTH).optional(),
  fields: fieldsDefinitionSchema,
});

export const importSchemaIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listImportSchemasQuerySchema = paginationQuerySchema;

export type CreateImportSchemaBody = z.infer<typeof createImportSchemaSchema>;
export type ImportSchemaIdParam = z.infer<typeof importSchemaIdParamSchema>;
export type ListImportSchemasQuery = z.infer<typeof listImportSchemasQuerySchema>;

export {
  FIELD_TYPES,
  fieldsDefinitionSchema,
  requiredFieldNames,
  uniqueFieldNames,
} from "../../../services/v1/import-schema.definition.js";
export type {
  FieldDefinition,
  FieldsDefinition,
  FieldType,
} from "../../../services/v1/import-schema.definition.js";
