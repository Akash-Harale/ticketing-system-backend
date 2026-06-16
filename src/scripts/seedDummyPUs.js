import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";
import { Organization } from "../models/organizationModel.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nss-backend";

(async () => {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    const states = await StateMaster.find().sort({ state_name: 1 });
    console.log(`Found ${states.length} states in StateMaster.`);

    let createdCount = 0;
    for (const state of states) {
      // Find the first 2 districts for this state
      const districts = await DistrictMaster.find({ state_id: state.state_id })
        .sort({ district_name: 1 })
        .limit(2);

      for (const district of districts) {
        const orgnId = `PU_${state.state_id}_${district.district_id}`;
        
        // Check if already exists
        const existing = await Organization.findOne({ orgn_id: orgnId });
        if (existing) {
          continue;
        }

        await Organization.create({
          orgn_id: orgnId,
          orgn_type: "PU",
          orgn_name: `NSS Unit - ${district.district_name}`,
          orgn_district: district._id,
          orgn_state: state._id,
          orgn_pincode: "123456"
        });
        createdCount++;
      }
    }

    console.log(`\n✅ Seeded ${createdCount} dummy Program Units (PU) across all states and districts!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Seeding PUs failed:", err);
    process.exit(1);
  }
})();
