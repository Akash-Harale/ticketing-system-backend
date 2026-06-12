// src/validators/rolloutValidator.js
import Joi from "joi";

const taskSchema = Joi.object({
  task_name: Joi.string().min(3).required(),
  task_desc: Joi.string().allow(""),
  task_priority: Joi.string().valid("Low", "Medium", "High").default("Low"),
  task_dependency: Joi.string().allow(""),
  planned_start_date: Joi.date(),
  planned_end_date: Joi.date(),
  actual_start_date: Joi.date(),
  actual_end_date: Joi.date(),
  task_status: Joi.string().valid("Open", "Pending", "In-progress", "Complete", "Closed").default("Open"),
  tracking_comments: Joi.string().allow("")
});

export const rolloutSchema = Joi.object({
  orgn_id: Joi.string().hex().length(24).required(),
  tasks: Joi.array().items(taskSchema)
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const querySchema = Joi.object({
  orgn_id: Joi.string().hex().length(24),
  task_priority: Joi.string().valid("Low", "Medium", "High"),
  task_status: Joi.string().valid("Open", "Pending", "In-progress", "Complete", "Closed")
});
