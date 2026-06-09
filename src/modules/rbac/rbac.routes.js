import express from 'express';
import * as rbacController from './rbac.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { checkPermission } from '../../middleware/rbac.middleware.js';

const router = express.Router();

// Apply protect middleware to all routes in this router
router.use(protect);

// Resource routes
router.post('/resources', checkPermission('rbac', 'CREATE'), rbacController.createResource);
router.get('/resources', checkPermission('rbac', 'READ'), rbacController.getAllResources);

// Privilege routes
router.post('/privileges', checkPermission('rbac', 'CREATE'), rbacController.createPrivilege);
router.get('/privileges', checkPermission('rbac', 'READ'), rbacController.getAllPrivileges);

// Role routes
router.post('/roles', checkPermission('rbac', 'CREATE'), rbacController.createRole);
router.get('/roles', checkPermission('rbac', 'READ'), rbacController.getAllRoles);
router.put('/roles/:id/privileges', checkPermission('rbac', 'UPDATE'), rbacController.assignPrivilegesToRole);

export default router;
