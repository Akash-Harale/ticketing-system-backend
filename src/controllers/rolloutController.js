// src/controllers/rolloutController.js
import { Rollout } from "../models/rollout.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Create rollout
export const createRollout = async (req, res, next) => {
  try {
    const body = req.body;
    const record = await Rollout.create(body);
    return sendResponse(res, 201, true, "Rollout created successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Get rollouts with optional filters
export const getRollouts = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const { orgn_id, task_priority, task_status } = queryParams;

    const filter = {};
    if (orgn_id) filter.orgn_id = orgn_id;

    // Task-level filters
    let records = await Rollout.find(filter);

    if (task_priority || task_status) {
      records = records.map(r => {
        const filteredTasks = r.tasks.filter(t => {
          let match = true;
          if (task_priority) match = match && t.task_priority === task_priority;
          if (task_status) match = match && t.task_status === task_status;
          return match;
        });
        return { ...r.toObject(), tasks: filteredTasks };
      });
    }

    return sendResponse(res, 200, true, "Rollouts retrieved successfully", records, null, req);
  } catch (err) {
    next(err);
  }
};

// Get rollout by ID
export const getRolloutById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Rollout.findById(id);
    if (!record) throw new AppError(404, "Rollout not found");
    return sendResponse(res, 200, true, "Rollout retrieved successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Update rollout by orgn_id
export const updateRolloutByOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const body = req.body;
    const record = await Rollout.findOneAndUpdate({ orgn_id }, body, { new: true });
    if (!record) throw new AppError(404, "Rollout not found for organization");
    return sendResponse(res, 200, true, "Rollout updated successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete rollout by orgn_id
export const deleteRolloutByOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const record = await Rollout.findOneAndDelete({ orgn_id });
    if (!record) throw new AppError(404, "Rollout not found for organization");
    return sendResponse(res, 200, true, "Rollout deleted successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};
