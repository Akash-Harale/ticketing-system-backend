// src/controllers/rolloutTaskController.js
import { Rollout } from "../models/rollout.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Add a task to an organization's rollout (picks latest active rollout if no campaign_id query is passed)
export const addTaskToOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const { campaign_id } = req.query;
    const body = req.body;

    const filter = { orgn_id };
    if (campaign_id) filter.campaign_id = campaign_id;

    const rollout = await Rollout.findOne(filter).sort({ createdAt: -1 });
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
    const { orgn_id, task_id } = req.params;
    const { task_priority, task_status } = req.query;

    // Find the correct rollout that has this task
    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

    // Get the task by ID
    let task = rollout.tasks.id(task_id);
    if (!task) throw new AppError(404, "Task not found");

    // Apply optional filters
    if (task_priority && task.task_priority !== task_priority) {
      return sendResponse(res, 404, false, "Task not found with given priority", null, null, req);
    }
    if (task_status && task.task_status !== task_status) {
      return sendResponse(res, 404, false, "Task not found with given status", null, null, req);
    }

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

    // Find the correct rollout that has this task
    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

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

    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

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
    const { orgn_id } = req.params;
    const { task_priority, task_status, campaign_id } = req.query;

    const filter = { orgn_id };
    if (campaign_id) filter.campaign_id = campaign_id;

    // Find rollouts by organization and optional campaign
    const rollouts = await Rollout.find(filter);
    if (!rollouts || rollouts.length === 0) {
      throw new AppError(404, "No rollouts found for organization");
    }

    // Extract all tasks
    let tasks = [];
    rollouts.forEach(r => {
      tasks.push(...r.tasks);
    });

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
