import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Role } from "./src/models/Role.js";

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const roles = await Role.find();
  console.log("RBAC Roles:", roles);
  process.exit();
})();
