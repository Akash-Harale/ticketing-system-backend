// src/routes/roleRoutes.js
import express from "express";
import validateRequest from "../middleware/validateRequest.js";
import { roleSchema, idSchema } from "../validators/roleValidator.js";
import {
  createRole,
  getRoles,
  getRoleById,
  getRoleByRolename,
  updateRole,
  deleteRole
} from "../controllers/roleController.js";

const router = express.Router();

router.post("/", validateRequest({ body: roleSchema }), createRole);
router.get("/", getRoles);
router.get("/search", getRoleByRolename);
router.get("/:id", validateRequest({ params: idSchema }), getRoleById);
router.put("/:id", validateRequest({ params: idSchema, body: roleSchema }), updateRole);
router.delete("/:id", validateRequest({ params: idSchema }), deleteRole);

export const roleRoutes = router;

