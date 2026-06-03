// src/controllers/memberController.js


import { Member } from "../models/memberModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Create Member
export const createMember = async (req, res, next) => {
  try {
    const member = await Member.create(req.body);
    return sendResponse(res, 201, true, "Member created successfully", member, null, req);
  } catch (err) {
    next(err);
  }
};

// Get All Members
export const getMembers = async (req, res, next) => {
  try {
    const members = await Member.find().populate("role_id organization");
    return sendResponse(res, 200, true, "Members retrieved successfully", members, null, req);
  } catch (err) {
    next(err);
  }
};

// Get Member by ID
export const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id).populate("role_id organization");
    if (!member) throw new AppError(404, "Member not found");
    return sendResponse(res, 200, true, "Member retrieved successfully", member, null, req);
  } catch (err) {
    next(err);
  }
};

// Update Member
export const updateMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("role_id organization");

    if (!member) throw new AppError(404, "Member not found");
    return sendResponse(res, 200, true, "Member updated successfully", member, null, req);
  } catch (err) {
    next(err);
  }
};

// Delete Member
export const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) throw new AppError(404, "Member not found");
    return sendResponse(res, 200, true, "Member deleted successfully", null, null, req);
  } catch (err) {
    next(err);
  }
};
