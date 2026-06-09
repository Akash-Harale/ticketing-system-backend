import { Resource } from '../../models/Resource.js';
import { Privilege } from '../../models/Privilege.js';
import { Role } from '../../models/Role.js';

// ==========================================
// RESOURCE CONTROLLERS
// ==========================================

export const createResource = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Resource name is required.'
      });
    }

    const newResource = await Resource.create({ name, description });

    res.status(201).json({
      status: 'success',
      data: { resource: newResource }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Resource with this name already exists.'
      });
    }
    next(error);
  }
};

export const getAllResources = async (req, res, next) => {
  try {
    const resources = await Resource.find();
    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: { resources }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRIVILEGE CONTROLLERS
// ==========================================

export const createPrivilege = async (req, res, next) => {
  try {
    const { name, resource, action, description } = req.body;

    if (!name || !resource || !action) {
      return res.status(400).json({
        status: 'fail',
        message: 'Privilege name, resource (ID), and action are required.'
      });
    }

    // Verify if resource exists
    const resourceExists = await Resource.findById(resource);
    if (!resourceExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Referenced Resource does not exist.'
      });
    }

    const newPrivilege = await Privilege.create({
      name,
      resource,
      action: action.toUpperCase(),
      description
    });

    const populatedPrivilege = await Privilege.findById(newPrivilege._id).populate('resource');

    res.status(201).json({
      status: 'success',
      data: { privilege: populatedPrivilege }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Privilege with this name already exists.'
      });
    }
    next(error);
  }
};

export const getAllPrivileges = async (req, res, next) => {
  try {
    const privileges = await Privilege.find().populate('resource');
    res.status(200).json({
      status: 'success',
      results: privileges.length,
      data: { privileges }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ROLE CONTROLLERS
// ==========================================

export const createRole = async (req, res, next) => {
  try {
    const { name, description, privileges } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Role name is required.'
      });
    }

    // If privileges provided, validate them
    if (privileges && privileges.length > 0) {
      const uniquePrivileges = [...new Set(privileges)];
      const count = await Privilege.countDocuments({ _id: { $in: uniquePrivileges } });
      if (count !== uniquePrivileges.length) {
        return res.status(400).json({
          status: 'fail',
          message: 'One or more provided privilege IDs are invalid.'
        });
      }
    }

    const newRole = await Role.create({
      name,
      description,
      privileges: privileges || []
    });

    const populatedRole = await Role.findById(newRole._id).populate({
      path: 'privileges',
      populate: { path: 'resource' }
    });

    res.status(201).json({
      status: 'success',
      data: { role: populatedRole }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Role with this name already exists.'
      });
    }
    next(error);
  }
};

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().populate({
      path: 'privileges',
      populate: { path: 'resource' }
    });
    
    res.status(200).json({
      status: 'success',
      results: roles.length,
      data: { roles }
    });
  } catch (error) {
    next(error);
  }
};

export const assignPrivilegesToRole = async (req, res, next) => {
  try {
    const { privileges } = req.body;
    const roleId = req.params.id;

    if (!Array.isArray(privileges)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Privileges must be an array of privilege IDs.'
      });
    }

    // Validate role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found.'
      });
    }

    // Validate all privilege IDs exist
    if (privileges.length > 0) {
      const uniquePrivileges = [...new Set(privileges)];
      const count = await Privilege.countDocuments({ _id: { $in: uniquePrivileges } });
      if (count !== uniquePrivileges.length) {
        return res.status(400).json({
          status: 'fail',
          message: 'One or more privilege IDs are invalid.'
        });
      }
      role.privileges = uniquePrivileges;
    } else {
      role.privileges = [];
    }

    await role.save();

    const populatedRole = await Role.findById(role._id).populate({
      path: 'privileges',
      populate: { path: 'resource' }
    });

    res.status(200).json({
      status: 'success',
      message: 'Privileges assigned to role successfully.',
      data: { role: populatedRole }
    });
  } catch (error) {
    next(error);
  }
};
