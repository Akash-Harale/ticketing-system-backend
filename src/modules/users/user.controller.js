import { User } from '../../models/User.js';
import { Role } from '../../models/Role.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate({
      path: 'role_id',
      populate: {
        path: 'privileges',
        populate: {
          path: 'resource'
        }
      }
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

export const assignRoleToUser = async (req, res, next) => {
  try {
    const { role_id } = req.body;
    const userId = req.params.id;

    if (!role_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'role_id is required in the body.'
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.'
      });
    }

    // Validate role exists
    const roleExists = await Role.findById(role_id);
    if (!roleExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Referenced Role does not exist.'
      });
    }

    user.role_id = role_id;
    await user.save();

    const populatedUser = await User.findById(user._id).populate({
      path: 'role_id',
      populate: {
        path: 'privileges',
        populate: {
          path: 'resource'
        }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully.',
      data: {
        user: populatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};
