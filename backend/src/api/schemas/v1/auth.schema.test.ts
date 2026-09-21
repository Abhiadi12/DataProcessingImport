import { describe, expect, it } from "vitest";
import { mockLoginInput, mockRegisterInput } from "../../../testing/mockData/index.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

function passwordError(result: ReturnType<typeof registerSchema.safeParse>) {
  return result.success ? undefined : result.error.flatten().fieldErrors.password;
}

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse(mockRegisterInput);

    expect(result.success).toBe(true);
  });

  it("trims and lowercases the email before validating it", () => {
    const result = registerSchema.parse({ ...mockRegisterInput, email: "  JOHN@Example.COM " });

    expect(result.email).toBe(mockRegisterInput.email);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...mockRegisterInput, email: "not-an-email" });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...mockRegisterInput, password: "short" });

    expect(passwordError(result)).toEqual(["Password must be at least 8 characters"]);
  });

  it("accepts a password of exactly 24 characters", () => {
    const result = registerSchema.safeParse({ ...mockRegisterInput, password: "a".repeat(24) });

    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("normalises the email the same way registration does", () => {
    const result = loginSchema.parse({ ...mockLoginInput, email: " JOHN@Example.com " });

    expect(result.email).toBe(mockLoginInput.email);
  });

  it("does not apply registration's password length rules", () => {
    const result = loginSchema.safeParse({ ...mockLoginInput, password: "x" });

    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ ...mockLoginInput, password: "" });

    expect(result.success).toBe(false);
  });
});
