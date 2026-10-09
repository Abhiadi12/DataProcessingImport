import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { mockUserId } from "../testing/mockData/index.js";
import { signAccessToken, verifyAccessToken } from "./jwt.js";

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("signAccessToken / verifyAccessToken", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips: a token it signs verifies back to the same user id", () => {
    const token = signAccessToken(mockUserId);

    expect(verifyAccessToken(token)).toBe(mockUserId);
  });

  it("puts only sub, iat and exp in the payload", () => {
    const payload = jwt.decode(signAccessToken(mockUserId)) as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "sub"]);
    expect(payload.exp).toBe((payload.iat as number) + env.JWT_ACCESS_TTL_SECONDS);
  });

  it("rejects a token once its lifetime has passed", () => {
    // Fake timers replace the real clock, so the test can jump forward in time
    // instead of waiting 15 minutes.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = signAccessToken(mockUserId);

    vi.setSystemTime(new Date(Date.now() + (env.JWT_ACCESS_TTL_SECONDS + 1) * 1000));

    expect(() => verifyAccessToken(token)).toThrow("Access token expired");
  });

  it("rejects a token whose payload was edited after signing", () => {
    const [header, , signature] = signAccessToken(mockUserId).split(".");
    const forgedPayload = base64url({ sub: "someone-else", exp: 9999999999 });

    expect(() => verifyAccessToken(`${header}.${forgedPayload}.${signature}`)).toThrow(
      "Invalid access token",
    );
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({}, "some-other-secret-that-is-also-32-chars!", {
      subject: mockUserId,
      algorithm: "HS256",
    });

    expect(() => verifyAccessToken(token)).toThrow(UnauthorizedError);
  });

  // The classic JWT attack: declare "alg: none" and send no signature at all.
  it('rejects an unsigned "alg: none" token', () => {
    const token = `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ sub: mockUserId, exp: 9999999999 })}.`;

    expect(() => verifyAccessToken(token)).toThrow("Invalid access token");
  });

  it("rejects a correctly signed token that has no subject", () => {
    const token = jwt.sign({}, env.JWT_ACCESS_SECRET, { algorithm: "HS256" });

    expect(() => verifyAccessToken(token)).toThrow("Invalid access token");
  });

  it("rejects a string that isn't a JWT at all", () => {
    expect(() => verifyAccessToken("not.a.jwt")).toThrow(UnauthorizedError);
  });
});
