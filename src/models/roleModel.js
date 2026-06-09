// src/models/roleModel.js
import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      enum: [
        "PC",          // Programme Coordinator
        "PMU-Admin",   // PMU Administrator
        "PMU-User",    // PMU Regular User
        "NSS-Admin",   // NSS Administrator
        "NSS-User",    // NSS Regular User
        "SuperAdmin"   // System-wide Super Administrator
      ],
      required: true
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);
