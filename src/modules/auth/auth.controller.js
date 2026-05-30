import { authService } from './auth.service.js';
import { AppError } from '../../utils/AppError.js';

export const register = async (req, res, next) => {
    try {
        const data = await authService.register(
            req.body.email,
            req.body.password,
            req.body.role,
        );

        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const data = await authService.login(
            req.body.email,
            req.body.password,
        );

        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const data = await authService.refresh(req.body.refreshToken);

        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user?.userId);

        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
};

export const profile = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user?.userId);

        res.json(user);
    } catch (error) {
        next(error);
    }
};