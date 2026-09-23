import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import { RANK } from "../../config/role.config.js";

export function requireRole(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Not authenticated"));
      return;
    }

    if (RANK[req.user.role] < RANK[minimum]) {
      next(new ForbiddenError("You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
