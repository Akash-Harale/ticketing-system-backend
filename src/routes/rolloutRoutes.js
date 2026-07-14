// src/routes/rolloutRoutes.js
import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { createCampaignSchema, idSchema, querySchema, updateCampaignTargetsSchema, updateCampaignSchema } from "../validators/rolloutValidator.js";
import {
  createRollout,
  getRollouts,
  getRolloutById,
  updateRolloutByOrg,
  deleteRolloutByOrg,
  addCampaignTargets,
  updateRollout,
  deleteRollout,
  updateRolloutCampaign,
  sendIncompleteReminderEmail,
  sendSingleUnitReminder,
} from "../controllers/rolloutController.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply protect middleware to all routes in this router
router.use(protect);

// Create rollout
router.post("/", validateRequest({ body: createCampaignSchema }), createRollout);

// Get rollouts with filters
router.get("/", validateRequest({ query: querySchema }), getRollouts);

// Get rollout by ID
router.get("/:id", validateRequest({ params: idSchema }), getRolloutById);

// Add target states/districts to rollout campaign
router.put("/:id/target", validateRequest({ params: idSchema, body: updateCampaignTargetsSchema }), addCampaignTargets);

// Update rollout by ID
router.put("/:id", validateRequest({ params: idSchema }), updateRollout);

// Update rollout campaign by ID
router.put("/campaign/:campaignId", validateRequest({ body: updateCampaignSchema }), updateRolloutCampaign);

// Send reminder email to incomplete program units in campaign
router.post("/campaign/:campaignId/remind-incomplete", sendIncompleteReminderEmail);

// Send reminder email to a single unit coordinator
router.post("/org/:orgId/remind", sendSingleUnitReminder);

// Delete rollout by ID
router.delete("/:id", validateRequest({ params: idSchema }), deleteRollout);

// Update rollout by organization
router.put("/org/:orgn_id", updateRolloutByOrg);

// Delete rollout by organization
router.delete("/org/:orgn_id", deleteRolloutByOrg);

export const rolloutRoutes = router;
