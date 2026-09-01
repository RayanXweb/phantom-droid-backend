import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type Role = 'master_admin' | 'admin' | 'operator';

const roleHierarchy: Record<Role, number> = {
  master_admin: 3,
  admin: 2,
  operator: 1,
};

export const requireRole = (allowedRoles: Role[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: { code: 'UNAUTHORIZED' },
        });
        return;
      }

      const userRole = req.user.role as Role;
      const userLevel = roleHierarchy[userRole] || 0;
      
      const hasAccess = allowedRoles.some((role) => {
        return roleHierarchy[role] <= userLevel;
      });

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: { code: 'FORBIDDEN' },
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission check error',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  };
};

export const requirePermission = (permission: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: { code: 'UNAUTHORIZED' },
        });
        return;
      }

      // Master admin has all permissions
      if (req.user.role === 'master_admin') {
        next();
        return;
      }

      // TODO: Implement more granular permission system
      // For now, check role-based permissions
      const rolePermissions: Record<Role, string[]> = {
        master_admin: ['*'],
        admin: [
          'client:create',
          'client:edit',
          'client:delete',
          'client:activate',
          'client:deactivate',
          'client:regenerate',
          'qr:generate',
          'qr:regenerate',
          'settings:view',
          'settings:edit',
        ],
        operator: [
          'client:view',
          'client:create',
          'client:edit',
          'qr:view',
        ],
      };

      const userPermissions = rolePermissions[req.user.role as Role] || [];
      
      if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: { code: 'FORBIDDEN' },
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission check error',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  };
};
