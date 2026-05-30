/**
 * Custom application error class that carries an HTTP status code.
 * Distinguishes operational errors (expected, user-facing) from
 * programmer errors (bugs) so the global error handler can respond
 * appropriately.
 */
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;          // safe to expose to the client
        Error.captureStackTrace(this, this.constructor);
    }
}
