// src/models/rolloutCampaign.js
import mongoose from "mongoose";

const rolloutCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  templateName: { type: String, default: "Master Template" },
  states: [{ type: String }],      // Stores targeted state names or IDs
  districts: [{ type: String }],   // Stores targeted district names or IDs
  status: { type: String, enum: ["Active", "Completed", "Draft"], default: "Active" },
  sentDate: { type: Date, default: Date.now },
  start_date: { type: Date },
  end_date: { type: Date }
}, { timestamps: true });

export const RolloutCampaign = mongoose.model("RolloutCampaign", rolloutCampaignSchema);
