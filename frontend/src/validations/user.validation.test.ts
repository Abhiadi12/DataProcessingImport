import { describe, expect, it } from "vitest";
import { VALIDATION_MESSAGES } from "@/constants";
import { changePasswordSchema, updateProfileSchema } from "./user.validation";

const validPasswordChange = {
  currentPassword: "old-password",
  newPassword: "new-password-1",
  confirmNewPassword: "new-password-1",
};

describe("updateProfileSchema", () => {
  it("accepts a name and email, trimming both", () => {
    const result = updateProfileSchema.safeParse({
      name: "  Jane Doe ",
      email: " jane@example.com ",
    });

    expect(result.data).toEqual({ name: "Jane Doe", email: "jane@example.com" });
  });

  it("rejects a blank name", () => {
    const result = updateProfileSchema.safeParse({ name: " ", email: "jane@example.com" });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.NAME_REQUIRED);
  });

  it("rejects a name longer than the limit", () => {
    const result = updateProfileSchema.safeParse({
      name: "a".repeat(101),
      email: "jane@example.com",
    });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.NAME_TOO_LONG);
  });

  it("rejects a malformed email", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane", email: "jane@" });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(validPasswordChange).success).toBe(true);
  });

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({ ...validPasswordChange, currentPassword: "" });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED);
  });

  it("rejects a new password that is too short", () => {
    const result = changePasswordSchema.safeParse({
      ...validPasswordChange,
      newPassword: "short",
      confirmNewPassword: "short",
    });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT);
  });

  it("rejects a new password equal to the current one, on the new password field", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmNewPassword: "same-password",
    });

    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.NEW_PASSWORD_MUST_DIFFER);
  });

  it("rejects a mismatched confirmation, on the confirm field", () => {
    const result = changePasswordSchema.safeParse({
      ...validPasswordChange,
      confirmNewPassword: "something-else",
    });

    expect(result.error?.issues[0]?.path).toEqual(["confirmNewPassword"]);
    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH);
  });
});
