import { Ticket } from "../models/ticketModel.js";
import { TicketCounter } from "../models/ticketCounter.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Get the next ticket number (GET /api/tickets/counter)
export const getTicketCounter = async (req, res, next) => {
  try {
    const counter = await TicketCounter.findById("ticket_counter");
    const lastNumber = counter ? counter.lastTicketNumber : 1000;
    return sendResponse(res, 200, true, "Counter retrieved", { lastTicketNumber: lastNumber }, null, req);
  } catch (err) {
    next(err);
  }
};

// Create a new ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, ticketType, attachment } = req.body;

    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    const orgn_id = req.user.orgn_id || req.user.member_id?.organization;
    if (!orgn_id) {
      throw new AppError(403, "User is not associated with an organization");
    }

    // Atomically increment the counter and get next ticket number
    const counter = await TicketCounter.findByIdAndUpdate(
      "ticket_counter",
      { $inc: { lastTicketNumber: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const ticketNumber = counter.lastTicketNumber;

    const newTicket = await Ticket.create({
      ticketNumber,
      subject,
      description,
      ticketType,
      attachment,
      orgn_id,
      createdBy: req.user._id,
    });

    return sendResponse(res, 201, true, "Ticket created successfully", newTicket, null, req);
  } catch (err) {
    next(err);
  }
};

// Get all tickets (with RBAC logic)
export const getTickets = async (req, res, next) => {
  try {
    const { type, status, startDate, endDate, search } = req.query;

    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    const roleName = (req.user.role_id?.name || "").toLowerCase();

    // Check if user is a higher admin who can see all tickets
    const canSeeAll = ["superadmin", "nss admin", "nss_admin", "pmu admin", "pmu_admin"].includes(roleName);

    let filter = {};

    if (type) {
      filter.ticketType = type;
    }

    if (status) {
      filter.status = status;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // end of the end date day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (!canSeeAll) {
      const orgn_id = req.user.orgn_id || req.user.member_id?.organization;
      if (!orgn_id) {
        throw new AppError(403, "User is not associated with an organization");
      }
      filter.createdBy = req.user._id;
    }

    let query = Ticket.find(filter)
      .populate("orgn_id", "orgn_name orgn_type")
      .populate({
        path: "createdBy",
        select: "email member_id",
        populate: { path: "member_id", select: "name email" },
      })
      .populate({
        path: "resolvedBy",
        select: "email member_id",
        populate: { path: "member_id", select: "name email" },
      })
      .sort({ createdAt: -1 });

    const tickets = await query;

    // Apply search filter in memory (across subject, description, ticketNumber, creator)
    let result = tickets;
    if (search) {
      const s = search.toLowerCase();
      result = tickets.filter((t) => {
        const creatorName = (t.createdBy?.member_id?.name || "").toLowerCase();
        const creatorEmail = (t.createdBy?.email || t.createdBy?.member_id?.email || "").toLowerCase();
        return (
          t.subject?.toLowerCase().includes(s) ||
          t.description?.toLowerCase().includes(s) ||
          String(t.ticketNumber).includes(s) ||
          creatorEmail.includes(s) ||
          creatorName.includes(s)
        );
      });
    }

    return sendResponse(res, 200, true, "Tickets retrieved successfully", result, null, req);
  } catch (err) {
    next(err);
  }
};

// Update ticket status (Admin only — can resolve/change status)
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, statusDescription } = req.body;

    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    const roleName = (req.user.role_id?.name || "").toLowerCase();
    const isAdmin = ["superadmin", "nss admin", "nss_admin", "pmu admin", "pmu_admin"].includes(roleName);

    // Find the ticket first
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new AppError(404, "Ticket not found");
    }

    // Logic: ticket creator can close their own ticket; admins can resolve/change status
    const isCreator = String(ticket.createdBy) === String(req.user._id);

    if (status === "closed") {
      // Only the creator can close a ticket
      if (!isCreator) {
        throw new AppError(403, "Only the ticket creator can close this ticket");
      }
    } else {
      // Other status changes (open, in progress, resolved) are admin-only
      if (!isAdmin) {
        throw new AppError(403, "Only admins can change ticket status");
      }
    }

    if (!["open", "in progress", "resolved", "closed"].includes(status)) {
      throw new AppError(400, "Invalid status value");
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      {
        status,
        statusDescription: statusDescription || ticket.statusDescription,
        resolvedBy: req.user._id,
        statusUpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("orgn_id", "orgn_name orgn_type")
      .populate({
        path: "createdBy",
        select: "email member_id",
        populate: { path: "member_id", select: "name email" },
      })
      .populate({
        path: "resolvedBy",
        select: "email member_id",
        populate: { path: "member_id", select: "name email" },
      });

    return sendResponse(res, 200, true, "Ticket status updated successfully", updatedTicket, null, req);
  } catch (err) {
    next(err);
  }
};
