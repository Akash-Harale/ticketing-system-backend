// scripts/seedStates.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { StateMaster } from "../models/stateMaster.js";

const states = [
  { state_id: "AP", state_name: "Andhra Pradesh" },
  { state_id: "AR", state_name: "Arunachal Pradesh" },
  { state_id: "AS", state_name: "Assam" },
  { state_id: "BR", state_name: "Bihar" },
  { state_id: "CG", state_name: "Chhattisgarh" },
  { state_id: "GA", state_name: "Goa" },
  { state_id: "GJ", state_name: "Gujarat" },
  { state_id: "HR", state_name: "Haryana" },
  { state_id: "HP", state_name: "Himachal Pradesh" },
  { state_id: "JH", state_name: "Jharkhand" },
  { state_id: "KA", state_name: "Karnataka" },
  { state_id: "KL", state_name: "Kerala" },
  { state_id: "MP", state_name: "Madhya Pradesh" },
  { state_id: "MH", state_name: "Maharashtra" },
  { state_id: "MN", state_name: "Manipur" },
  { state_id: "ML", state_name: "Meghalaya" },
  { state_id: "MZ", state_name: "Mizoram" },
  { state_id: "NL", state_name: "Nagaland" },
  { state_id: "OD", state_name: "Odisha" },
  { state_id: "PB", state_name: "Punjab" },
  { state_id: "RJ", state_name: "Rajasthan" },
  { state_id: "SK", state_name: "Sikkim" },
  { state_id: "TN", state_name: "Tamil Nadu" },
  { state_id: "TS", state_name: "Telangana" },
  { state_id: "TR", state_name: "Tripura" },
  { state_id: "UP", state_name: "Uttar Pradesh" },
  { state_id: "UK", state_name: "Uttarakhand" },
  { state_id: "WB", state_name: "West Bengal" },
  { state_id: "AN", state_name: "Andaman and Nicobar Islands" },
  { state_id: "CH", state_name: "Chandigarh" },
  { state_id: "DN", state_name: "Dadra and Nagar Haveli and Daman and Diu" },
  { state_id: "DL", state_name: "Delhi" },
  { state_id: "JK", state_name: "Jammu and Kashmir" },
  { state_id: "LA", state_name: "Ladakh" },
  { state_id: "LD", state_name: "Lakshadweep" },
  { state_id: "PY", state_name: "Puducherry" }
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await StateMaster.insertMany(states);
  console.log("States seeded successfully");
  process.exit();
})();
