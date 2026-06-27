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

    // Create Ticket resource if it doesn't exist
    let ticketRes = await Resource.findOne({ name: "Ticket" });
    if (!ticketRes) {
      ticketRes = await Resource.create({
        name: "Ticket",
        description: "Support tickets and feedback resource"
      });
      console.log("Created Ticket resource");
    }

    // Create privileges
    const actions = ["READ", "CREATE", "UPDATE", "DELETE"];
    for (const action of actions) {
      let priv = await Privilege.findOne({ resource: ticketRes._id, action });
      if (!priv) {
        await Privilege.create({
          name: `${action}_TICKET`,
          resource: ticketRes._id,
          action,
          description: `Allows ${action.toLowerCase()} operations on tickets`
        });
        console.log(`Created privilege ${action}_TICKET`);
      }
    }

    console.log("Ticket privileges seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed Ticket privileges:", err);
    process.exit(1);
  }
})();
