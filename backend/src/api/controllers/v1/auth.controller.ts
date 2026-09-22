import type { NextFunction, Request, Response } from "express";
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
    res.status(201).json(ok("Registration successful", user));
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken, ...session } = await container.authService.login(req.body);
    setRefreshTokenCookie(res, refreshToken);
    res.json(ok("Login successful", session));
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const presentedToken = readRefreshTokenCookie(req);
    if (!presentedToken) {
      throw new UnauthorizedError("Missing refresh token");
    }

    const { refreshToken, ...session } = await container.authService.refresh(presentedToken);
    setRefreshTokenCookie(res, refreshToken);
    res.json(ok("Token refreshed", session));
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
    res.json(ok("Logged out"));
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Not authenticated");
    await container.authService.logoutAll(req.user.id);
    clearRefreshTokenCookie(res);
    res.json(ok("Logged out of all sessions"));
  } catch (error) {
    next(error);
  }
}
