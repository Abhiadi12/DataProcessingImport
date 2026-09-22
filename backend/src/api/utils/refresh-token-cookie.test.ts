import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  REFRESH_TOKEN_COOKIE,
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from "./refresh-token-cookie.js";

function fakeResponse() {
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  return res as typeof res & Response;
}

function requestWithCookies(cookies: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

describe("refresh token cookie", () => {
  it("is httpOnly, SameSite=Lax, scoped to the auth routes and expires with the token", () => {
    const res = fakeResponse();
    const expiresAt = new Date("2099-01-01T00:00:00Z");

    setRefreshTokenCookie(res, { value: "token-value", expiresAt });

    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "token-value",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/v1/auth",
        expires: expiresAt,
      }),
    );
  });

  it("is cleared with the same path it was set with", () => {
    const res = fakeResponse();

    clearRefreshTokenCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ path: "/api/v1/auth" }),
    );
  });

  it("reads the token, treating a missing or empty cookie as absent", () => {
    expect(readRefreshTokenCookie(requestWithCookies({ refresh_token: "abc" }))).toBe("abc");
    expect(readRefreshTokenCookie(requestWithCookies({}))).toBeUndefined();
    expect(readRefreshTokenCookie(requestWithCookies({ refresh_token: "" }))).toBeUndefined();
  });
});
