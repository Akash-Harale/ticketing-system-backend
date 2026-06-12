// src/validators/roleValidator.js
import Joi from "joi";

export const roleSchema = Joi.object({
  role_name: Joi.string().valid(
    "PC",
    "PMU-Admin",
    "PMU-User",
    "NSS-Admin",
    "NSS-User",
    "SuperAdmin"
  ).required()
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});
