import type { NextFunction, Request, Response } from "express";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Not authenticated");
    const user = await container.userService.getProfile(req.user.id);
    res.json(ok("Profile fetched", user));
  } catch (error) {
    next(error);
  }
}
