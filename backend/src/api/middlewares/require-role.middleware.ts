import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import { AUTH_MESSAGES, ROLE_RANK, USER_MESSAGES } from "../../constants/index.js";

export function requireRole(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED));
      return;
    }

    if (ROLE_RANK[req.user.role] < ROLE_RANK[minimum]) {
      next(new ForbiddenError(USER_MESSAGES.FORBIDDEN));
      return;
    }

    next();
  };
}
