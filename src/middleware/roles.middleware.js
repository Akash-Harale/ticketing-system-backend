import { AppError } from '../utils/AppError.js';

export const authorize =
    (...roles) =>
    (req, res, next) => {
        if (!req.user) {
            return next(
                new AppError('Authentication required. Please log in.', 401),
            );
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `You do not have permission to perform this action. Required role: ${roles.join(' or ')}.`,
                    403,
                ),
            );
        }

        next();
    };