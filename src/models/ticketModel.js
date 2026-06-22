import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
    },
    description: {
      type: String,
      required: [true, "Ticket description is required"],
    },
    ticketType: {
      type: String,
      enum: ["feedback", "issue"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in progress", "resolved", "closed"],
      default: "open",
    },
    attachment: {
      type: String,
      default: "",
    },
    orgn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
