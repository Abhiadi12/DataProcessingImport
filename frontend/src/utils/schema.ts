import type { CreateImportSchemaInput, FieldsDefinition, SchemaFormValues } from "@/types";

export function splitFieldsByRequired(fields: FieldsDefinition): {
  required: string[];
  optional: string[];
} {
  const names = Object.keys(fields);
  return {
    required: names.filter((name) => fields[name]!.required),
    optional: names.filter((name) => !fields[name]!.required),
  };
}

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
