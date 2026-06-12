// src/routes/memberRoutes.js
import express from "express";
import {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";
import validateRequest from "../middleware/validateRequest.js";
import { memberSchema, idSchema } from "../validators/memberValidator.js";

const router = express.Router();

router.post("/", validateRequest({ body: memberSchema }), createMember);
router.get("/", getMembers);
router.get("/:id", validateRequest({ params: idSchema }), getMemberById);
router.put("/:id", validateRequest({ params: idSchema, body: memberSchema }), updateMember);
router.delete("/:id", validateRequest({ params: idSchema }), deleteMember);

export const memberRoutes = router;
