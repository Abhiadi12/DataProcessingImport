import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../../utils/refresh-token-cookie.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await container.authService.register(req.body);
    res.status(201).json(ok(AUTH_MESSAGES.REGISTERED, user));
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken, ...session } = await container.authService.login(req.body);
    setRefreshTokenCookie(res, refreshToken);
    res.json(ok(AUTH_MESSAGES.LOGGED_IN, session));
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const presentedToken = readRefreshTokenCookie(req);
    if (!presentedToken) {
      throw new UnauthorizedError(AUTH_MESSAGES.MISSING_REFRESH_TOKEN);
    }

    const { refreshToken, ...session } = await container.authService.refresh(presentedToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json(ok(AUTH_MESSAGES.TOKEN_REFRESHED, session));
  } catch (error) {
    //INFO: A rejected refresh token is useless; clear it so the browser stops sending it.
    if (error instanceof UnauthorizedError) {
      clearRefreshTokenCookie(res);
    }
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await container.authService.logout(readRefreshTokenCookie(req));
    clearRefreshTokenCookie(res);
    res.json(ok(AUTH_MESSAGES.LOGGED_OUT));
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    await container.authService.logoutAll(req.user.id);
    clearRefreshTokenCookie(res);
    res.json(ok(AUTH_MESSAGES.LOGGED_OUT_EVERYWHERE));
  } catch (error) {
    next(error);
  }
}
