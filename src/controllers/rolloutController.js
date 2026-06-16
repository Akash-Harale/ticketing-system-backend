// src/controllers/rolloutController.js
import mongoose from "mongoose";
import { Rollout } from "../models/rollout.js";
import { RolloutCampaign } from "../models/rolloutCampaign.js";
import { MasterTemplate } from "../models/masterTemplate.js";
import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";
import { Organization } from "../models/organizationModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Helper to resolve state/district inputs to matching Organization (PU type) records
const resolveOrganizations = async (states, districts) => {
  let stateIds = [];
  let districtIds = [];

  // 1. Resolve States
  const stateObjIds = [];
  const stateNames = [];
  states.forEach(s => {
    if (mongoose.Types.ObjectId.isValid(s)) {
      stateObjIds.push(new mongoose.Types.ObjectId(s));
    } else {
      stateNames.push(s);
    }
  });

  if (stateObjIds.length > 0) {
    stateIds.push(...stateObjIds);
  }
  if (stateNames.length > 0) {
    const resolvedStates = await StateMaster.find({
      state_name: { $in: stateNames.map(name => new RegExp(`^${name}$`, "i")) }
    });
    stateIds.push(...resolvedStates.map(s => s._id));
  }

  // 2. Resolve Districts
  const districtObjIds = [];
  const districtNames = [];
  districts.forEach(d => {
    if (mongoose.Types.ObjectId.isValid(d)) {
      districtObjIds.push(new mongoose.Types.ObjectId(d));
    } else {
      districtNames.push(d);
    }
  });

  if (districtObjIds.length > 0) {
    districtIds.push(...districtObjIds);
  }
  if (districtNames.length > 0) {
    const resolvedDistricts = await DistrictMaster.find({
      district_name: { $in: districtNames.map(name => new RegExp(`^${name}$`, "i")) }
    });
    districtIds.push(...resolvedDistricts.map(d => d._id));
  }

  // 3. Query Organizations of type "PU" matching the states and districts
  const organizations = await Organization.find({
    orgn_type: "PU",
    orgn_state: { $in: stateIds },
    orgn_district: { $in: districtIds }
  });

  return organizations;
};

// Create rollout campaign and broadcast tasks
export const createRollout = async (req, res, next) => {
  try {
    const { title, states, districts, tasks } = req.body;

    // 1. Resolve targeted Program Units
    const targetOrgs = await resolveOrganizations(states, districts);
    if (!targetOrgs || targetOrgs.length === 0) {
      throw new AppError(404, "No matching Program Units (Organizations of type PU) found for the selected states and districts.");
    }

    // 2. Map tasks to Rollout taskSchema format
    let tasksToAssign = [];
    if (tasks && tasks.length > 0) {
      tasksToAssign = tasks.map(t => ({
        task_name: t.task_name,
        task_desc: t.task_desc || "",
        task_priority: t.task_priority || t.priority || "Low",
        task_dependency: t.task_dependency || "",
        planned_start_date: t.planned_start_date ? new Date(t.planned_start_date) : null,
        planned_end_date: t.planned_end_date ? new Date(t.planned_end_date) : null,
        task_status: "Open",
        tracking_comments: ""
      }));
    } else {
      // Fetch all tasks from MasterTemplate
      const masterTasks = await MasterTemplate.find();
      if (!masterTasks || masterTasks.length === 0) {
        throw new AppError(400, "No tasks found in MasterTemplate to broadcast. Please add tasks to MasterTemplate first.");
      }
      tasksToAssign = masterTasks.map(t => ({
        task_name: t.task_name,
        task_desc: t.task_desc || "",
        task_priority: t.priority || "Low",
        task_dependency: "",
        task_status: "Open",
        tracking_comments: ""
      }));
    }

    // 3. Create parent campaign record
    const campaign = await RolloutCampaign.create({
      title,
      states,
      districts,
      status: "Active",
      sentDate: new Date()
    });

    // 4. Create rollout document for each targeted Organization
    const rolloutsToCreate = targetOrgs.map(org => ({
      campaign_id: campaign._id,
      orgn_id: org._id,
      tasks: tasksToAssign
    }));

    await Rollout.insertMany(rolloutsToCreate);

    return sendResponse(res, 201, true, "Rollout campaign created and tasks broadcasted successfully", campaign, null, req);
  } catch (err) {
    next(err);
  }
};

