// error.middleware.js

/*
import jwt from "jsonwebtoken";
import { createLogger, format, transports } from "winston";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Winston logger setup
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" })
  ]
});

// Global error handler
export const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();

  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? "Something went wrong";

  // JWT errors
  if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Session expired. Please log in again.";
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    const fields = Object.values(err.errors).map((e) => e.message);
    message = fields.join(", ");
  }

  // Duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    message = `${field} already exists.`;
  }

  // CastError (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field "${err.path}".`;
  }

  // Log with correlationId
  logger.error({
    correlationId,
    statusCode,
    message,
    stack: err.stack,
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Use unified sendResponse
  return sendResponse(res, statusCode, false, message, null, {
    correlationId,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

*/

// src/middleware/error.middleware.js
import { sendResponse } from "../utils/sendResponse.js";
import multer from "multer";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Server error";
  const requestId = req.requestId || "N/A";

  // Log differently based on error type
  if (err instanceof multer.MulterError) {
    logger.warn(`[${requestId}] Multer error: ${err.message}`, { path: req.originalUrl });
    return sendResponse(res, 400, false, "Multer error", null, err.message, req);
  }

  if (err instanceof AppError) {
    if (status === 400) {
      // Validation or bad request → warn
      logger.warn(`[${requestId}] Validation/AppError: ${message}`, {
        details: err.details,
        path: req.originalUrl,
      });
    } else {
      // System/operational errors → error
      logger.error(`[${requestId}] AppError: ${message}`, {
        details: err.details,
        path: req.originalUrl,
      });
    }
    return sendResponse(res, status, false, message, null, err.details || null, req);
  }

  // Fallback for unexpected errors
  logger.error(`[${requestId}] Unexpected error: ${message}`, {
    stack: err.stack,
    path: req.originalUrl,
  });
  return sendResponse(res, status, false, message, null, err.stack, req);
};
