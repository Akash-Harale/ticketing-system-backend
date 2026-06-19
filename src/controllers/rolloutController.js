// src/controllers/rolloutController.js
import mongoose from "mongoose";
import { Rollout } from "../models/rollout.js";
import { RolloutCampaign } from "../models/rolloutCampaign.js";
import { MasterTemplate } from "../models/masterTemplate.js";
import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";
import { Organization } from "../models/organizationModel.js";
import { User } from "../models/userModel.js";
import { Role } from "../models/Role.js";
import { MediaCorner } from "../models/mediaCornerModel.js";
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

// Helper to notify program unit coordinators when a rollout is created or assigned
const notifyCoordinators = async (targetOrgs, campaignTitle) => {
  try {
    const targetOrgIds = targetOrgs.map(org => org._id);

    // Find all coordinator roles
    const pcRoles = await Role.find({
      name: { $in: ["Porgram_unit_coordinator", "program_unit_coordinator", "Coordinator", "PC"] }
    });
    const pcRoleIds = pcRoles.map(r => r._id);

    // Find all coordinator users in the target organizations
    const coordinators = await User.find({
      orgn_id: { $in: targetOrgIds },
      role_id: { $in: pcRoleIds }
    });

    if (coordinators.length === 0) {
      return;
    }

    // For each coordinator, create a one-to-one notification
    const notificationsToCreate = coordinators.map(coord => ({
      media_header: "You are the part of new rollout please complete tasks.",
      media_narration: `A new rollout campaign "${campaignTitle}" has been created/assigned to your Program Unit. Please complete the tasks in this rollout.`,
      media_type: "notification",
      notification_type: "one-to-one",
      recipient_id: coord.member_id || coord._id,
      is_read: false
    }));

    await MediaCorner.insertMany(notificationsToCreate);
  } catch (error) {
    console.error("Error creating notifications for coordinators:", error);
  }
};

// Create rollout campaign and broadcast tasks
export const createRollout = async (req, res, next) => {
  try {
    const { title, states, districts, tasks, start_date, end_date } = req.body;

    // 1. Resolve targeted Program Units
    const targetOrgs = await resolveOrganizations(states, districts);
    if (!targetOrgs || targetOrgs.length === 0) {
      throw new AppError(404, "No matching Program Units (Organizations of type PU) found for the selected states and districts.");
    }

    const campaignStart = start_date ? new Date(start_date) : null;
    const campaignEnd = end_date ? new Date(end_date) : null;

    if (campaignStart && campaignEnd && campaignEnd < campaignStart) {
      throw new AppError(400, "Rollout end date cannot be less than start date.");
    }

    // 2. Map tasks to Rollout taskSchema format
    let tasksToAssign = [];
    if (tasks && tasks.length > 0) {
      tasksToAssign = tasks.map(t => {
        if (!t.task_id) {
          throw new AppError(400, `Task ID is required for task "${t.task_name}".`);
        }
        if (!t.planned_start_date) {
          throw new AppError(400, `Planned start date is required for task "${t.task_name}".`);
        }
        if (!t.planned_end_date) {
          throw new AppError(400, `Planned end date is required for task "${t.task_name}".`);
        }
        const pStart = new Date(t.planned_start_date);
        const pEnd = new Date(t.planned_end_date);
        if (pEnd < pStart) {
          throw new AppError(400, `Planned end date cannot be less than planned start date for task "${t.task_name}".`);
        }

        if (campaignStart && pStart < campaignStart) {
          throw new AppError(400, `Planned start date for task "${t.task_name}" must be on or after the rollout start date.`);
        }
        if (campaignEnd && pEnd > campaignEnd) {
          throw new AppError(400, `Planned end date for task "${t.task_name}" must be on or before the rollout end date.`);
        }

        return {
          task_id: t.task_id,
          task_name: t.task_name,
          task_desc: t.task_desc || "",
          task_priority: t.task_priority || t.priority || "Low",
          task_dependency: t.task_dependency || "",
          planned_start_date: pStart,
          planned_end_date: pEnd,
          task_status: "Open",
          tracking_comments: ""
        };
      });
    } else {
      throw new AppError(400, "Planned tasks configuration with start and end dates is required to broadcast rollout.");
    }

    // 3. Create parent campaign record
    const campaign = await RolloutCampaign.create({
      title,
      states,
      districts,
      status: "Active",
      sentDate: new Date(),
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined
    });

    // 4. Create rollout document for each targeted Organization
    const rolloutsToCreate = targetOrgs.map(org => ({
      campaign_id: campaign._id,
      orgn_id: org._id,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      tasks: tasksToAssign
    }));

    await Rollout.insertMany(rolloutsToCreate);

    // Notify program unit coordinators
    await notifyCoordinators(targetOrgs, campaign.title);

    return sendResponse(res, 201, true, "Rollout campaign created and tasks broadcasted successfully", campaign, null, req);
  } catch (err) {
    next(err);
  }
};

