import jwt from 'jsonwebtoken';
import { User } from '../../models/userModel.js';
import { Role } from '../../models/Role.js';

// Helper to sign Access Token
const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h' // Short-lived access token
  });
};

// Helper to sign Refresh Token
const signRefreshToken = (id) => {
  const nonce = Math.random().toString(36).substring(2) + Date.now();
  return jwt.sign({ id, nonce }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d' // Long-lived refresh token
  });
};

// Helper to send cookies and tokens
const createSendToken = async (user, statusCode, res) => {
  const token = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  
  // Save refresh token to database
  await User.findByIdAndUpdate(user._id, { refreshToken });

  const accessCookieOptions = {
    expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  const refreshCookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('token', token, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  // Remove password and refreshToken from output
  user.password = undefined;
  user.refreshToken = undefined;

  // Response shape must match what AuthProvider.login() reads:
  //   data.accessToken, data.refreshToken, data.user
  res.status(statusCode).json({
    status: 'success',
    accessToken: token,
    refreshToken,
    user
  });
};

// Login controller
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("email", email);
    console.log("password", password);

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password.'
      });
    }

    // Find user and explicitly select password, populate Role -> Privileges -> Resource, Member details, Org details
    const user = await User.findOne({ email })
      .select('+password')
      .populate({
        path: 'role_id',
        populate: {
          path: 'privileges',
          populate: {
            path: 'resource'
          }
        }
      })
      .populate({
        path: 'member_id',
        populate: {
          path: 'organization',
          populate: [
            { path: 'orgn_state' },
            { path: 'orgn_district' }
          ]
        }
      })
      .populate('orgn_id');

    if (!user || !(await user.comparePassword(password))) {
      console.log("Incorrect email or password.",user);
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password.'
      });
    }

    await createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Refresh token controller
export const refresh = async (req, res, next) => {
  try {
    let refreshToken;
    
    // Check for refresh token in cookies or body
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body && req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return res.status(401).json({
        status: 'fail',
        message: 'No refresh token provided.'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired refresh token. Please log in again.'
      });
    }

    // Find user and select password/refreshToken, populate Role -> Privileges -> Resource, Member details, Org details
    const user = await User.findById(decoded.id)
      .select('+refreshToken')
      .populate({
        path: 'role_id',
        populate: {
          path: 'privileges',
          populate: {
            path: 'resource'
          }
        }
      })
      .populate({
        path: 'member_id',
        populate: {
          path: 'organization',
          populate: [
            { path: 'orgn_state' },
            { path: 'orgn_district' }
          ]
        }
      })
      .populate('orgn_id');

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'User belonging to this token no longer exists.'
      });
    }

    // Check if stored refresh token matches incoming refresh token
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status: 'fail',
        message: 'Refresh token has been revoked or is invalid.'
      });
    }

    // Create new tokens (Token rotation)
    await createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Logout controller
export const logout = async (req, res, next) => {
  try {
    let refreshToken;
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body && req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    // If refresh token exists, remove it from the database
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
      } catch (err) {
        // Token verification failed, but we still want to clean up cookies
      }
    } else if (req.user) {
      // If user is already authenticated via protect middleware
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }

    // Clear cookies
    res.cookie('token', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.cookie('refreshToken', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      status: 'success',
      message: 'User logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
// authService.getProfile() does: const { data } = await api.get('/auth/me')
// then returns data — so we must return the user object directly at top level.
export const profile = (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  delete user.password;
  delete user.refreshToken;

  res.status(200).json(user);
};