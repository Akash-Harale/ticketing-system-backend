import { Ticket } from "../models/ticketModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

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

    const newTicket = await Ticket.create({
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
    const { type } = req.query; // optional filter by ticketType
    
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

    if (!canSeeAll) {
      const orgn_id = req.user.orgn_id || req.user.member_id?.organization;
      if (!orgn_id) {
        throw new AppError(403, "User is not associated with an organization");
      }
      filter.orgn_id = orgn_id;
    }

    const tickets = await Ticket.find(filter)
      .populate("orgn_id", "orgn_name orgn_type")
      .populate("createdBy", "name email first_name last_name")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, "Tickets retrieved successfully", tickets, null, req);
  } catch (err) {
    next(err);
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    const roleName = (req.user.role_id?.name || "").toLowerCase();
    
    // Only PMU Admin can update the status
    if (roleName !== "pmu admin" && roleName !== "pmu_admin") {
      throw new AppError(403, "Only PMU Admin can update ticket status");
    }

    if (!["open", "in progress", "resolved", "closed"].includes(status)) {
      throw new AppError(400, "Invalid status value");
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTicket) {
      throw new AppError(404, "Ticket not found");
    }

    return sendResponse(res, 200, true, "Ticket status updated successfully", updatedTicket, null, req);
  } catch (err) {
    next(err);
  }
};
