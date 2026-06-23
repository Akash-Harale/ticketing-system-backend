import mongoose from "mongoose";

const ticketCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    lastTicketNumber: {
      type: Number,
      required: true,
      default: 1000,
    },
  },
  { timestamps: true }
);

export const TicketCounter = mongoose.model("TicketCounter", ticketCounterSchema);
