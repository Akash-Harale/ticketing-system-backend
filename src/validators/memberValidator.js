// memberValidator.js

import Joi from "joi";

export const memberSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  role_id: Joi.string().hex().length(24).required(), // references Role._id
  organization: Joi.string().hex().length(24).required(), // references Organization._id
  active: Joi.boolean().default(true)
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});
