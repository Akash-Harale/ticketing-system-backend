// src/routes/organizationRoutes.js
import express from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organizationController.js";

import  validateRequest from "../middleware/validateRequest.js";
import { organizationSchema, idSchema } from "../validators/organizationValidator.js";
import { checkPermission } from "../middleware/rbac.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authentication guard
router.use(protect);

// Authorization guard
router.post("/", validateRequest({ body: organizationSchema }), checkPermission("program_unit", "CREATE"), createOrganization);
router.get("/", getOrganizations);
router.get("/:id", validateRequest({ params: idSchema }), getOrganizationById);
router.put("/:id", validateRequest({ params: idSchema, body: organizationSchema }), updateOrganization);
router.delete("/:id", validateRequest({ params: idSchema }), deleteOrganization);

export const organizationRoutes = router;
