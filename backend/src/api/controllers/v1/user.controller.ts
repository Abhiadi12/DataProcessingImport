import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, USER_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import type { ListUsersQuery, UserIdParam } from "../../schemas/v1/user.schema.js";
import { clearRefreshTokenCookie } from "../../utils/refresh-token-cookie.js";

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const user = await container.userService.getProfile(req.user.id);
    res.json(ok(USER_MESSAGES.PROFILE_FETCHED, user));
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const user = await container.userService.updateProfile(req.user.id, req.body);
    res.json(ok(USER_MESSAGES.PROFILE_UPDATED, user));
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
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    await container.userService.changePassword(req.user.id, req.body);
    clearRefreshTokenCookie(res);
    res.json(ok(USER_MESSAGES.PASSWORD_CHANGED));
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.validatedQuery as ListUsersQuery;
    const users = await container.userService.listUsers(query);
    res.json(ok(USER_MESSAGES.USERS_FETCHED, users));
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.validatedParams as UserIdParam;
    const user = await container.userService.getProfile(id);
    res.json(ok(USER_MESSAGES.USER_FETCHED, user));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = req.user as { id: string; role: string };
    const { id } = req.validatedParams as UserIdParam;
    const user = await container.userService.updateUser(authUser.id, id, req.body);
    res.json(ok(USER_MESSAGES.USER_UPDATED, user));
  } catch (error) {
    next(error);
  }
}
