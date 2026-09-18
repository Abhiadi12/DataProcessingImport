import type { NextFunction, Request, Response } from "express";
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
  if (err instanceof BaseError) {
    logger[err.isOperational ? "warn" : "error"](
      { err, requestId: req.requestId, details: err.details },
      err.message,
    );

    res.status(err.statusCode).json(
      fail(err.message, {
        code: err.name,
        details: err.isOperational ? err.details : undefined,
      }),
    );
    return;
  }

  logger.error({ err, requestId: req.requestId }, "Unhandled error");

  const message = env.NODE_ENV === "production" ? "Internal server error" : String(err);
  res.status(500).json(fail(message, { code: "InternalError" }));
}
