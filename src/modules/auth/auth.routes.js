import express from 'express';
import {
    login,
    profile,
    refresh,
    logout
} from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, profile);

export default router;