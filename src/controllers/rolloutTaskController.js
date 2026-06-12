// src/controllers/rolloutTaskController.js
import { Rollout } from "../models/rollout.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Add a task to an organization's rollout
export const addTaskToOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const body = req.body; // temp variable

    const rollout = await Rollout.findOne({ orgn_id });
    if (!rollout) throw new AppError(404, "Rollout not found for organization");

    rollout.tasks.push(body);
    await rollout.save();

    return sendResponse(res, 201, true, "Task added successfully", rollout, null, req);
  } catch (err) {
    next(err);
  }
};

// Fetch a specific task for an organization with optional filters
export const getTaskForOrg = async (req, res, next) => {
  try {
    const { orgn_id, task_id } = req.params;   // assign params to temp variables
    const { task_priority, task_status } = req.query; // optional query filters

    // Find rollout by organization
    const rollout = await Rollout.findOne({ orgn_id });
    if (!rollout) throw new AppError(404, "Rollout not found for organization");

    // Get the task by ID
    let task = rollout.tasks.id(task_id);
    if (!task) throw new AppError(404, "Task not found");

    // Apply optional filters:
    // If task_priority is provided, only return if it matches
    // If task_status is provided, only return if it matches
    if (task_priority && task.task_priority !== task_priority) {
      return sendResponse(res, 404, false, "Task not found with given priority", null, null, req);
    }
    if (task_status && task.task_status !== task_status) {
      return sendResponse(res, 404, false, "Task not found with given status", null, null, req);
    }

    // Return the task if it passes filters
    return sendResponse(res, 200, true, "Task retrieved successfully", task, null, req);
  } catch (err) {
    next(err);
  }
};

// Update a task for an organization
export const updateTaskForOrg = async (req, res, next) => {
  try {
    const { orgn_id, task_id } = req.params;
    const body = req.body;

    const rollout = await Rollout.findOne({ orgn_id });
    if (!rollout) throw new AppError(404, "Rollout not found for organization");

    const task = rollout.tasks.id(task_id);
    if (!task) throw new AppError(404, "Task not found");

    Object.assign(task, body);
    await rollout.save();

    return sendResponse(res, 200, true, "Task updated successfully", task, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete a task for an organization
export const deleteTaskForOrg = async (req, res, next) => {
  try {
    const { orgn_id, task_id } = req.params;

    const rollout = await Rollout.findOne({ orgn_id });
    if (!rollout) throw new AppError(404, "Rollout not found for organization");

    const task = rollout.tasks.id(task_id);
    if (!task) throw new AppError(404, "Task not found");

    task.remove();
    await rollout.save();

    return sendResponse(res, 200, true, "Task deleted successfully", null, null, req);
  } catch (err) {
    next(err);
  }
};


// Fetch all tasks for an organization with optional filters
export const getTasksForOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;            // assign param to temp variable
    const { task_priority, task_status } = req.query; // optional query filters

    // Find rollout by organization
    const rollout = await Rollout.findOne({ orgn_id });
    if (!rollout) throw new AppError(404, "Rollout not found for organization");

    // Start with all tasks
    let tasks = rollout.tasks;

    // Apply filters if provided
    if (task_priority) {
      tasks = tasks.filter(t => t.task_priority === task_priority);
    }
    if (task_status) {
      tasks = tasks.filter(t => t.task_status === task_status);
    }

    return sendResponse(res, 200, true, "Tasks retrieved successfully", tasks, null, req);
  } catch (err) {
    next(err);
  }
};
