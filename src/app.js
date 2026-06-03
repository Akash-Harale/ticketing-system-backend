// ./app.js

import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
/*
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import rbacRoutes from './modules/rbac/rbac.routes.js';
import userRoutes from './modules/users/user.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: true, // Reflect the request origin — allows all origins
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/admin', express.static(path.join(__dirname, 'public')));

// ── DB connection middleware (serverless-safe) ───────────────────────────────
// On Vercel there is no persistent process, so server.js is never executed.
// This middleware ensures connectDB() is called (and cached) on every cold start.
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/users', userRoutes);

// Media Corner routes
// Serve static files from /uploads/media_corner
app.use('/media', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Static hit: ${req.originalUrl} from ${req.ip}`);
  next();
}, express.static(mediaCornerPath));
 // or below without logging the hits
//app.use('/media', express.static(mediaCornerPath));

app.use('/api/mediacorner', toolsMediaCornerRoutes);

// Health Check
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});


// ── 404 Handler  - catch-all ───────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Multer & File Upload Error Handling with requestId
app.use((err, req, res, next) => {
  const requestId = req.requestId || 'N/A';

  if (err instanceof multer.MulterError) {
    // Multer-specific errors (e.g., file too large)
    logger.warn(`[${requestId}] Multer error: ${err.message}`);
    return res.status(400).json({
      error: 'Multer error',
      details: err.message,
      requestId
    });
  }

  if (err.message === 'Only image files (JPEG/JPG/PNG/GIF) are allowed!') {
    // Custom file type error from your fileFilter
    logger.warn(`[${requestId}] Invalid file type: ${err.message}`);
    return res.status(400).json({
      error: 'Invalid file type',
      details: err.message,
      requestId
    });
  }

  if (err) {
    // Generic errors during upload
    logger.error(`[${requestId}] Upload error: ${err.message}`);
    return res.status(500).json({
      error: 'Server error',
      details: err.message,
      requestId
    });
  }

  next(); // Pass to next middleware if no error
});

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;

*/

// ./app.js
// src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { AppError } from "./utils/AppError.js";
import multer from "multer";
import { logger } from "./utils/logger.js";
import { requestId } from "./middleware/requestId.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { mediaCornerRoutes } from "./routes/mediaCornerRoutes.js";
import { organizationRoutes } from "./routes/organizationRoutes.js";
import { memberRoutes } from "./routes/memberRoutes.js";
import { sendResponse } from "./utils/sendResponse.js";
import { masterTemplateRoutes } from "./routes/masterTemplateRoutes.js";
import { rolloutRoutes } from "./routes/rolloutRoutes.js";
import { rolloutTaskRoutes } from "./routes/rolloutTaskRoutes.js";
import { MasterTemplate } from "./models/masterTemplate.js";
import { stateDistrictRoutes } from "./routes/stateDistrictRoutes.js";

const app = express();

// ── Global Middleware ───────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestId);

// Log incoming requests
app.use((req, res, next) => {
  logger.info(`[${req.requestId}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Static Path for Media Corner ────────────────────
const mediaCornerPath = path.resolve(process.env.MEDIA_CORNER_PATH || "uploads/media_corner");
logger.info(`Media_Corner > Static Path: ${mediaCornerPath}`);

app.use(
  "/media",
  (req, res, next) => {
    logger.debug(`[${req.requestId}] Static hit: ${req.originalUrl} from ${req.ip}`);
    next();
  },
  express.static(mediaCornerPath)
);

// ── Routes ─────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/mediacorner", mediaCornerRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/mastertemplates", masterTemplateRoutes);
app.use("/api/rollouts", rolloutRoutes);
app.use("/api/rollouttasks", rolloutTaskRoutes);
app.use("/api/location", stateDistrictRoutes);

// Health Check
app.get("/ping", (req, res) => {
  return sendResponse(res, 200, true, "Server is alive");
});

// ── 404 Handler ─────────────────────────────────────
app.use((req, res) => {
  return sendResponse(res, 404, false, `Route ${req.originalUrl} not found`);
});


// Handle uncaught exceptions (synchronous errors not caught anywhere)
process.on("uncaughtException", (err) => {
  logger.error(`[Process] Uncaught Exception: ${err.message}`, {
    type: err.constructor.name,
    stack: err.stack,
  });
  // Optionally exit after logging, depending on your tolerance
  process.exit(1);
});

// Handle unhandled promise rejections (async errors not caught)
process.on("unhandledRejection", (reason, promise) => {
  logger.error("[Process] Unhandled Rejection", {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : null,
    promise,
  });
  // Optionally exit after logging, depending on your tolerance
  process.exit(1);
});

// ── Global Error Handler (last) ─────────────────────
app.use(errorHandler);

export default app;
