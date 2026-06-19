// src/scripts/seedOrganizations.js
// Seeds:
//   - 1 NSS organization  (national, placed in Delhi)
//   - 1 PMU organization  (national, placed in Delhi)
//   - 50 PU organizations per district (across all states)
//   - Appropriate users for each org
//
// All organizations will have a serial orgn_id like ORG_1, ORG_2, etc.
//
// Run: npm run seed:orgs

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";

import { Organization } from "../models/organizationModel.js";
import { Member } from "../models/memberModel.js";
import { User } from "../models/userModel.js";
import { Role } from "../models/Role.js";
import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";

// ─── Config ──────────────────────────────────────────────────────────────────
const DEFAULT_PASSWORD = "nutan123";
// NSS & PMU will be placed in Delhi (DL); fallback to first available state
const NSS_PMU_STATE_ID = "DL";
const PU_PER_DISTRICT = 1;

const ROLE_NAMES = [
  "Superadmin",
  "NSS_Admin",
  "NSS_User",
  "PMU_Admin",
  "PMU_User",
  "Porgram_unit_coordinator",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");

let serialOrgIdCounter = 1;
const nextOrgId = () => `ORG_${serialOrgIdCounter++}`;

// ─── Main ────────────────────────────────────────────────────────────────────
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // 1. Clear existing collections (keep StateMaster / DistrictMaster intact)
    console.log("🗑️  Clearing Users, Members, Organizations, Roles...");
    await User.deleteMany({});
    await Member.deleteMany({});
    await Organization.deleteMany({});
    await Role.deleteMany({});
    console.log("   Done.\n");

    // 2. Seed roles
    console.log("🔑 Seeding roles...");
    const roleMap = {};
    for (const name of ROLE_NAMES) {
      const role = await Role.create({ name, description: `System role: ${name}` });
      roleMap[name] = role._id;
      console.log(`   ✓ ${name}`);
    }
    console.log();

    // 3. Password
    const plainPassword = DEFAULT_PASSWORD;

    // 4. Resolve states and districts
    console.log("🗺️  Fetching states and districts from DB...");
    const states = await StateMaster.find({}, "_id state_id state_name").lean();
    const districts = await DistrictMaster.find({}, "_id state_id district_id district_name").lean();

    if (states.length === 0 || districts.length === 0) {
      console.error("❌ No states/districts found in DB. Run 'npm run seed:all' from scratch.");
      process.exit(1);
    }

    const locationIds = {};
    for (const s of states) {
      locationIds[s.state_id] = { _id: s._id.toString(), state_name: s.state_name, districts: {} };
    }
    for (const d of districts) {
      if (locationIds[d.state_id]) {
        locationIds[d.state_id].districts[d.district_id] = { _id: d._id.toString(), district_name: d.district_name };
      }
    }

    let baseStateEntry = locationIds[NSS_PMU_STATE_ID] || locationIds[Object.keys(locationIds)[0]];
    const baseDistrictKey = Object.keys(baseStateEntry.districts)[0];
    const baseDistrictEntry = baseStateEntry.districts[baseDistrictKey];
    const baseStateOid = new mongoose.Types.ObjectId(baseStateEntry._id);
    const baseDistrictOid = new mongoose.Types.ObjectId(baseDistrictEntry._id);

    // Arrays for fast batch insertion
    const organizationsToInsert = [];
    const membersToInsert = [];
    const usersToInsert = [];
    let puCount = 0;
    let mobileSeq = 9100000000;

    // Helper to generate bulk payload
    const enqueueUser = (name, email, mobile, role, orgId) => {
      const roleId = roleMap[role];
      const memberId = new mongoose.Types.ObjectId();

      membersToInsert.push({
        _id: memberId,
        name,
        email,
        mobile,
        role_id: roleId,
        organization: orgId,
        designation: role.replace(/_/g, " "),
        active: true,
      });

      usersToInsert.push({
        email,
        password: plainPassword,
        role_id: roleId,
        orgn_id: orgId,
        member_id: memberId,
      });
    };

    // 5. Create NSS org (1 national)
    console.log("🏛️  Generating NSS organization...");
    const nssOrgId = new mongoose.Types.ObjectId();
    organizationsToInsert.push({
      _id: nssOrgId,
      orgn_id: nextOrgId(),
      orgn_type: "NSS",
      orgn_name: "NSS National Headquarters",
      orgn_address1: "Ministry of Youth Affairs and Sports",
      orgn_place: "New Delhi",
      orgn_district: baseDistrictOid,
      orgn_state: baseStateOid,
      orgn_pincode: "110001",
    });
    enqueueUser("NSS Admin", "nss.admin.national@gmail.com", "9000000001", "NSS_Admin", nssOrgId);
    enqueueUser("NSS User", "nss.user.national@gmail.com", "9000000002", "NSS_User", nssOrgId);

    // 6. Create PMU org (1 national)
    console.log("🏛️  Generating PMU organization...");
    const pmuOrgId = new mongoose.Types.ObjectId();
    organizationsToInsert.push({
      _id: pmuOrgId,
      orgn_id: nextOrgId(),
      orgn_type: "PMU",
      orgn_name: "PMU National Office",
      orgn_address1: "Programme Management Unit",
      orgn_place: "New Delhi",
      orgn_district: baseDistrictOid,
      orgn_state: baseStateOid,
      orgn_pincode: "110001",
    });
    enqueueUser("PMU Admin", "pmu.admin.national@gmail.com", "9000000003", "PMU_Admin", pmuOrgId);
    enqueueUser("PMU User", "pmu.user.national@gmail.com", "9000000004", "PMU_User", pmuOrgId);

    // 7. Create 50 PU orgs per district
    console.log(`🏢 Generating ${PU_PER_DISTRICT} Program Unit organizations per district...`);
    for (const [stateId, stateData] of Object.entries(locationIds)) {
      const stateOid = new mongoose.Types.ObjectId(stateData._id);
      const stateName = stateData.state_name;
      const stateSlug = slugify(stateName);

      for (const [districtId, districtData] of Object.entries(stateData.districts)) {
        const districtOid = new mongoose.Types.ObjectId(districtData._id);
        const districtName = districtData.district_name;
        const districtSlug = slugify(districtName);

        for (let i = 1; i <= PU_PER_DISTRICT; i++) {
          const puOrgId = new mongoose.Types.ObjectId();
          
          organizationsToInsert.push({
            _id: puOrgId,
            orgn_id: nextOrgId(),
            orgn_type: "PU",
            orgn_name: `NSS Program Unit - ${districtName}, ${stateName}`,
            orgn_place: districtName,
            orgn_district: districtOid,
            orgn_state: stateOid,
            orgn_pincode: "000000",
          });

          // e.g. pc.maharashtra.pune@gmail.com
          const email = `pc.${stateSlug}.${districtSlug}@gmail.com`;
          const mobile = String(mobileSeq++);

          enqueueUser(`PC ${districtName}`, email, mobile, "Porgram_unit_coordinator", puOrgId);
          puCount++;
        }
      }
    }

    console.log(`\n📦 Batch inserting ${organizationsToInsert.length} Organizations, ${membersToInsert.length} Members, and ${usersToInsert.length} Users...`);
    console.log(`   (This might take a minute depending on your computer speed)`);
    
    // Insert in batches to prevent running out of memory for very large arrays
    const BATCH_SIZE = 5000;
    for(let i = 0; i < organizationsToInsert.length; i += BATCH_SIZE) {
      await Organization.insertMany(organizationsToInsert.slice(i, i + BATCH_SIZE));
    }
    for(let i = 0; i < membersToInsert.length; i += BATCH_SIZE) {
      await Member.insertMany(membersToInsert.slice(i, i + BATCH_SIZE));
    }
    
    // IMPORTANT: Users require pre-save hooks to hash passwords.
    // .insertMany() bypasses mongoose hooks by default.
    // However, Mongoose DOES execute save hooks on insertMany if you pass individual documents, or we can just loop and save.
    // For 37,500 documents, looping with Promise.all() in chunks is safest for hashing passwords.
    console.log("🔐 Hashing passwords and saving users... (this takes the longest)");
    for(let i = 0; i < usersToInsert.length; i += BATCH_SIZE) {
        const chunk = usersToInsert.slice(i, i + BATCH_SIZE);
        await Promise.all(chunk.map(u => User.create(u)));
        console.log(`   ... Saved ${Math.min(i + BATCH_SIZE, usersToInsert.length)} / ${usersToInsert.length} users`);
    }

    // 8. Summary
    console.log("\n─────────────────────────────────────────────────────────");
    console.log("✅ Seeding complete!");
    console.log(`   NSS orgs        : 1`);
    console.log(`   PMU orgs        : 1`);
    console.log(`   PU  orgs        : ${puCount} (${PU_PER_DISTRICT} per district)`);
    console.log(`   Total orgs      : ${organizationsToInsert.length}`);
    console.log(`   Total users     : ${usersToInsert.length}`);
    console.log(`   Default password: ${DEFAULT_PASSWORD}`);
    console.log("─────────────────────────────────────────────────────────\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    console.error(err);
    process.exit(1);
  }
};

run();
