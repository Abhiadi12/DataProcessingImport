import { BaseError } from "./base.error.js";

export class ForbiddenError extends BaseError {
  readonly statusCode = 403;
  readonly isOperational = true;
}
