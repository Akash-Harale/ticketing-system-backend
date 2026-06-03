// utils/AppError.js
/**
 * Custom application error class that carries an HTTP status code.
 * Distinguishes operational errors (expected, user-facing) from
 * programmer errors (bugs) so the global error handler can respond
 * appropriately.
 */
export class AppError extends Error {
  constructor(statusCode = 500, message = "Server error", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;       // optional extra context (e.g. Joi validation errors)
    this.isOperational = true;    // safe to expose to client
    Error.captureStackTrace(this, this.constructor);
  }
}

