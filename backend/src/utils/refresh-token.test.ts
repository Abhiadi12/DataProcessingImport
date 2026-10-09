import { describe, expect, it } from "vitest";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token.js";

describe("refresh token helpers", () => {
  it("generates a 256-bit URL-safe token (43 base64url characters)", () => {
    expect(generateRefreshToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("never generates the same token twice", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateRefreshToken));

    expect(tokens.size).toBe(1000);
  });

  it("hashes deterministically, so a presented token can be looked up by its hash", () => {
    expect(hashRefreshToken("abc")).toBe(hashRefreshToken("abc"));
    expect(hashRefreshToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives different tokens different hashes", () => {
    expect(hashRefreshToken("abc")).not.toBe(hashRefreshToken("abd"));
  });
});
