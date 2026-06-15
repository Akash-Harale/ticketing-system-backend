// src/models/rollout.js
/* Example Document
{
  "_id": "665f1a2c9d1e4b1234567890",
  "orgn_id": "665f19f29d1e4b1234567888",
  "tasks": [
    {
      "task_id": "665f1a2c9d1e4b1234567891",
      "task_name": "Database Migration",
      "task_desc": "Move legacy DB to cloud",
      "task_priority": "High",
      "task_dependency": "Initial backup",
      "planned_start_date": "2026-06-05T00:00:00.000Z",
      "planned_end_date": "2026-06-10T00:00:00.000Z",
      "actual_start_date": null,
      "actual_end_date": null,
      "task_status": "Open",
      "tracking_comments": ""
    }
  ],
  "createdAt": "2026-06-02T12:00:00.000Z",
  "updatedAt": "2026-06-02T12:00:00.000Z"
}

*/
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  task_name: { type: String, required: true },
  task_desc: { type: String, default: "" },
  task_priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  task_dependency: { type: String, default: "" },
  planned_start_date: { type: Date },
  planned_end_date: { type: Date },
  actual_start_date: { type: Date },
  actual_end_date: { type: Date },
  task_status: {
    type: String,
    enum: ["Open", "Pending", "In-progress", "Complete", "Closed"],
    default: "Open"
  },
  tracking_comments: { type: String, default: "" }
}, { _id: false });

const rolloutSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: "RolloutCampaign", required: true },
  orgn_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  tasks: [taskSchema]
}, { timestamps: true });

export const Rollout = mongoose.model("Rollout", rolloutSchema);

