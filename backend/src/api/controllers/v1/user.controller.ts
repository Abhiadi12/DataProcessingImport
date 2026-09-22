import type { NextFunction, Request, Response } from "express";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import { clearRefreshTokenCookie } from "../../utils/refresh-token-cookie.js";

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Not authenticated");
    const user = await container.userService.getProfile(req.user.id);
    res.json(ok("Profile fetched", user));
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Not authenticated");
    const user = await container.userService.updateProfile(req.user.id, req.body);
    res.json(ok("Profile updated", user));
  } catch (error) {
    next(error);
  }
}

export async function changeMyPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Not authenticated");
    await container.userService.changePassword(req.user.id, req.body);
    clearRefreshTokenCookie(res);
    res.json(ok("Password changed. Please log in again."));
  } catch (error) {
    next(error);
  }
}
