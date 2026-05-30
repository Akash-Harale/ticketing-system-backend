import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(
            new AppError('Authentication required. Please log in.', 401),
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // Let the global handler format JWT-specific messages (expired, invalid, etc.)
        next(error);
    }
};