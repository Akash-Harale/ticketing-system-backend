// src/controllers/masterTemplateController.js
import { MasterTemplate } from "../models/masterTemplate.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Create
export const createMasterTemplate = async (req, res, next) => {
  try {
    const body = req.body; // assign to temp variable
    const record = await MasterTemplate.create(body);
    return sendResponse(res, 201, true, "MasterTemplate created successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Read all with filters
export const getMasterTemplates = async (req, res, next) => {
  try {
    const queryParams = req.query; // assign to temp variable
    const { priority, task_name } = queryParams;

    const filter = {};
    if (priority) filter.priority = priority;
    if (task_name) filter.task_name = { $regex: task_name, $options: "i" };

    const records = await MasterTemplate.find(filter);
    return sendResponse(res, 200, true, "MasterTemplates retrieved successfully", records, null, req);
  } catch (err) {
    next(err);
  }
};

// Read by ID
export const getMasterTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params; // assign to temp variable
    const record = await MasterTemplate.findById(id);
    if (!record) throw new AppError(404, "MasterTemplate not found");
    return sendResponse(res, 200, true, "MasterTemplate retrieved successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Update
export const updateMasterTemplate = async (req, res, next) => {
  try {
    const { id } = req.params; // temp variable
    const body = req.body;     // temp variable
    const record = await MasterTemplate.findByIdAndUpdate(id, body, { new: true });
    if (!record) throw new AppError(404, "MasterTemplate not found");
    return sendResponse(res, 200, true, "MasterTemplate updated successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete
export const deleteMasterTemplate = async (req, res, next) => {
  try {
    const { id } = req.params; // temp variable
    const record = await MasterTemplate.findByIdAndDelete(id);
    if (!record) throw new AppError(404, "MasterTemplate not found");
    return sendResponse(res, 200, true, "MasterTemplate deleted successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

