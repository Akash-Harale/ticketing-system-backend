import Joi from "joi";

export const organizationSchema = Joi.object({
  orgn_id: Joi.string().required(),
  orgn_type: Joi.string().valid("NSS", "PMU", "PC", "OTH", "PU").required(),
  orgn_name: Joi.string().min(3).max(100).required(),
  orgn_address1: Joi.string().allow("", null),
  orgn_address2: Joi.string().allow("", null),
  orgn_place: Joi.string().allow("", null),
  orgn_district: Joi.string().allow("", null),
  orgn_state: Joi.string().required(),
  orgn_pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),

  // Coordinator details (required when creating a Program Unit)
  coordinator: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  }).optional(),
});

export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});
