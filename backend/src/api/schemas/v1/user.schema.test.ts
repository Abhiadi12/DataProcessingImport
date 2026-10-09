import { describe, expect, it } from "vitest";
import { mockNewPassword, mockPassword, mockUser } from "../../../testing/mockData/index.js";
import { changePasswordSchema, updateProfileSchema } from "./user.schema.js";

describe("updateProfileSchema", () => {
  it("accepts a name on its own", () => {
    expect(updateProfileSchema.safeParse({ name: "Johnny" }).success).toBe(true);
  });

  it("accepts an email on its own, normalised", () => {
    const result = updateProfileSchema.parse({ email: "  JOHN@Example.COM " });

    expect(result).toEqual({ email: mockUser.email });
  });

  it("rejects an empty body", () => {
    const result = updateProfileSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  // Privilege escalation guard: role is stripped, and with nothing left to
  // update the request is rejected rather than silently succeeding.
  it("rejects a body that only tries to change role", () => {
    const result = updateProfileSchema.safeParse({ role: "ADMIN" });

    expect(result.success).toBe(false);
  });

  it("strips fields that aren't editable, keeping the ones that are", () => {
    const result = updateProfileSchema.parse({ name: "Johnny", role: "ADMIN", isActive: true });

    expect(result).toEqual({ name: "Johnny" });
  });

  it("rejects a name that is only whitespace", () => {
    expect(updateProfileSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(updateProfileSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a current password and a valid new one", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: mockPassword,
      newPassword: mockNewPassword,
    });

    expect(result.success).toBe(true);
  });

  it("applies the same new-password rules as registration", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: mockPassword,
      newPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a new password identical to the current one, on the newPassword field", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: mockPassword,
      newPassword: mockPassword,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.newPassword).toEqual([
      "New password must be different from the current password",
    ]);
  });

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: mockNewPassword,
    });

    expect(result.success).toBe(false);
  });
});
