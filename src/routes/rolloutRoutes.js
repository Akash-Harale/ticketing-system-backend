// src/routes/rolloutRoutes.js
import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { createCampaignSchema, idSchema, querySchema, updateCampaignTargetsSchema } from "../validators/rolloutValidator.js";
import {
  createRollout,
  getRollouts,
  getRolloutById,
  updateRolloutByOrg,
  deleteRolloutByOrg,
  addCampaignTargets,
} from "../controllers/rolloutController.js";

const router = express.Router();

// Create rollout
router.post("/", validateRequest({ body: createCampaignSchema }), createRollout);

// Get rollouts with filters
router.get("/", validateRequest({ query: querySchema }), getRollouts);

// Get rollout by ID
router.get("/:id", validateRequest({ params: idSchema }), getRolloutById);

// Add target states/districts to rollout campaign
router.put("/:id/target", validateRequest({ params: idSchema, body: updateCampaignTargetsSchema }), addCampaignTargets);

// Update rollout by organization
router.put("/org/:orgn_id", updateRolloutByOrg);

// Delete rollout by organization
router.delete("/org/:orgn_id", deleteRolloutByOrg);

export const rolloutRoutes = router;
