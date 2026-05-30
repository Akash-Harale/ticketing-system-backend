import jwt from 'jsonwebtoken';

/**
 * Global error-handling middleware.
 * Must have exactly 4 parameters so Express treats it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    // Default to 500 Internal Server Error
    let statusCode = err.statusCode ?? 500;
    let message = err.message ?? 'Something went wrong';

    // ── JWT errors ──────────────────────────────────────────────────────────
    if (err instanceof jwt.TokenExpiredError) {
        statusCode = 401;
        message = 'Session expired. Please log in again.';
    } else if (err instanceof jwt.JsonWebTokenError) {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    }

    // ── Mongoose validation errors ──────────────────────────────────────────
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const fields = Object.values(err.errors).map((e) => e.message);
        message = fields.join(', ');
    }

    // ── Mongoose duplicate key ──────────────────────────────────────────────
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
        message = `${field} already exists.`;
    }

    // ── Mongoose CastError (invalid ObjectId, etc.) ─────────────────────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value for field "${err.path}".`;
    }

    // Never leak stack traces in production
    const response = { message };
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
