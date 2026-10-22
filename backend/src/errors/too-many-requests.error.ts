import { BaseError } from "./base.error.js";

export class TooManyRequestsError extends BaseError {
  readonly statusCode = 429;
  readonly isOperational = true;
}
