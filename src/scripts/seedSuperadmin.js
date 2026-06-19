// src/scripts/seedSuperadmin.js
// Creates a Superadmin user (or resets if already exists).
// Run: npm run seed:superadmin

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";
import { Role } from "../models/Role.js";
import { Member } from "../models/memberModel.js";
import { User } from "../models/userModel.js";
import { Organization } from "../models/organizationModel.js";

const EMAIL    = "superadmin@gmail.com";
const PASSWORD = "nutan123";
const NAME     = "Super Admin";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // 1. Find or create the Superadmin role
    let role = await Role.findOne({ name: "Superadmin" });
    if (!role) {
      role = await Role.create({ name: "Superadmin", description: "Super Administrator with full access" });
      console.log("🔑 Created role: Superadmin");
    } else {
      console.log("🔑 Using existing role: Superadmin");
    }

    // 2. Find any organization to satisfy Member.organization (required field)
    //    Superadmin is not tied to any specific org, just pick the first available.
    let org = await Organization.findOne({});
    if (!org) {
      console.error("❌ No organizations found in DB.");
      console.error("   Run 'npm run seed:orgs' first, then retry.");
      process.exit(1);
    }

    // 3. Remove existing superadmin user + member if present
    const existingUser = await User.findOne({ email: EMAIL });
    if (existingUser) {
      await Member.findByIdAndDelete(existingUser.member_id);
      await User.findByIdAndDelete(existingUser._id);
      console.log("🗑️  Removed existing superadmin user\n");
    }

    // 4. Create Member
    const member = await Member.create({
      name:         NAME,
      email:        EMAIL,
      mobile:       "9999999999",
      role_id:      role._id,
      organization: org._id,
      designation:  "Super Administrator",
      active:       true,
    });

    // 5. Create User (plain password — pre-save hook hashes it)
    await User.create({
      email:     EMAIL,
      password:  PASSWORD,
      role_id:   role._id,
      orgn_id:   org._id,
      member_id: member._id,
    });

    console.log("✅ Superadmin created successfully!");
    console.log(`   Email   : ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
})();
