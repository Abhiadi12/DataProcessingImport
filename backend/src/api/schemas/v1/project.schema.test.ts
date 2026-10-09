import { describe, expect, it } from "vitest";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from "../../../constants/index.js";
import { mockCreateProjectInput } from "../../../testing/mockData/index.js";
import {
  addProjectMemberSchema,
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "./project.schema.js";

describe("createProjectSchema", () => {
  it("accepts a name with an optional description", () => {
    expect(createProjectSchema.safeParse(mockCreateProjectInput).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: "Solo" }).success).toBe(true);
  });

  it("trims the name", () => {
    expect(createProjectSchema.parse({ name: "  Acme  " }).name).toBe("Acme");
  });

  it("rejects a missing or blank name", () => {
    expect(createProjectSchema.safeParse({}).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("enforces the length limits", () => {
    const name = "a".repeat(PROJECT_NAME_MAX_LENGTH + 1);
    const description = "d".repeat(PROJECT_DESCRIPTION_MAX_LENGTH + 1);

    expect(createProjectSchema.safeParse({ name }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "Acme", description }).success).toBe(false);
  });

  it("strips fields the client shouldn't control", () => {
    const result = createProjectSchema.parse({
      name: "Acme",
      id: "forged",
      createdAt: "yesterday",
    });

    expect(result).toEqual({ name: "Acme" });
  });
});

describe("updateProjectSchema", () => {
  it("accepts either field on its own", () => {
    expect(updateProjectSchema.safeParse({ name: "New" }).success).toBe(true);
    expect(updateProjectSchema.safeParse({ description: "New" }).success).toBe(true);
  });
});

describe("addProjectMemberSchema", () => {
  it("normalises the email the same way registration does", () => {
    expect(addProjectMemberSchema.parse({ email: "  SAM@Example.COM " }).email).toBe(
      "sam@example.com",
    );
  });

  it("rejects an invalid email", () => {
    expect(addProjectMemberSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("listProjectsQuerySchema", () => {
  it("defaults page and limit when the query is empty", () => {
    expect(listProjectsQuerySchema.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it("coerces the numeric strings a query string always carries", () => {
    expect(listProjectsQuerySchema.parse({ page: "2", limit: "50" })).toEqual({
      page: 2,
      limit: 50,
    });
  });

  it("caps limit and rejects a page below 1", () => {
    expect(listProjectsQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(listProjectsQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });
});
