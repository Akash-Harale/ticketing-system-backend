// seedIndiaDistricts.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";

const filePath = path.resolve("./src/scripts/districts.json");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const rawData = fs.readFileSync(filePath);
    const indiaData = JSON.parse(rawData);

    // Seed states
    const states = indiaData.states.map(s => ({
      state_id: s.state_id,
      state_name: s.state_name
    }));
    await StateMaster.deleteMany({});
    await StateMaster.insertMany(states);
    console.log("States seeded successfully");

    // Seed districts
    const districts = indiaData.states.flatMap(s =>
      s.districts.map(d => ({
        state_id: s.state_id,
        district_id: d.district_id,
        district_name: d.district_name
      }))
    );
    await DistrictMaster.deleteMany({});
    await DistrictMaster.insertMany(districts);
    console.log("Districts seeded successfully");

    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
