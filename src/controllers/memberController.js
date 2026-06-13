// src/controllers/memberController.js

// src/controllers/memberController.js
import mongoose from "mongoose";
import { Member } from "../models/memberModel.js";
import { User } from "../models/userModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// ───────────────────────────────────────────────
// Create Member + User (transaction)
// ───────────────────────────────────────────────
export const createMember = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, mobile, role_id, organization } = req.body; // derive from body

    // Step 1: Create Member
    const member = await Member.create(
      [{ name, email, mobile, role_id, organization }],
      { session }
    );

    // Step 2: Create User linked to Member
    const user = await User.create(
      [{
        email,
        role_id,
        orgn_id: organization,
        member_id: member[0]._id
      }],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return sendResponse(
      res,
      201,
      true,
      "Member and User created successfully",
      { member: member[0], user: user[0] },
      null,
      req
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// ───────────────────────────────────────────────
// Get All Members
// ───────────────────────────────────────────────
export const getMembers = async (req, res, next) => {
  try {
    const { role_id, active, organization } = req.query;
    const filter = {};
    if (role_id) filter.role_id = role_id;
    if (active !== undefined) filter.active = active;
    if (organization) filter.organization = organization;

    const members = await Member.find(filter)
      .populate("role_id")
      .populate({
        path: "organization",
        populate: [
          { path: "orgn_state" },
          { path: "orgn_district" }
        ]
      });
    return sendResponse(res, 200, true, "Members retrieved successfully", members, null, req);
  } catch (err) {
    next(err);
  }
};

// ───────────────────────────────────────────────
// Get Member by ID
// ───────────────────────────────────────────────
export const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params; // derive from params
    const member = await Member.findById(id)
      .populate("role_id")
      .populate({
        path: "organization",
        populate: [
          { path: "orgn_state" },
          { path: "orgn_district" }
        ]
      });
    if (!member) throw new AppError(404, "Member not found");
    return sendResponse(res, 200, true, "Member retrieved successfully", member, null, req);
  } catch (err) {
    next(err);
  }
};

// ───────────────────────────────────────────────
// Update Member
// ───────────────────────────────────────────────
export const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params; // derive from params
    const body = req.body;     // derive from body

    const member = await Member.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("role_id")
      .populate({
        path: "organization",
        populate: [
          { path: "orgn_state" },
          { path: "orgn_district" }
        ]
      });

    if (!member) throw new AppError(404, "Member not found");
    return sendResponse(res, 200, true, "Member updated successfully", member, null, req);
  } catch (err) {
    next(err);
  }
};

// ───────────────────────────────────────────────
// Delete Member + User (transaction)
// ───────────────────────────────────────────────
export const deleteMember = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // derive from params

    // Step 1: Delete Member
    const member = await Member.findByIdAndDelete(id, { session });
    if (!member) throw new AppError(404, "Member not found");

    // Step 2: Delete linked User
    await User.findOneAndDelete({ member_id: id }, { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 200, true, "Member and User deleted successfully", null, null, req);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
