import type { NextFunction, Request, Response } from "express";
import { COMMON_MESSAGES } from "../../constants/index.js";
import { BaseError } from "../../errors/base.error.js";
import { fail } from "../../utils/create-response.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isProduction = env.NODE_ENV === "production";

  if (err instanceof BaseError) {
    logger[err.isOperational ? "warn" : "error"](
      { err, requestId: req.requestId, details: err.details },
      err.message,
    );

    const message =
      err.isOperational || !isProduction ? err.message : COMMON_MESSAGES.INTERNAL_ERROR;
    res.status(err.statusCode).json(
      fail(message, {
        code: err.name,
        details: err.isOperational ? err.details : undefined,
      }),
    );
    return;
  }

  logger.error({ err, requestId: req.requestId }, "Unhandled error");

  const message = isProduction ? COMMON_MESSAGES.INTERNAL_ERROR : String(err);
  res.status(500).json(fail(message, { code: "InternalError" }));
}
