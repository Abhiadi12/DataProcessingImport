import { BaseError } from "./base.error.js";

export class UnauthorizedError extends BaseError {
  readonly statusCode = 401;
  readonly isOperational = true;
}
