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

const router = express.Router();

router.post("/", validateRequest({ body: organizationSchema }), createOrganization);
router.get("/", getOrganizations);
router.get("/:id", validateRequest({ params: idSchema }), getOrganizationById);
router.put("/:id", validateRequest({ params: idSchema, body: organizationSchema }), updateOrganization);
router.delete("/:id", validateRequest({ params: idSchema }), deleteOrganization);

export const organizationRoutes = router;
