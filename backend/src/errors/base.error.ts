export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  /**
   * true = anticipated failure, message safe to show the client (bad input, not found, conflict).
   * false = a bug; message is hidden from the client in production.
   */
  abstract readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace(this, new.target);
  }
}
