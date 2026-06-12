// src/routes/stateDistrictRoutes.js
import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { stateSchema, districtSchema, idSchema, querySchema } from "../validators/stateDistrictValidator.js";
import {
  createState, getStates, updateState, deleteState,
  createDistrict, getDistricts, getDistrictsByState, getDistrictByCompositeId, updateDistrictByCompositeId, deleteDistrictByCompositeId
} from "../controllers/stateDistrictController.js";

const router = express.Router();

// State routes
router.post("/states", validateRequest({ body: stateSchema }), createState);
router.get("/states", getStates);
router.put("/states/:id", validateRequest({ params: idSchema, body: stateSchema }), updateState);
router.delete("/states/:id", validateRequest({ params: idSchema }), deleteState);

// District routes
// Create district
router.post("/districts", validateRequest({ body: districtSchema }), createDistrict);

// Get districts (search by state_id or district_name)
router.get("/districts", validateRequest({ query: querySchema }), getDistricts);

// Get district by state_id + district_id
router.get("/states/:state_id/districts/:district_id", getDistrictByCompositeId);

// Update district by state_id + district_id
router.put("/states/:state_id/districts/:district_id", updateDistrictByCompositeId);

// Delete district by state_id + district_id
router.delete("/states/:state_id/districts/:district_id", deleteDistrictByCompositeId);

// Lookup endpoint: fetch all districts for a given state
router.get("/states/:state_id/districts", getDistrictsByState);

export const stateDistrictRoutes = router;
