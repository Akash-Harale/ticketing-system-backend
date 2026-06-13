// src/models/organizationModel.js

import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    orgn_id: {
      type: String,
      unique: true,
      required: [true, "Organization ID is required"],
      trim: true,
    },
    orgn_type: {
      type: String,
      enum: ["PU", "NSS", "PMU", "OTH"],
      required: [true, "Organization type is required"],
    },
    orgn_name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    orgn_address1: { type: String, trim: true },
    orgn_address2: { type: String, trim: true },
    orgn_place: { type: String, trim: true },
    orgn_district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DistrictMaster",        // references DistrcitMaster model
      required: true,
    },
    orgn_state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StateMaster",        // references DistrcitMaster model
      required: true,
    },
    orgn_pincode: {
      type: String,
      match: [/^\d{6}$/, "Pincode must be 6 digits"],
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema);
