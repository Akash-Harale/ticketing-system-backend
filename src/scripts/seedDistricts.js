// scripts/seedDistricts.js
import mongoose from "mongoose";
import { DistrictMaster } from "../src/models/districtMaster.js";

const districts = [
  // Uttar Pradesh
  { state_id: "UP", district_id: "UP01", district_name: "Lucknow" },
  { state_id: "UP", district_id: "UP02", district_name: "Ghaziabad" },
  { state_id: "UP", district_id: "UP03", district_name: "Varanasi" },
  { state_id: "UP", district_id: "UP04", district_name: "Kanpur" },

  // Maharashtra
  { state_id: "MH", district_id: "MH01", district_name: "Mumbai" },
  { state_id: "MH", district_id: "MH02", district_name: "Pune" },
  { state_id: "MH", district_id: "MH03", district_name: "Nagpur" },

  // Delhi
  { state_id: "DL", district_id: "DL01", district_name: "New Delhi" },
  { state_id: "DL", district_id: "DL02", district_name: "South Delhi" },
  { state_id: "DL", district_id: "DL03", district_name: "North Delhi" }
  // Add more districts for each state similarly
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await DistrictMaster.insertMany(districts);
  console.log("Districts seeded successfully");
  process.exit();
})();
