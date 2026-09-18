import { BaseError } from "./base.error.js";

export class InternalError extends BaseError {
  readonly statusCode = 500;
  readonly isOperational = false;
}
