// src/routes/rolloutTaskRoutes.js
/*
Example Usage
Get all tasks for an org:
GET /api/rollouttasks/org/665f19f29d1e4b1234567888/tasks

Filter by priority:
GET /api/rollouttasks/org/665f19f29d1e4b1234567888/tasks?task_priority=High

Filter by status:
GET /api/rollouttasks/org/665f19f29d1e4b1234567888/tasks?task_status=In-progress

Fetch one task with filters:
GET /api/rollouttasks/org/665f19f29d1e4b1234567888/tasks/665f1a2c9d1e4b1234567891?task_status=Open
*/
import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { rolloutSchema, querySchema } from "../validators/rolloutValidator.js";
import {
  addTaskToOrg,
  getTaskForOrg,
  updateTaskForOrg,
  deleteTaskForOrg,
} from "../controllers/rolloutTaskController.js";

const router = express.Router();

// Add a task
router.post("/org/:orgn_id/tasks", validateRequest({ body: rolloutSchema.extract("tasks") }), addTaskToOrg);

// Get a task
router.get("/org/:orgn_id/tasks/:task_id", getTaskForOrg);

// Update a task
router.put("/org/:orgn_id/tasks/:task_id", updateTaskForOrg);

// Delete a task
router.delete("/org/:orgn_id/tasks/:task_id", deleteTaskForOrg);

export const rolloutTaskRoutes = router;

