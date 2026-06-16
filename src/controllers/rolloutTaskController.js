// src/controllers/rolloutTaskController.js
import { Rollout } from "../models/rollout.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Helper to check if coordinator has access to this organization's data
const checkCoordinatorOrg = (req, orgn_id) => {
  const userRoleName = (req.user?.role_id?.name || "").toLowerCase();
  const isCoordinator = userRoleName === "porgram_unit_coordinator" || 
                        userRoleName === "program_unit_coordinator" ||
                        userRoleName === "coordinator" || 
                        userRoleName === "pc";
  if (isCoordinator) {
    const org = req.user?.member_id?.organization || req.user?.orgn_id;
    const userOrgId = org?._id?.toString() || org?.toString();
    if (!userOrgId) {
      throw new AppError(403, "Access Denied: No organization is assigned to your coordinator account.");
    }
    if (orgn_id !== userOrgId) {
      throw new AppError(403, "Forbidden: You are not authorized to access tasks for other organizations.");
    }
  }
};

// Add a task to an organization's rollout (picks latest active rollout if no campaign_id query is passed)
export const addTaskToOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const { campaign_id } = req.query;
    const body = req.body;

    checkCoordinatorOrg(req, orgn_id);

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

    checkCoordinatorOrg(req, orgn_id);

    // Find the correct rollout that has this task
    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

    // Get the task by ID using standard array find
    const task = rollout.tasks.find(t => t.task_id && t.task_id.toString() === task_id);
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

    checkCoordinatorOrg(req, orgn_id);

    // Find the correct rollout that has this task
    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

    // Get the task by ID using standard array find
    const task = rollout.tasks.find(t => t.task_id && t.task_id.toString() === task_id);
    if (!task) throw new AppError(404, "Task not found");

    // Prevent coordinators from updating already completed or closed tasks
    const currentStatus = task.task_status;
    const userRoleName = (req.user?.role_id?.name || "").toLowerCase();
    const isCoordinator = userRoleName === "porgram_unit_coordinator" || 
                          userRoleName === "program_unit_coordinator" ||
                          userRoleName === "coordinator" || 
                          userRoleName === "pc";

    if (isCoordinator && (currentStatus === "Complete" || currentStatus === "Closed")) {
      throw new AppError(400, "This task is already completed/closed and cannot be modified.");
    }

    // Map optional remarks/tracking_comments from client
    if (body.remarks !== undefined) {
      body.tracking_comments = body.remarks;
    }

    // Required planned dates validations
    const plannedStart = body.planned_start_date || task.planned_start_date;
    const plannedEnd = body.planned_end_date || task.planned_end_date;

    if (!plannedStart) {
      throw new AppError(400, "Planned start date is required.");
    }
    if (!plannedEnd) {
      throw new AppError(400, "Planned end date is required.");
    }

    const pStart = new Date(plannedStart);
    const pEnd = new Date(plannedEnd);

    if (pEnd < pStart) {
      throw new AppError(400, "Planned end date cannot be less than planned start date.");
    }

    // Required actual dates validations
    const actualStart = body.actual_start_date;
    const actualEnd = body.actual_end_date;

    if (!actualStart) {
      throw new AppError(400, "Actual start date is required.");
    }
    if (!actualEnd) {
      throw new AppError(400, "Actual end date is required.");
    }

    const aStart = new Date(actualStart);
    const aEnd = new Date(actualEnd);

    if (aStart < pStart) {
      throw new AppError(400, "Actual start date cannot be less than planned start date.");
    }
    if (aEnd < aStart) {
      throw new AppError(400, "Actual end date cannot be less than actual start date.");
    }

    // Assign validated properties
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

    checkCoordinatorOrg(req, orgn_id);

    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

    const taskIndex = rollout.tasks.findIndex(t => t.task_id && t.task_id.toString() === task_id);
    if (taskIndex === -1) throw new AppError(404, "Task not found");

    rollout.tasks.splice(taskIndex, 1);
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

    checkCoordinatorOrg(req, orgn_id);

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
