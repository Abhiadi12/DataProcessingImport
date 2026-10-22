import type { FieldsDefinition } from "@/types";

export const mockSchemaFields: FieldsDefinition = {
  email: { type: "string", required: true, unique: true },
  name: { type: "string", required: true, unique: false },
  age: { type: "integer", required: false, unique: false },
};
