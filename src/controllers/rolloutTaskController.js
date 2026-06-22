// src/controllers/rolloutTaskController.js
import { Rollout } from "../models/rollout.js";
import { User } from "../models/userModel.js";
import { Role } from "../models/Role.js";
import { MediaCorner } from "../models/mediaCornerModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Helper to notify a specific organization's coordinator
const notifyCoordinatorOfOrg = async (orgn_id, subject, description) => {
  try {
    // Find all coordinator roles
    const pcRoles = await Role.find({
      name: { $in: ["Porgram_unit_coordinator", "program_unit_coordinator", "Coordinator", "PC"] }
    });
    const pcRoleIds = pcRoles.map(r => r._id);

    // Find all coordinator users for this specific organization
    const coordinators = await User.find({
      orgn_id: orgn_id,
      role_id: { $in: pcRoleIds }
    });

    if (coordinators.length === 0) {
      return;
    }

    // For each coordinator, create a one-to-one notification
    const notificationsToCreate = coordinators.map(coord => ({
      media_header: subject,
      media_narration: description,
      media_type: "notification",
      notification_type: "one-to-one",
      recipient_id: coord.member_id || coord._id,
      is_read: false
    }));

    await MediaCorner.insertMany(notificationsToCreate);
  } catch (error) {
    console.error("Error creating task update notification for coordinator:", error);
  }
};

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

    const userRoleName = (req.user?.role_id?.name || "").toLowerCase();
    const isSuperadmin = userRoleName === "superadmin";
    const isCoordinator = userRoleName === "porgram_unit_coordinator" || 
                          userRoleName === "program_unit_coordinator" ||
                          userRoleName === "coordinator" || 
                          userRoleName === "pc";

    if (!isSuperadmin) {
      checkCoordinatorOrg(req, orgn_id);
    }

    // Find the correct rollout that has this task
    const rollout = await Rollout.findOne({ orgn_id, "tasks.task_id": task_id });
    if (!rollout) throw new AppError(404, "Task/Rollout not found for organization");

    // Get the task by ID using standard array find
    const task = rollout.tasks.find(t => t.task_id && t.task_id.toString() === task_id);
    if (!task) throw new AppError(404, "Task not found");

    const currentStatus = task.task_status;

    // Rule: PC cannot change task if status is Closed
    if (isCoordinator && currentStatus === "Closed") {
      throw new AppError(403, "This task is closed and cannot be modified by a coordinator.");
    }

    // Rule: PC cannot change status to Closed or Reopened
    if (isCoordinator && (body.task_status === "Closed" || body.task_status === "Reopened")) {
      throw new AppError(403, "Coordinators are not authorized to close or reopen tasks.");
    }

    // Normalize date inputs (empty strings to null)
    if (body.planned_start_date === "") body.planned_start_date = null;
    if (body.planned_end_date === "") body.planned_end_date = null;
    if (body.actual_start_date === "") body.actual_start_date = null;
    if (body.actual_end_date === "") body.actual_end_date = null;

    // Helper to compare values including dates and other values
    const isValueChanged = (newValue, oldValue) => {
      if (newValue === undefined) return false;
      if (newValue instanceof Date || oldValue instanceof Date || (typeof newValue === "string" && !isNaN(Date.parse(newValue)) && newValue.includes("-"))) {
        const t1 = newValue ? new Date(newValue).getTime() : null;
        const t2 = oldValue ? new Date(oldValue).getTime() : null;
        return t1 !== t2;
      }
      return newValue !== oldValue;
    };

    const hasStatusChanged = body.task_status !== undefined && body.task_status !== task.task_status;
    const hasNameChanged = isValueChanged(body.task_name, task.task_name);
    const hasDescChanged = isValueChanged(body.task_desc, task.task_desc);
    const hasPriorityChanged = isValueChanged(body.task_priority, task.task_priority);
    const hasDependencyChanged = isValueChanged(body.task_dependency, task.task_dependency);
    const hasCommentsChanged = body.remarks && task.remarks && body.remarks.length !== task.remarks.length;
    
    const hasDateChanged =
      isValueChanged(body.planned_start_date, task.planned_start_date) ||
      isValueChanged(body.planned_end_date, task.planned_end_date) ||
      isValueChanged(body.actual_start_date, task.actual_start_date) ||
      isValueChanged(body.actual_end_date, task.actual_end_date);

    const hasAnyChanged = hasStatusChanged || hasDateChanged || hasNameChanged || hasDescChanged || hasPriorityChanged || hasDependencyChanged || hasCommentsChanged;

    // Assign validated properties
    Object.assign(task, body);
    rollout.markModified("tasks");
    await rollout.save();

    // Check if updated by admin and status or date has changed
    const isAdmin = userRoleName === "superadmin" || 
                    userRoleName.endsWith("_admin") || 
                    userRoleName.includes("admin") ||
                    userRoleName === "nss-admin" || 
                    userRoleName === "pmu-admin";

    if (isAdmin && hasAnyChanged) {
      let subject = `Task "${task.task_name}" updated by Admin`;
      let details = [];

      if (hasStatusChanged) {
        subject = `Task "${task.task_name}" status updated to ${body.task_status}`;
        details.push(`Status changed from "${currentStatus}" to "${body.task_status}".`);
      }

      if (hasDateChanged) {
        if (!hasStatusChanged) {
          subject = `Task "${task.task_name}" schedule updated`;
        }
        details.push("Task scheduled/actual dates have been modified by the administrator.");
      }

      if (hasNameChanged || hasDescChanged || hasPriorityChanged || hasDependencyChanged || hasCommentsChanged) {
        if (!hasStatusChanged && !hasDateChanged) {
          subject = `Task "${task.task_name}" details updated`;
        }
        details.push("Task description, priority, comments or other details have been updated.");
      }

      const description = `The task "${task.task_name}" in your rollout has been updated. ${details.join(" ")}`;

      // Send notification to the coordinators of this organization (orgn_id)
      await notifyCoordinatorOfOrg(orgn_id, subject, description);
    }

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
