import { createHash } from "node:crypto";
import {
  requiredFieldNames,
  uniqueFieldNames,
  type FieldDefinition,
  type FieldsDefinition,
} from "./import-schema.definition.js";

export interface FieldError {
  field: string;
  message: string;
}

export type RowResult =
  | { ok: true; data: Record<string, unknown>; dedupeHash: Uint8Array<ArrayBuffer> }
  | { ok: false; errors: FieldError[] };

export interface CompiledSchema {
  requiredFields: string[];
  uniqueFields: string[];
  allFields: string[];
  processRow: (raw: Record<string, string | undefined>) => RowResult;
}

type Coercer = (value: string) => { ok: true; value: unknown } | { ok: false; message: string };

function coercerFor(definition: FieldDefinition): Coercer {
  switch (definition.type) {
    case "string":
      return (value) => ({ ok: true, value });
    case "number":
      return (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed)
          ? { ok: true, value: parsed }
          : { ok: false, message: "Expected a number" };
      };
    case "integer":
      return (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return { ok: false, message: "Expected an integer" };
        if (!Number.isInteger(parsed)) return { ok: false, message: "Expected a whole number" };
        return { ok: true, value: parsed };
      };
    case "boolean":
      return (value) => {
        const normalised = value.toLowerCase();
        if (["true", "1", "yes", "y"].includes(normalised)) return { ok: true, value: true };
        if (["false", "0", "no", "n"].includes(normalised)) return { ok: true, value: false };
        return { ok: false, message: "Expected a boolean" };
      };
    case "date":
      return (value) => {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime())
          ? { ok: false, message: "Expected a date" }
          : { ok: true, value: parsed.toISOString() };
      };
  }
}

/**
 * INFO: Turns a stored field definition into functions that validate, transform and
 * hash a row.
 *
 * CALL THIS ONCE PER IMPORT, never per row. All the per-field decisions —
 * which coercer, whether it is required, whether it feeds the hash — are
 * resolved here, so `processRow` does no interpretation at all. Rebuilding this
 * five million times would dominate the runtime of a large import.
 */
export function compileSchema(fields: FieldsDefinition): CompiledSchema {
  const entries = Object.entries(fields);

  const compiledFields = entries.map(([name, definition]) => ({
    name,
    required: definition.required,
    unique: definition.unique,
    isString: definition.type === "string",
    coerce: coercerFor(definition),
  }));

  const uniqueFields = uniqueFieldNames(fields);
  const requiredFields = requiredFieldNames(fields);

  function processRow(raw: Record<string, string | undefined>): RowResult {
    const errors: FieldError[] = [];
    const data: Record<string, unknown> = {};

    for (const field of compiledFields) {
      const rawValue = raw[field.name]?.trim() ?? "";

      if (rawValue === "") {
        if (field.required) {
          errors.push({ field: field.name, message: "Required" });
        } else {
          //INFO: Absent optional field stored explicitly as null, so every row for a
          // schema has the same shape in JSONB.
          data[field.name] = null;
        }
        continue;
      }

      const normalised = field.isString && field.unique ? rawValue.toLowerCase() : rawValue;

      const coerced = field.coerce(normalised);
      if (!coerced.ok) {
        errors.push({ field: field.name, message: coerced.message });
        continue;
      }
      data[field.name] = coerced.value;
    }

    if (errors.length > 0) return { ok: false, errors };

    return { ok: true, data, dedupeHash: hashOf(data, uniqueFields) };
  }

  return { requiredFields, uniqueFields, allFields: entries.map(([name]) => name), processRow };
}

export function hashOf(
  data: Record<string, unknown>,
  uniqueFields: string[],
): Uint8Array<ArrayBuffer> {
  const values = uniqueFields.map((name) => data[name]);
  const digest = createHash("sha256").update(JSON.stringify(values), "utf8").digest();

  return new Uint8Array(digest);
}
