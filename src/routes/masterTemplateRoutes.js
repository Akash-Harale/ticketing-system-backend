// src/routes/masterTemplateRoutes.js
/*
Example calls:

POST /api/mastertemplates → create a new template
GET /api/mastertemplates → list all templates
GET /api/mastertemplates/:id → fetch one by ID
PUT /api/mastertemplates/:id → update by ID
DELETE /api/mastertemplates/:id → delete by ID

With Query filters
Get all tasks:
    GET /api/mastertemplates

Filter by priority:
    GET /api/mastertemplates?priority=High

Search by name (case-insensitive regex):
    GET /api/mastertemplates?task_name=design
*/

import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { masterTemplateSchema, idSchema, querySchema } from "../validators/masterTemplateValidator.js";
import {
  createMasterTemplate,
  getMasterTemplates,
  getMasterTemplateById,
  updateMasterTemplate,
  deleteMasterTemplate,
} from "../controllers/masterTemplateController.js";

const router = express.Router();

// Create
router.post("/", validateRequest({ body: masterTemplateSchema }), createMasterTemplate);

// Read all with filters
router.get("/", validateRequest({ query: querySchema }), getMasterTemplates);

// Read by ID
router.get("/:id", validateRequest({ params: idSchema }), getMasterTemplateById);

// Update
router.put("/:id", validateRequest({ params: idSchema, body: masterTemplateSchema }), updateMasterTemplate);

// Delete
router.delete("/:id", validateRequest({ params: idSchema }), deleteMasterTemplate);

export const masterTemplateRoutes = router;

