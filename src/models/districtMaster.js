
// src/models/districtMaster.js
import mongoose from "mongoose";

const districtMasterSchema = new mongoose.Schema({
  state_id: { type: String, required: true }, // reference to StateMaster.state_id
  district_id: { type: String, required: true, unique: true }, // e.g., "UP01"
  district_name: { type: String, required: true }
}, { timestamps: true });

export const DistrictMaster = mongoose.model("DistrictMaster", districtMasterSchema);
