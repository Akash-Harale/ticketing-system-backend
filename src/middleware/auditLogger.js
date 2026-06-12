// src/middleware/auditLogger.js
import logger from "../utils/logger.js";

const auditLogger = (req, res, next) => {
  logger.info({
    action: req.method,
    endpoint: req.originalUrl,
    user: req.user ? req.user.id : "anonymous",
    timestamp: new Date().toISOString()
  });
  next();
};

export default auditLogger;

