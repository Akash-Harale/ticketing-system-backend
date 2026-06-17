import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Resource } from "../models/Resource.js";
import { Privilege } from "../models/Privilege.js";
import { Role } from "../models/Role.js";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // Fetch all privileges
    const privileges = await Privilege.find().populate("resource");

    const getPrivId = (resName, actionName) => {
      const p = privileges.find(
        (priv) =>
          priv.resource?.name?.toLowerCase() === resName.toLowerCase() &&
          priv.action?.toUpperCase() === actionName.toUpperCase()
      );
      if (!p) {
        console.warn(`Warning: Privilege not found for ${resName} - ${actionName}`);
      }
      return p ? p._id : null;
    };

    // Define correct privilege sets based on requirement
    // 1. PC (Program Unit Coordinator) should only see rollout
    const pcPrivs = [
      getPrivId("rollout", "READ"),
      getPrivId("rollout", "UPDATE")
    ].filter(Boolean);

    // 2. NSS_Admin (Some checked, some unchecked, no RBAC/admin settings)
    const nssAdminPrivs = [
      // Program Unit
      getPrivId("program_unit", "READ"),
      getPrivId("program_unit", "CREATE"),
      getPrivId("program_unit", "UPDATE"),
      // Users
      getPrivId("users", "READ"),
      getPrivId("users", "CREATE"),
      getPrivId("users", "UPDATE"),
      // Rollout
      getPrivId("rollout", "READ"),
      getPrivId("rollout", "CREATE"),
      getPrivId("rollout", "UPDATE"),
      getPrivId("rollout", "DELETE"),
      // Mediacorner
      getPrivId("mediacorner", "READ"),
      getPrivId("mediacorner", "CREATE"),
      getPrivId("mediacorner", "UPDATE"),
      getPrivId("mediacorner", "DELETE")
    ].filter(Boolean);

    // 3. NSS_User (Read-only access, no create/update/delete/RBAC)
    const nssUserPrivs = [
      getPrivId("program_unit", "READ"),
      getPrivId("users", "READ"),
      getPrivId("rollout", "READ"),
      getPrivId("mediacorner", "READ")
    ].filter(Boolean);

    // 4. PMU_Admin (Standard admin privileges, no RBAC)
    const pmuAdminPrivs = [
      getPrivId("program_unit", "READ"),
      getPrivId("program_unit", "CREATE"),
      getPrivId("program_unit", "UPDATE"),
      getPrivId("users", "READ"),
      getPrivId("users", "CREATE"),
      getPrivId("users", "UPDATE"),
      getPrivId("rollout", "READ"),
      getPrivId("rollout", "CREATE"),
      getPrivId("rollout", "UPDATE"),
      getPrivId("rollout", "DELETE"),
      getPrivId("mediacorner", "READ"),
      getPrivId("mediacorner", "CREATE"),
      getPrivId("mediacorner", "UPDATE"),
      getPrivId("mediacorner", "DELETE")
    ].filter(Boolean);

    // 5. PMU_User (Read-only access)
    const pmuUserPrivs = [
      getPrivId("program_unit", "READ"),
      getPrivId("users", "READ"),
      getPrivId("rollout", "READ"),
      getPrivId("mediacorner", "READ")
    ].filter(Boolean);

    // 6. Superadmin (all privileges including RBAC)
    const superadminPrivs = privileges.map(p => p._id);

    // Update Role documents in database
    const rolesConfig = [
      { name: "Porgram_unit_coordinator", privileges: pcPrivs },
      { name: "NSS_Admin", privileges: nssAdminPrivs },
      { name: "NSS_User", privileges: nssUserPrivs },
      { name: "PMU_Admin", privileges: pmuAdminPrivs },
      { name: "PMU_User", privileges: pmuUserPrivs },
      { name: "Superadmin", privileges: superadminPrivs }
    ];

    for (const cfg of rolesConfig) {
      const result = await Role.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${cfg.name}$`, "i") } },
        { privileges: cfg.privileges }
      );
      if (result) {
        console.log(`Updated role: ${cfg.name} (matched ${result.name}) with ${cfg.privileges.length} privileges`);
      } else {
        console.log(`Role not found in DB: ${cfg.name}`);
      }
    }

    console.log("RBAC matrix seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed RBAC matrix:", err);
    process.exit(1);
  }
})();
