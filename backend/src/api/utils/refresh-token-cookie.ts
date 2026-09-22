import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import type { IssuedRefreshToken } from "../../services/v1/auth.service.js";

export const REFRESH_TOKEN_COOKIE = "refresh_token";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: "/api/v1/auth",
};

export function setRefreshTokenCookie(res: Response, token: IssuedRefreshToken): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token.value, { ...cookieOptions, expires: token.expiresAt });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
}

export function readRefreshTokenCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
