import { BaseError } from "./base.error.js";

/**
 * 422 — the request was understood but is semantically wrong in a way the
 * client must fix. Used when an Idempotency-Key is reused with a different
 * body: not a validation failure of the body itself, so 400 would mislead.
 */
export class UnprocessableError extends BaseError {
  readonly statusCode = 422;
  readonly isOperational = true;
}
