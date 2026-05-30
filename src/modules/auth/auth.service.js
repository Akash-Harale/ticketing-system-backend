import jwt from 'jsonwebtoken';
import { User } from '../../models/User.js';
import { generateAccessToken } from '../../utils/generateToken.js';
import { generateRefreshToken } from '../../utils/generateRefreshToken.js';
import { AppError } from '../../utils/AppError.js';

const buildAuthResponse = async (user) => {
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
        },
    };
};

export const authService = {
    register: async (email, password, role = 'user') => {
        if (!email || !password) {
            throw new AppError('Email and password are required.', 400);
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new AppError('An account with this email already exists.', 409);
        }

        const user = await User.create({ email, password, role });

        return buildAuthResponse(user);
    },

    login: async (email, password) => {
        if (!email || !password) {
            throw new AppError('Email and password are required.', 400);
        }

        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            // Use 401 — credentials don't match (don't hint which field is wrong)
            throw new AppError('Invalid email or password.', 401);
        }

        return buildAuthResponse(user);
    },

    refresh: async (token) => {
        if (!token) {
            throw new AppError('Refresh token is required.', 400);
        }

        // jwt.verify throws JsonWebTokenError / TokenExpiredError — caught by global handler
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== token) {
            throw new AppError('Refresh token is invalid or has been revoked.', 401);
        }

        return buildAuthResponse(user);
    },

    logout: async (userId) => {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
    },

    getProfile: async (userId) => {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new AppError('User not found.', 404);
        }

        return user;
    },
};