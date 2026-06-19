// src/validators/mediaCornerValidator.js

import Joi from "joi";
import { MEDIA_CORNER_TYPE_VALUES } from "../config/mediaCornerTypes.js";

// All valid types = KB types + "notification" (internal system type)
const ALL_TYPES = [...MEDIA_CORNER_TYPE_VALUES, "notification"];

export const mediaCornerSchema = Joi.object({
  media_header: Joi.string()
    .min(3)
    .max(150)
    .required()
    .messages({
      "string.empty": "Media header is required",
      "string.min": "Media header must be at least 3 characters",
      "string.max": "Media header cannot exceed 150 characters",
    }),

  media_narration: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      "string.empty": "Media narration is required",
      "string.min": "Media narration must be at least 10 characters",
      "string.max": "Media narration cannot exceed 1000 characters",
    }),

  media_url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .allow("", null)
    .optional()
    .messages({
      "string.uri": "Media URL must be a valid HTTP/HTTPS link",
    }),

  media_type: Joi.string()
    .valid(...ALL_TYPES)
    .required()
    .messages({
      "any.only": `Media type must be one of: ${ALL_TYPES.join(", ")}`,
    }),

  media_file: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif|mp4|mp3|pdf)$/i)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Media file must be a valid file type (jpg, jpeg, png, gif, mp4, mp3, pdf)",
    }),

  notification_type: Joi.string()
    .valid("broadcast", "one-to-one")
    .optional(),

  recipient_id: Joi.string()
    .hex()
    .length(24)
    .allow("", null)
    .optional(),

  is_read: Joi.boolean()
    .optional(),
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID must be a valid MongoDB ObjectId",
    "string.length": "ID must be 24 characters long",
  }),
});

export const querySchema = Joi.object({
  media_type: Joi.string()
    .valid(...ALL_TYPES)
    .optional()
    .messages({
      "any.only": `Query media_type must be one of: ${ALL_TYPES.join(", ")}`,
    }),
});

export const assetQuerySchema = Joi.object({
  media_file: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif|mp4|mp3|pdf)$/i)
    .optional()
    .messages({
      "string.pattern.base": "Asset media_file must be a valid file type (jpg, jpeg, png, gif, mp4, mp3, pdf)",
    }),
  media: Joi.string()
    .pattern(/\.(jpg|jpeg|png|gif|mp4|mp3|pdf)$/i)
    .optional()
    .messages({
      "string.pattern.base": "Asset media must be a valid file type (jpg, jpeg, png, gif, mp4, mp3, pdf)",
    }),
}).or("media_file", "media");
