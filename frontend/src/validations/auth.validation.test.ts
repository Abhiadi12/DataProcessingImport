import { describe, expect, it } from "vitest";
import { VALIDATION_MESSAGES } from "@/constants";
import { loginSchema, registerSchema } from "./auth.validation";

const validRegistration = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("loginSchema", () => {
  it("accepts an email and any non-empty password", () => {
    expect(loginSchema.safeParse({ email: "jane@example.com", password: "x" }).success).toBe(true);
  });

  it("trims a padded email instead of rejecting it", () => {
    const result = loginSchema.safeParse({ email: "  jane@example.com  ", password: "x" });

    expect(result.data?.email).toBe("jane@example.com");
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });

    expect(firstMessage(result)).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "jane@example.com", password: "" });

    expect(firstMessage(result)).toBe(VALIDATION_MESSAGES.PASSWORD_REQUIRED);
  });
});

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects a blank name", () => {
    const result = registerSchema.safeParse({ ...validRegistration, name: "   " });

    expect(firstMessage(result)).toBe(VALIDATION_MESSAGES.NAME_REQUIRED);
  });

  it("rejects a password that is too short", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: "short",
      confirmPassword: "short",
    });

    expect(firstMessage(result)).toBe(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT);
  });

  it("rejects a password that is too long", () => {
    const tooLong = "a".repeat(25);
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: tooLong,
      confirmPassword: tooLong,
    });

    expect(firstMessage(result)).toBe(VALIDATION_MESSAGES.PASSWORD_TOO_LONG);
  });

  it("rejects mismatched passwords on the confirm field", () => {
    const result = registerSchema.safeParse({ ...validRegistration, confirmPassword: "different" });

    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    expect(firstMessage(result)).toBe(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH);
  });
});
