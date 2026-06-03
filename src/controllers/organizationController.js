// src/controllers/organizationController.js


import { Organization } from "../models/organizationModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Create Organization
export const createOrganization = async (req, res, next) => {
  try {
    const org = await Organization.create(req.body);
    return sendResponse(res, 201, true, "Organization created successfully", org, null, req);
  } catch (err) {
    next(err);
  }
};

// Get All Organizations
export const getOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find();
    return sendResponse(res, 200, true, "Organizations retrieved successfully", orgs, null, req);
  } catch (err) {
    next(err);
  }
};

// Get Organization by ID
export const getOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) throw new AppError(404, "Organization not found");
    return sendResponse(res, 200, true, "Organization retrieved successfully", org, null, req);
  } catch (err) {
    next(err);
  }
};

// Update Organization
export const updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!org) throw new AppError(404, "Organization not found");
    return sendResponse(res, 200, true, "Organization updated successfully", org, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete Organization
export const deleteOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) throw new AppError(404, "Organization not found");
    return sendResponse(res, 200, true, "Organization deleted successfully", null, null, req);
  } catch (err) {
    next(err);
  }
};


