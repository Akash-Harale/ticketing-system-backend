
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
// ── Model registration (side-effect imports) ────────────────────────────────
// These models are referenced via mongoose populate() in auth flows.
// Importing them here ensures Mongoose registers their schemas at startup.
import "./models/Privilege.js";
import "./models/Resource.js";
import { stateDistrictRoutes } from "./routes/stateDistrictRoutes.js";
import { roleRoutes } from "./routes/roleRoutes.js";

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
app.use("/api/roles", roleRoutes);

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
