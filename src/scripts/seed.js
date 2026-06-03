// seed.js


import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import Role from "../models/roleModel.js";   // renamed file
import Organization from "../models/Organization.js";
import { Member } from "../models/memberModel.js";

(async () => {
  try {
    await connectDB();

    // Clear existing data
    await Role.deleteMany({});
    await Organization.deleteMany({});
    await Member.deleteMany({});

    // Seed Roles
    const roles = await Role.insertMany([
      { role_name: "SuperAdmin" },
      { role_name: "NSS-Admin" },
      { role_name: "NSS-User" },
      { role_name: "PMU-Admin" },
      { role_name: "PMU-User" },
      { role_name: "PC" }
    ]);

    // Helper: find role IDs by name
    const getRoleId = (name) => roles.find(r => r.role_name === name)._id;

    // Log all roles with IDs
    console.log("📌 Seeded Roles:");
    roles.forEach(r => console.log(`   ${r.role_name} → ${r._id}`));

    // Seed Organizations
    const orgs = await Organization.insertMany([
      {
        orgn_id: "ORG001",
        orgn_type: "NSS",
        orgn_name: "NSS Delhi University",
        orgn_address1: "North Campus",
        orgn_place: "Delhi",
        orgn_district: "Central Delhi",
        orgn_state: "Delhi",
        orgn_pincode: "110007"
      },
      {
        orgn_id: "ORG002",
        orgn_type: "NSS",
        orgn_name: "NSS Jawaharlal Nehru University",
        orgn_address1: "JNU Campus",
        orgn_place: "New Delhi",
        orgn_district: "South West Delhi",
        orgn_state: "Delhi",
        orgn_pincode: "110067"
      },
      {
        orgn_id: "ORG003",
        orgn_type: "PMU",
        orgn_name: "PMU Uttar Pradesh",
        orgn_address1: "Lucknow Secretariat",
        orgn_place: "Lucknow",
        orgn_district: "Lucknow",
        orgn_state: "Uttar Pradesh",
        orgn_pincode: "226001"
      }
    ]);

    // Seed Members (linked to Organizations + Roles)
    const members = await Member.insertMany([
      {
        name: "Amit Sharma",
        email: "amit.sharma@nssdu.in",
        role_id: getRoleId("NSS-Admin"),
        active: true,
        organization: orgs[0]._id
      },
      {
        name: "Priya Singh",
        email: "priya.singh@nssdu.in",
        role_id: getRoleId("NSS-User"),
        active: true,
        organization: orgs[0]._id
      },
      {
        name: "Ravi Kumar",
        email: "ravi.kumar@nssjnu.in",
        role_id: getRoleId("NSS-User"),
        active: true,
        organization: orgs[1]._id
      },
      {
        name: "Sneha Verma",
        email: "sneha.verma@pmuup.in",
        role_id: getRoleId("PMU-Admin"),
        active: true,
        organization: orgs[2]._id
      }
    ]);

    // Log members with their assigned role IDs
    console.log("Seeded Members with Role IDs:");
    members.forEach(m =>
      console.log(`   ${m.name} (${m.email}) → RoleID: ${m.role_id}, OrgID: ${m.organization}`)
    );

    console.log("Database seeded successfully with Roles, Organizations, and Members");
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
