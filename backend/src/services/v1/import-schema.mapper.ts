import type { ImportSchema } from "@prisma/client";
import type { FieldsDefinition } from "../../api/schemas/v1/import-schema.schema.js";
import type { ImportSchemaWithCounts } from "../../repositories/v1/import-schema.repository.js";
import { uniqueFieldNames } from "../../api/schemas/v1/import-schema.schema.js";

export interface ImportSchemaView {
  id: string;
  projectId: string | null;
  isGlobal: boolean;
  name: string;
  description: string | null;
  fields: FieldsDefinition;
  uniqueFields: string[];
  isArchived: boolean;
  createdById: string;
  createdAt: Date;
  importCount?: number;
}

function fieldsOf(schema: ImportSchema): FieldsDefinition {
  return schema.fields as FieldsDefinition;
}

export function toImportSchemaView(schema: ImportSchema): ImportSchemaView {
  const fields = fieldsOf(schema);
  return {
    id: schema.id,
    projectId: schema.projectId,
    isGlobal: schema.projectId === null,
    name: schema.name,
    description: schema.description,
    fields,
    uniqueFields: uniqueFieldNames(fields),
    isArchived: schema.archivedAt !== null,
    createdById: schema.createdById,
    createdAt: schema.createdAt,
  };
}

export function toImportSchemaDetailView(schema: ImportSchemaWithCounts): ImportSchemaView {
  return { ...toImportSchemaView(schema), importCount: schema._count.imports };
}
