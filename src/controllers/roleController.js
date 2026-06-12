// src/controllers/roleController.js
import { Role } from "../models/roleModel.js";
import { AppError } from "../utils/AppError.js";
import { sendResponse } from "../utils/sendResponse.js";

// Create role
export const createRole = async (req, res, next) => {
  try {
    const body = req.body;
    const role = await Role.create(body);
    return sendResponse(res, 201, true, "Role created successfully", role, null, req);
  } catch (err) { next(err); }
};

// Get all roles
export const getRoles = async (req, res, next) => {
  console.log("roleController: getRoles (Get all roles):")
  try {
    const roles = await Role.find();
    return sendResponse(res, 200, true, "Roles retrieved successfully", roles, null, req);
  } catch (err) { next(err); }
};

// Get role by ID
export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) throw new AppError(404, "Role not found");
    return sendResponse(res, 200, true, "Role retrieved successfully", role, null, req);
  } catch (err) { next(err); }
};

// Get role by Role Name
export const getRoleByRolename = async (req, res, next) => {
  console.log("roleController: getRoleByRolename:", req.params.role_name)
  try {
    const { role_name } = req.query; 
    if (!role_name) {
      throw new AppError(400, "role_name query parameter is required");
    }

    const role = await Role.findOne({ role_name: role_name });
    if (!role) {
      throw new AppError(404, `Role not found with role_name: ${role_name}`);
    }

    return sendResponse(
      res,
      200,
      true,
      "Role retrieved successfully",
      role,
      null,
      req
    );
  } catch (err) {
    next(err);
  }
};

// Update role
export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const role = await Role.findByIdAndUpdate(id, body, { new: true });
    if (!role) throw new AppError(404, "Role not found");
    return sendResponse(res, 200, true, "Role updated successfully", role, null, req);
  } catch (err) { next(err); }
};

// Delete role
export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);
    if (!role) throw new AppError(404, "Role not found");
    return sendResponse(res, 200, true, "Role deleted successfully", role, null, req);
  } catch (err) { next(err); }
};
