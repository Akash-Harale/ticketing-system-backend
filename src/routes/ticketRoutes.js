import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createTicket, getTickets, updateTicketStatus } from "../controllers/ticketController.js";

const router = express.Router();

router.use(protect);

router.post("/", createTicket);
router.get("/", getTickets);
router.patch("/:id/status", updateTicketStatus);

export const ticketRoutes = router;
