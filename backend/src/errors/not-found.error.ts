import { BaseError } from "./base.error.js";

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly isOperational = true;
}
