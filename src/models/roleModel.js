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

// NOTE: Registered as "RoleV2" to avoid conflict with Role.js which also
// registers the "Role" model name.  All roleController.js CRUD operations
// still work — they just operate on the "rolev2s" collection.
export const Role = mongoose.model("RoleV2", roleSchema);

