// src/validators/stateDistrictValidator.js
import Joi from "joi";

export const stateSchema = Joi.object({
  state_id: Joi.string().required(),
  state_name: Joi.string().required()
});

export const districtSchema = Joi.object({
  state_id: Joi.string().required(),
  district_id: Joi.string().required(),
  district_name: Joi.string().required()
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

export const querySchema = Joi.object({
  state_id: Joi.string(),
  district_name: Joi.string()
});

