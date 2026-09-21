import type { NextFunction, Request, Response } from "express";
import { container } from "../../container.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import type { AuthenticatedUser } from "../../services/v1/auth.service.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  try {
    req.user = await container.authService.authenticate(token);
    next();
  } catch (error) {
    next(error);
  }
}
