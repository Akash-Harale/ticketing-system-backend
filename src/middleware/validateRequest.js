// src/middleware/validateRequest.js
/*
// Named export (export const …) - good if you plan to export multiple helpers from the same file.
// But its not working in meiaCornerRoutes

import Joi from "joi";

export const validateRequest = (schemas) => (req, res, next) => {
  const sources = ["params", "query", "body"];

  for (const source of sources) {
    if (schemas[source]) {
      const { error } = schemas[source].validate(req[source]);
      if (error) {
        return res.status(400).json({
          success: false,
          status: 400,
          error: error.details[0].message,
        });
      }
    }
  }
  next();
};

*/

// src/middleware/validateRequest.js
// Changed to:  Default export (export default …) → simpler if you only ever export one function.
// To overcome mediaCornerRoutes issue -- validateRqest not found 

import { AppError } from "../utils/AppError.js";

const validateRequest = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        const { error } = schemas.body.validate(req.body, { abortEarly: false });
        if (error) {
          const details = error.details.reduce((acc, d) => {
            acc[d.path.join(".")] = d.message;
            return acc;
          }, {});
          throw new AppError(400, "Validation failed", details);
        }
      }

      if (schemas.params) {
        const { error } = schemas.params.validate(req.params);
        if (error) {
          throw new AppError(400, "Invalid request parameters", error.details);
        }
      }

      if (schemas.query) {
        const { error } = schemas.query.validate(req.query);
        if (error) {
          throw new AppError(400, "Invalid query parameters", error.details);
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validateRequest;