// Get rollouts with optional filters (Admin views campaigns, Coordinator views assigned rollouts)
export const getRollouts = async (req, res, next) => {
  try {
    const { orgn_id, task_priority, task_status } = req.query;

    if (orgn_id) {
      // Coordinator view: get all rollouts for their organization
      let filter = { orgn_id };
      let records = await Rollout.find(filter).populate("campaign_id");

      // Apply task-level filters
      if (task_priority || task_status) {
        records = records.map(r => {
          const filteredTasks = r.tasks.filter(t => {
            let match = true;
            if (task_priority) match = match && t.task_priority === task_priority;
            if (task_status) match = match && t.task_status === task_status;
            return match;
          });
          return { ...r.toObject(), tasks: filteredTasks };
        });
      }
      return sendResponse(res, 200, true, "Organization rollouts retrieved successfully", records, null, req);
    }

    // Admin view: Aggregated campaigns with statistics for the dashboard
    const campaigns = await RolloutCampaign.find().sort({ createdAt: -1 });
    const records = [];

    for (const campaign of campaigns) {
      const rollouts = await Rollout.find({ campaign_id: campaign._id })
        .populate({
          path: "orgn_id",
          populate: [
            { path: "orgn_state" },
            { path: "orgn_district" }
          ]
        });

      const statesMap = {};
      let totalInstitutes = 0;

      for (const r of rollouts) {
        const org = r.orgn_id;
        if (!org) continue;

        totalInstitutes++;

        const state = org.orgn_state;
        const district = org.orgn_district;

        if (!state || !district) continue;

        const stateId = state._id.toString();
        const districtId = district._id.toString();

        if (!statesMap[stateId]) {
          statesMap[stateId] = {
            id: stateId,
            name: state.state_name || state.state_id,
            districts: {}
          };
        }

        if (!statesMap[stateId].districts[districtId]) {
          statesMap[stateId].districts[districtId] = {
            id: districtId,
            name: district.district_name || district.district_id,
            institutes: []
          };
        }

        statesMap[stateId].districts[districtId].institutes.push({
          id: org._id.toString(),
          name: org.orgn_name,
          type: org.orgn_type === "PU" ? "College" : "Institution"
        });
      }

      const statesArray = Object.values(statesMap).map(s => ({
        id: s.id,
        name: s.name,
        districts: Object.values(s.districts)
      }));

      records.push({
        id: campaign._id.toString(),
        title: campaign.title,
        templateName: campaign.templateName,
        sentDate: campaign.sentDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }),
        status: campaign.status,
        totalStates: statesArray.length,
        totalInstitutes,
        states: statesArray,
        tasks: rollouts[0]?.tasks || []
      });
    }

    return sendResponse(res, 200, true, "Rollout campaigns retrieved successfully", records, null, req);
  } catch (err) {
    next(err);
  }
};

// Get rollout by ID
export const getRolloutById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Rollout.findById(id).populate("campaign_id");
    if (!record) throw new AppError(404, "Rollout not found");
    return sendResponse(res, 200, true, "Rollout retrieved successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Update rollout by orgn_id
export const updateRolloutByOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const body = req.body;
    const record = await Rollout.findOneAndUpdate({ orgn_id }, body, { new: true });
    if (!record) throw new AppError(404, "Rollout not found for organization");
    return sendResponse(res, 200, true, "Rollout updated successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete rollout by orgn_id
export const deleteRolloutByOrg = async (req, res, next) => {
  try {
    const { orgn_id } = req.params;
    const record = await Rollout.findOneAndDelete({ orgn_id });
    if (!record) throw new AppError(404, "Rollout not found for organization");
    return sendResponse(res, 200, true, "Rollout deleted successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Add target states/districts to rollout campaign
export const addCampaignTargets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { states, districts } = req.body;

    const campaign = await RolloutCampaign.findById(id);
    if (!campaign) {
      throw new AppError(404, "Rollout campaign not found");
    }

    // 1. Resolve organizations for states & districts
    const resolvedOrgs = await resolveOrganizations(states, districts);
    if (!resolvedOrgs || resolvedOrgs.length === 0) {
      throw new AppError(400, "The selected states and districts do not contain any active Program Units. Please select a different scope.");
    }

    // 2. Find organizations that already have a Rollout for this campaign
    const existingRollouts = await Rollout.find({ campaign_id: id });
    const existingOrgIds = existingRollouts.map(r => r.orgn_id.toString());
    const resolvedOrgIds = resolvedOrgs.map(o => o._id.toString());

    // 3. Identify which ones to add (in resolved but not in existing)
    const orgIdsToAdd = resolvedOrgIds.filter(oid => !existingOrgIds.includes(oid));
    const orgsToAdd = resolvedOrgs.filter(org => orgIdsToAdd.includes(org._id.toString()));

    // 4. Identify which ones to remove (in existing but not in resolved)
    const orgIdsToRemove = existingOrgIds.filter(oid => !resolvedOrgIds.includes(oid));

    // 5. Delete rollouts for removed organizations
    if (orgIdsToRemove.length > 0) {
      await Rollout.deleteMany({
        campaign_id: id,
        orgn_id: { $in: orgIdsToRemove }
      });
    }

    // 6. Create Rollout documents for the new organizations
    if (orgsToAdd.length > 0) {
      let tasksToAssign = [];
      if (existingRollouts.length > 0) {
        tasksToAssign = existingRollouts[0].tasks.map(t => ({
          task_name: t.task_name,
          task_desc: t.task_desc,
          task_priority: t.task_priority,
          task_dependency: t.task_dependency || "",
          planned_start_date: t.planned_start_date,
          planned_end_date: t.planned_end_date,
          task_status: "Open",
          tracking_comments: ""
        }));
      } else {
        const masterTasks = await MasterTemplate.find();
        tasksToAssign = masterTasks.map(t => ({
          task_name: t.task_name,
          task_desc: t.task_desc || "",
          task_priority: t.priority || "Low",
          task_dependency: "",
          task_status: "Open",
          tracking_comments: ""
        }));
      }

      const rolloutsToCreate = orgsToAdd.map(org => ({
        campaign_id: id,
        orgn_id: org._id,
        tasks: tasksToAssign
      }));
      await Rollout.insertMany(rolloutsToCreate);
    }

    // 7. Update states and districts exactly
    campaign.states = states;
    campaign.districts = districts;
    await campaign.save();

    return sendResponse(res, 200, true, "Rollout campaign targets updated successfully", campaign, null, req);
  } catch (err) {
    next(err);
  }
};
