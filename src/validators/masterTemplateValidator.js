// src/validators/masterTemplateValidator.js
import Joi from "joi";

export const masterTemplateSchema = Joi.object({
  task_id: Joi.string().required(),
  task_name: Joi.string().min(3).required(),
  task_desc: Joi.string().allow(""),
  priority: Joi.string().valid("Low", "Medium", "High").default("Low"),
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const querySchema = Joi.object({
  priority: Joi.string().valid("Low", "Medium", "High"),
  task_name: Joi.string().min(1)
});

