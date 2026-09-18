import { BaseError } from "./base.error.js";

export class BadRequestError extends BaseError {
  readonly statusCode = 400;
  readonly isOperational = true;
}
