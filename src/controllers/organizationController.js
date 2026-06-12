// src/controllers/organizationController.js

import mongoose from "mongoose";
import { Organization } from "../models/organizationModel.js";
import { Member } from "../models/memberModel.js";
import { User } from "../models/userModel.js";       // userModel.js — NOT User.js
import { Role } from "../models/Role.js";            // Role.js — NOT roleModel.js
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

const DEFAULT_COORDINATOR_PASSWORD = "nutan123";

// ── Create Organization ─────────────────────────────────────────────────────
// When orgn_type === "PU" (Program Unit), the request body must also include a
// `coordinator` object { name, email }.  The controller then:
//   1. Creates the Organization document
//   2. Creates a Member document for the coordinator  (role: "PC")
//   3. Creates a User document for login access       (password: nutan123)
// All three writes happen inside a single MongoDB transaction so that a failure
// in any step rolls back the others.
export const createOrganization = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let responseData;

    await session.withTransaction(async () => {
      const { coordinator, ...orgData } = req.body;

      // ── Step 1: Create Organization ───────────────────────────────────────
      const [org] = await Organization.create([orgData], { session });

      // If this is a Program Unit, also create Member + User for the coordinator
      if (coordinator) {
        // ── Lookup the "PC" (Programme Coordinator) role from Role.js ────────
        const pcRole = await Role.findOne({ name: "Porgram_unit_coordinator" }).session(session);
        if (!pcRole) {
          throw new AppError(
            404,
            'Role "Porgram_unit_coordinator" not found. Please seed the roles collection first.'
          );
        }

        // ── Step 2: Create Member (coordinator) ───────────────────────────
        const [member] = await Member.create(
          [
            {
              name: coordinator.name,
              email: coordinator.email,
              mobile: coordinator.mobile,
              role_id: pcRole._id,
              organization: org._id,
            },
          ],
          { session }
        );

        // ── Step 3: Create User (login account for coordinator) ───────────
        // Password "nutan123" is hashed automatically by the pre-save hook
        // in userModel.js — we do NOT hash it manually here.
        const [user] = await User.create(
          [
            {
              email: coordinator.email,
              password: DEFAULT_COORDINATOR_PASSWORD,
              role_id: pcRole._id,
              orgn_id: org._id,
              member_id: member._id,
            },
          ],
          { session }
        );

        // Strip the password from the response
        const userObj = user.toObject();
        delete userObj.password;

        responseData = { organization: org, member, user: userObj };
      } else {
        // Non-PU org: just return the created organization
        responseData = { organization: org };
      }
    });

    return sendResponse(
      res,
      201,
      true,
      "Organization created successfully",
      responseData,
      null,
      req
    );
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// ── Get All Organizations ────────────────────────────────────────────────────
export const getOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find()
      .populate("orgn_district")
      .populate("orgn_state");
    return sendResponse(
      res,
      200,
      true,
      "Organizations retrieved successfully",
      orgs,
      null,
      req
    );
  } catch (err) {
    next(err);
  }
};

// ── Get Organization by ID ───────────────────────────────────────────────────
export const getOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate("orgn_district")
      .populate("orgn_state");
    if (!org) throw new AppError(404, "Organization not found");
    return sendResponse(
      res,
      200,
      true,
      "Organization retrieved successfully",
      org,
      null,
      req
    );
  } catch (err) {
    next(err);
  }
};

// ── Update Organization ──────────────────────────────────────────────────────
export const updateOrganization = async (req, res, next) => {
  try {
    // Prevent coordinator from being updated via this endpoint
    const { coordinator, ...orgData } = req.body;

    const org = await Organization.findByIdAndUpdate(req.params.id, orgData, {
      new: true,
      runValidators: true,
    });
    if (!org) throw new AppError(404, "Organization not found");
    return sendResponse(
      res,
      200,
      true,
      "Organization updated successfully",
      org,
      null,
      req
    );
  } catch (err) {
    next(err);
  }
};

// ── Delete Organization ──────────────────────────────────────────────────────
export const deleteOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) throw new AppError(404, "Organization not found");
    return sendResponse(
      res,
      200,
      true,
      "Organization deleted successfully",
      null,
      null,
      req
    );
  } catch (err) {
    next(err);
  }
};