// Get rollouts with optional filters (Admin views campaigns, Coordinator views assigned rollouts)
export const getRollouts = async (req, res, next) => {
  try {
    const { orgn_id, task_priority, task_status } = req.query;

    const userRoleName = (req.user?.role_id?.name || "").toLowerCase();
    const isCoordinator = userRoleName === "porgram_unit_coordinator" || 
                          userRoleName === "program_unit_coordinator" ||
                          userRoleName === "coordinator" || 
                          userRoleName === "pc";

    let targetOrgnId = orgn_id;
    if (isCoordinator) {
      const org = req.user?.member_id?.organization || req.user?.orgn_id;
      const userOrgId = org?._id?.toString() || org?.toString();
      if (!userOrgId) {
        throw new AppError(403, "Access Denied: No organization is assigned to your coordinator account.");
      }
      targetOrgnId = userOrgId;
    }

    if (targetOrgnId) {
      // Coordinator view: get all rollouts for their organization
      let filter = { orgn_id: targetOrgnId };
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
          type: org.orgn_type === "PU" ? "College" : "Institution",
          rolloutId: r._id.toString(),
          start_date: r.start_date,
          end_date: r.end_date,
          tasks: r.tasks
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
        start_date: campaign.start_date,
        end_date: campaign.end_date,
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

// Update rollout by ID
export const updateRollout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.body;

    if (start_date && end_date) {
      if (new Date(end_date) < new Date(start_date)) {
        throw new AppError(400, "Rollout end date cannot be less than start date.");
      }
    }

    const record = await Rollout.findByIdAndUpdate(id, req.body, { new: true });
    if (!record) throw new AppError(404, "Rollout not found");
    return sendResponse(res, 200, true, "Rollout updated successfully", record, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete rollout by ID
export const deleteRollout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Rollout.findByIdAndDelete(id);
    if (!record) throw new AppError(404, "Rollout not found");
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

      // Notify new program unit coordinators
      await notifyCoordinators(orgsToAdd, campaign.title);
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

// Update rollout campaign and tasks globally
export const updateRolloutCampaign = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { title, start_date, end_date, tasks } = req.body;

    const campaign = await RolloutCampaign.findById(campaignId);
    if (!campaign) {
      throw new AppError(404, "Rollout campaign not found");
    }

    const campaignStart = start_date ? new Date(start_date) : null;
    const campaignEnd = end_date ? new Date(end_date) : null;

    if (campaignStart && campaignEnd && campaignEnd < campaignStart) {
      throw new AppError(400, "Rollout end date cannot be less than start date.");
    }

    // Validation: task planned dates must be within overall rollout dates
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        if (!t.task_id) {
          throw new AppError(400, `Task ID is required for task "${t.task_name}".`);
        }
        const pStart = t.planned_start_date ? new Date(t.planned_start_date) : null;
        const pEnd = t.planned_end_date ? new Date(t.planned_end_date) : null;

        if (pStart && pEnd && pEnd < pStart) {
          throw new AppError(400, `Planned end date cannot be less than planned start date for task "${t.task_name}".`);
        }

        if (campaignStart) {
          if (!pStart || pStart < campaignStart) {
            throw new AppError(400, `Planned start date for task "${t.task_name}" must be on or after the rollout start date.`);
          }
        }
        if (campaignEnd) {
          if (!pEnd || pEnd > campaignEnd) {
            throw new AppError(400, `Planned end date for task "${t.task_name}" must be on or before the rollout end date.`);
          }
        }
      }
    }

    if (title !== undefined) campaign.title = title;
    if (start_date !== undefined) campaign.start_date = campaignStart;
    if (end_date !== undefined) campaign.end_date = campaignEnd;
    await campaign.save();

    // Propagate changes to all Rollout documents in this campaign
    const rollouts = await Rollout.find({ campaign_id: campaignId });
    for (const r of rollouts) {
      r.start_date = campaignStart;
      r.end_date = campaignEnd;

      if (tasks && tasks.length > 0) {
        r.tasks = r.tasks.map(origTask => {
          const updated = tasks.find(ut => ut.task_id === origTask.task_id);
          if (updated) {
            origTask.task_priority = updated.task_priority || origTask.task_priority;
            origTask.task_desc = updated.task_desc !== undefined ? updated.task_desc : origTask.task_desc;
            origTask.planned_start_date = updated.planned_start_date ? new Date(updated.planned_start_date) : origTask.planned_start_date;
            origTask.planned_end_date = updated.planned_end_date ? new Date(updated.planned_end_date) : origTask.planned_end_date;
          }
          return origTask;
        });
      }
      await r.save();
    }

    return sendResponse(res, 200, true, "Rollout campaign and its tasks updated successfully", campaign, null, req);
  } catch (err) {
    next(err);
  }
};
