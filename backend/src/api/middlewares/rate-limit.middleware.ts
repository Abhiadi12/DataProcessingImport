import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, LOGIN_RATE_LIMIT, REDIS_KEYS } from "../../constants/index.js";
import { container } from "../../container.js";
import { TooManyRequestsError } from "../../errors/too-many-requests.error.js";
import type { LoginInput } from "../../services/v1/auth.service.js";
import { rateLimitCheck } from "../../utils/rate-limit.js";

export async function loginRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as LoginInput;
    const { allowed, retryAfterSeconds } = await rateLimitCheck(
      container.redis,
      REDIS_KEYS.rateLimit(LOGIN_RATE_LIMIT.name, email),
      LOGIN_RATE_LIMIT.limit,
      LOGIN_RATE_LIMIT.windowSeconds,
    );

    if (!allowed) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
      throw new TooManyRequestsError(AUTH_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS, { retryAfterSeconds });
    }

    next();
  } catch (error) {
    next(error);
  }
}
