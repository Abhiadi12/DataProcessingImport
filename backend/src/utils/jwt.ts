import jwt from "jsonwebtoken";
import { AUTH_MESSAGES, JWT_ALGORITHM } from "../constants/index.js";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    subject: userId,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [JWT_ALGORITHM] });
    if (typeof payload === "string" || !payload.sub) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_ACCESS_TOKEN);
    }
    return payload.sub;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError(AUTH_MESSAGES.ACCESS_TOKEN_EXPIRED);
    }
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_ACCESS_TOKEN);
  }
}
