// src/routes/rolloutRoutes.js
import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { rolloutSchema, idSchema, querySchema } from "../validators/rolloutValidator.js";
import {
  createRollout,
  getRollouts,
  getRolloutById,
  updateRolloutByOrg,
  deleteRolloutByOrg,
} from "../controllers/rolloutController.js";

const router = express.Router();

// Create rollout
router.post("/", validateRequest({ body: rolloutSchema }), createRollout);

// Get rollouts with filters
router.get("/", validateRequest({ query: querySchema }), getRollouts);

// Get rollout by ID
router.get("/:id", validateRequest({ params: idSchema }), getRolloutById);

// Update rollout by organization
router.put("/org/:orgn_id", updateRolloutByOrg);

// Delete rollout by organization
router.delete("/org/:orgn_id", deleteRolloutByOrg);

export const rolloutRoutes = router;
