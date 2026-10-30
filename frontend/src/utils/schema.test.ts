import { describe, expect, it } from "vitest";
import { mockSchemaFields } from "@/testing/mockData";
import { splitFieldsByRequired } from "./schema";

describe("splitFieldsByRequired", () => {
  it("separates required and optional field names", () => {
    expect(splitFieldsByRequired(mockSchemaFields)).toEqual({
      required: ["email", "name"],
      optional: ["age"],
    });
  });
});
