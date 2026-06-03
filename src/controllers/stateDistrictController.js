// src/controllers/stateDistrictController.js
import { StateMaster } from "../models/stateMaster.js";
import { DistrictMaster } from "../models/districtMaster.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// State CRUD
export const createState = async (req, res, next) => {
  try {
    const body = req.body;
    const state = await StateMaster.create(body);
    return sendResponse(res, 201, true, "State created successfully", state, null, req);
  } catch (err) { next(err); }
};

export const getStates = async (req, res, next) => {
  try {
    const states = await StateMaster.find();
    return sendResponse(res, 200, true, "States retrieved successfully", states, null, req);
  } catch (err) { next(err); }
};

export const updateState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const state = await StateMaster.findByIdAndUpdate(id, body, { new: true });
    if (!state) throw new AppError(404, "State not found");
    return sendResponse(res, 200, true, "State updated successfully", state, null, req);
  } catch (err) { next(err); }
};

export const deleteState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const state = await StateMaster.findByIdAndDelete(id);
    if (!state) throw new AppError(404, "State not found");
    return sendResponse(res, 200, true, "State deleted successfully", state, null, req);
  } catch (err) { next(err); }
};

// District CRUD
// Create district
export const createDistrict = async (req, res, next) => {
  try {
    const body = req.body; // temp variable
    const district = await DistrictMaster.create(body);
    return sendResponse(res, 201, true, "District created successfully", district, null, req);
  } catch (err) { next(err); }
};

// Get districts (search by state_id or district_name)
export const getDistricts = async (req, res, next) => {
  try {
    const { state_id, district_name } = req.query; // temp variables
    const filter = {};
    if (state_id) filter.state_id = state_id;
    if (district_name) filter.district_name = { $regex: district_name, $options: "i" };

    const districts = await DistrictMaster.find(filter);
    return sendResponse(res, 200, true, "Districts retrieved successfully", districts, null, req);
  } catch (err) { next(err); }
};

// Get district by state_id + district_id
export const getDistrictByCompositeId = async (req, res, next) => {
  try {
    const { state_id, district_id } = req.params; // temp variables
    const district = await DistrictMaster.findOne({ state_id, district_id });
    if (!district) throw new AppError(404, "District not found");
    return sendResponse(res, 200, true, "District retrieved successfully", district, null, req);
  } catch (err) { next(err); }
};

// Update district by state_id + district_id
export const updateDistrictByCompositeId = async (req, res, next) => {
  try {
    const { state_id, district_id } = req.params;
    const body = req.body;
    const district = await DistrictMaster.findOneAndUpdate({ state_id, district_id }, body, { new: true });
    if (!district) throw new AppError(404, "District not found");
    return sendResponse(res, 200, true, "District updated successfully", district, null, req);
  } catch (err) { next(err); }
};

// Delete district by state_id + district_id
export const deleteDistrictByCompositeId = async (req, res, next) => {
  try {
    const { state_id, district_id } = req.params;
    const district = await DistrictMaster.findOneAndDelete({ state_id, district_id });
    if (!district) throw new AppError(404, "District not found");
    return sendResponse(res, 200, true, "District deleted successfully", district, null, req);
  } catch (err) { next(err); }
};

// Lookup endpoint that fetches all districts for a given state in one call (e.g., /api/location/states/UP/districts)

export const getDistrictsByState = async (req, res, next) => {
  try {
    const { state_id } = req.params; // assign to temp variable
    const districts = await DistrictMaster.find({ state_id });
    if (!districts || districts.length === 0) throw new AppError(404, "No districts found for this state");
    return sendResponse(res, 200, true, "Districts retrieved successfully", districts, null, req);
  } catch (err) {
    next(err);
  }
};
