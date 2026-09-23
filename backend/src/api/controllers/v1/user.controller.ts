import type { NextFunction, Request, Response } from "express";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import type { ListUsersQuery, UserIdParam } from "../../schemas/v1/user.schema.js";
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

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.validatedQuery as ListUsersQuery;
    const users = await container.userService.listUsers(query);
    res.json(ok("Users fetched", users));
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.validatedParams as UserIdParam;
    const user = await container.userService.getProfile(id);
    res.json(ok("User fetched", user));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = req.user as { id: string; role: string };
    const { id } = req.validatedParams as UserIdParam;
    const user = await container.userService.updateUser(authUser.id, id, req.body);
    res.json(ok("User updated", user));
  } catch (error) {
    next(error);
  }
}
