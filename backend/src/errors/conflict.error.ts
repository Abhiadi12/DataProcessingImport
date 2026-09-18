import { BaseError } from "./base.error.js";

export class ConflictError extends BaseError {
  readonly statusCode = 409;
  readonly isOperational = true;
}
