// scripts/seedRoles.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Role } from "../models/roleModel.js";

const roles = [
  { role_name: "PC" },
  { role_name: "PMU-Admin" },
  { role_name: "PMU-User" },
  { role_name: "NSS-Admin" },
  { role_name: "NSS-User" },
  { role_name: "SuperAdmin" }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Role.deleteMany({});
    await Role.insertMany(roles);
    console.log("Roles seeded successfully");
    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
