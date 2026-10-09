import type { FieldType } from "@/types";

// Mirrors backend/src/services/v1/import-schema.definition.ts and the SCHEMA_*
// limits in its validation constants. The backend is the real check.
export const FIELD_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "date",
] as const satisfies readonly FieldType[];

export const NON_UNIQUE_FIELD_TYPE: FieldType = "boolean";

export const SCHEMA_NAME_MAX_LENGTH = 120;
export const SCHEMA_DESCRIPTION_MAX_LENGTH = 500;
export const SCHEMA_FIELD_NAME_MAX_LENGTH = 64;
export const SCHEMA_MAX_FIELDS = 100;

export const SCHEMA_FIELD_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
