import express from 'express';
import {
    register,
    login,
    profile,
    refresh,
} from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, profile);
router.post('/refresh', refresh);

export default router;