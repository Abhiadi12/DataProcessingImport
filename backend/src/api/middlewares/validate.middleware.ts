import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { VALIDATION_MESSAGES } from "../../constants/index.js";
import { BadRequestError } from "../../errors/bad-request.error.js";

declare module "express-serve-static-core" {
  interface Request {
    validatedQuery?: unknown;
    validatedParams?: unknown;
  }
}

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        next(new BadRequestError(VALIDATION_MESSAGES.INVALID_BODY, result.error.flatten()));
        return;
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        next(new BadRequestError(VALIDATION_MESSAGES.INVALID_QUERY, result.error.flatten()));
        return;
      }
      req.validatedQuery = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        next(new BadRequestError(VALIDATION_MESSAGES.INVALID_PARAMS, result.error.flatten()));
        return;
      }
      req.validatedParams = result.data;
    }

    next();
  };
}
