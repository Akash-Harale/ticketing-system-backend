// src/validators/rolloutValidator.js
import Joi from "joi";

const taskSchema = Joi.object({
  task_name: Joi.string().min(3).required(),
  task_desc: Joi.string().allow(""),
  task_priority: Joi.string().valid("Low", "Medium", "High").default("Low"),
  task_dependency: Joi.string().allow(""),
  planned_start_date: Joi.date().allow(null, "").optional(),
  planned_end_date: Joi.date().allow(null, "").optional(),
  actual_start_date: Joi.date().allow(null, "").optional(),
  actual_end_date: Joi.date().allow(null, "").optional(),
  task_status: Joi.string().valid("Open", "Pending", "In-progress", "Complete", "Closed").default("Open"),
  tracking_comments: Joi.string().allow("")
});

export const rolloutSchema = Joi.object({
  campaign_id: Joi.string().hex().length(24).required(),
  orgn_id: Joi.string().hex().length(24).required(),
  tasks: Joi.array().items(taskSchema)
});

export const createCampaignSchema = Joi.object({
  title: Joi.string().min(3).required(),
  states: Joi.array().items(Joi.string()).min(1).required(),
  districts: Joi.array().items(Joi.string()).min(1).required(),
  tasks: Joi.array().items(taskSchema).optional()
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const querySchema = Joi.object({
  orgn_id: Joi.string().hex().length(24),
  task_priority: Joi.string().valid("Low", "Medium", "High"),
  task_status: Joi.string().valid("Open", "Pending", "In-progress", "Complete", "Closed")
});

export const updateCampaignTargetsSchema = Joi.object({
  states: Joi.array().items(Joi.string()).min(1).required(),
  districts: Joi.array().items(Joi.string()).min(1).required(),
});
