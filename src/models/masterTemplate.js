// src/models/masterTemplate.js

import mongoose from "mongoose";

const masterTemplateSchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: true,
    unique: true,
  },
  task_name: {
    type: String,
    required: true,
    minlength: 3,
  },
  task_desc: {
    type: String,
    default: "",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low",
  },
}, { timestamps: true });

export const MasterTemplate = mongoose.model("MasterTemplate", masterTemplateSchema);
