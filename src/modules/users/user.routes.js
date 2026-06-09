import express from 'express';
import * as userController from './user.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { checkPermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('users', 'READ'), userController.getAllUsers);
router.put('/:id/role', checkPermission('users', 'UPDATE'), userController.assignRoleToUser);

export default router;
