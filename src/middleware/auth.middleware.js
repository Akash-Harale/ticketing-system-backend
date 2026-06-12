import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    // Find user and populate Role -> Privileges -> Resource
    const currentUser = await User.findById(decoded.id).populate({
      path: 'role_id',
      populate: {
        path: 'privileges',
        populate: {
          path: 'resource'
        }
      }
    });

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Grant access to protected route by attaching user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};