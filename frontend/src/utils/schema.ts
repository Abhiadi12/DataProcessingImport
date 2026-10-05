import type { CreateImportSchemaInput, SchemaFormValues } from "@/types";

export function toCreateSchemaInput({
  name,
  description,
  fields,
}: SchemaFormValues): CreateImportSchemaInput {
  return {
    name,
    ...(description ? { description } : {}),
    fields: Object.fromEntries(
      fields.map(({ name: fieldName, type, required, unique }) => [
        fieldName,
        { type, required, unique },
      ]),
    ),
  };
}
