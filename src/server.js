// src/server.js

import dotenv from "dotenv";
dotenv.config();


import app from './app.js';
import { connectDB } from './config/db.js';



const multer = require('multer');
const morgan = require('morgan');

const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');


// Static Image Routes
// Define static path in .env file  22/Oct/2025
//const mediaCornerPath = process.env.MEDIA_CORNER_PATH || path.join(process.cwd(), 'uploads', 'media_corner');
const mediaCornerPath      = path.resolve(process.env.MEDIA_CORNER_PATH);

console.log('Media_Corner > Static Path from .env param: ', mediaCornerPath);

// Routes
const toolsMediaCornerRoutes = require('./routes/toolsMediaCornerRoutes');

const PORT = process.env.PORT || 5001;
let server;

// ── Start Server ─────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Startup aborted due to DB error: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
})();

// ── Graceful Shutdown ────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info("HTTP server closed");
    }

    await disconnectDB();
    logger.info("Database connection closed");

    process.exit(0);
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
