// src/models/stateMaster.js
import mongoose from "mongoose";

const stateMasterSchema = new mongoose.Schema({
  state_id: { type: String, required: true, unique: true }, // e.g., "UP"
  state_name: { type: String, required: true }
}, { timestamps: true });

export const StateMaster = mongoose.model("StateMaster", stateMasterSchema);
