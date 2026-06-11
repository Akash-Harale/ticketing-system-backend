export const checkPermission = (resourceName, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(500).json({
          status: 'error',
          message: 'User object not found on request. Auth middleware must run first.'
        });
      }

      const userRole = req.user.role_id;
      if (!userRole) {
        return res.status(403).json({
          status: 'fail',
          message: 'No role assigned. Access denied.'
        });
      }

      // Bypass checks for Superadmin or Admin roles
      if (userRole.name === 'Superadmin' || userRole.name === 'Super Admin' || userRole.name === 'Admin' || userRole.name === 'admin') {
        return next();
      }

      const formattedAction = action.toUpperCase();
      const formattedResource = resourceName.toLowerCase();

      // Check if any of the privileges match the resource and action
      const hasPrivilege = userRole.privileges.some(privilege => {
        if (!privilege.resource) return false;
        
        const privilegeResourceName = privilege.resource.name.toLowerCase();
        const privilegeAction = privilege.action.toUpperCase();

        return privilegeResourceName === formattedResource && privilegeAction === formattedAction;
      });

      if (!hasPrivilege) {
        return res.status(403).json({
          status: 'fail',
          message: `Forbidden: You do not have permission to ${formattedAction} on resource '${formattedResource}'`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
