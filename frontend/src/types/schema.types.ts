export type FieldType = "string" | "number" | "integer" | "boolean" | "date";

export interface FieldDefinition {
  type: FieldType;
  required: boolean;
  unique: boolean;
}

export type FieldsDefinition = Record<string, FieldDefinition>;

export interface ImportSchema {
  id: string;
  // null for a global schema.
  projectId: string | null;
  isGlobal: boolean;
  name: string;
  description: string | null;
  fields: FieldsDefinition;
  uniqueFields: string[];
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  importCount?: number;
}

export interface SchemaFieldFormValue extends FieldDefinition {
  name: string;
}

export interface SchemaFormValues {
  name: string;
  description: string;
  // Admin only: create a global schema instead of a project one.
  isGlobal: boolean;
  fields: SchemaFieldFormValue[];
}

export interface CreateImportSchemaInput {
  name: string;
  description?: string;
  fields: FieldsDefinition;
}

export interface CreateImportSchemaVariables {
  projectId: string;
  isGlobal: boolean;
  input: CreateImportSchemaInput;
}
