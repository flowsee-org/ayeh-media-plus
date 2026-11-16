/**
 * Ayeh Media Plus — RBAC Express Middleware
 *
 * Provides:
 *   requirePermission(permission)  - user must have the permission
 *   requireRole(role)              - user must have at least this role
 *   requireOwnershipOrPermission(ownerField, permission) - owner or permission
 *   optionalAuth                   - populate req.user if token present
 *
 * Works with the existing authenticate() middleware which sets req.user.
 */

import { hasPermission, getPermissionsForRole, ROLE_LABELS } from './permissions.js';

/**
 * Middleware: require a specific permission.
 * Usage: router.post('/videos', authenticate(), requirePermission(PERMISSIONS.VIDEO_CREATE), handler)
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'ورود به سیستم الزامی است',
        error: 'AUTH_REQUIRED',
        required_permission: permission,
      });
    }

    const userRole = req.user.role || 'user';
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        message: 'دسترسی به این بخش برای شما مجاز نیست',
        error: 'INSUFFICIENT_PERMISSION',
        required_permission: permission,
        user_role: userRole,
        user_role_label: ROLE_LABELS[userRole] || userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: require a minimum role (user or higher).
 * Usage: router.get('/admin', authenticate(), requireRole('admin'))
 */
export function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'ورود به سیستم الزامی است',
        error: 'AUTH_REQUIRED',
        required_role: minRole,
      });
    }

    const userRole = req.user.role || 'user';
    const roleIndex = ['anonymous', 'user', 'creator', 'moderator', 'admin'].indexOf(userRole);
    const minIndex = ['anonymous', 'user', 'creator', 'moderator', 'admin'].indexOf(minRole);

    if (roleIndex === -1 || roleIndex < minIndex) {
      return res.status(403).json({
        message: 'سطح دسترسی شما کافی نیست',
        error: 'INSUFFICIENT_ROLE',
        required_role: minRole,
        user_role: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware: require ownership of a resource OR a specific permission.
 * Checks if req.user.id matches the record's ownerField, or user has `permission`.
 *
 * The handler must attach the resource to req.resource (or we look it up).
 * Usage: router.put('/videos/:id', authenticate(), requireOwnershipOrPermission('reciter_id', PERMISSIONS.VIDEO_UPDATE_ANY), handler)
 */
export function requireOwnershipOrPermission(ownerField, permission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'ورود به سیستم الزامی است',
        error: 'AUTH_REQUIRED',
      });
    }

    const userRole = req.user.role || 'user';

    // Admin/moderator with the permission can always proceed
    if (hasPermission(userRole, permission)) {
      return next();
    }

    // Check ownership
    const resourceId = req.params.id || req.body.id;
    if (!resourceId) {
      return res.status(400).json({
        message: 'شناسه منبع مشخص نشده است',
        error: 'MISSING_RESOURCE_ID',
      });
    }

    // The resource should be attached to req.resource by a prior middleware,
    // or we check req.body for the owner field
    const resource = req.resource || req.body;
    const ownerId = resource ? resource[ownerField] : null;

    if (ownerId && String(ownerId) === String(req.user.id)) {
      return next();
    }

    return res.status(403).json({
      message: 'فقط مالكة این منبع می‌تواند آن را تغییر دهد',
      error: 'NOT_RESOURCE_OWNER',
      required_permission: permission,
      user_role: userRole,
    });
  };
}

/**
 * Middleware: attach a resource to req.resource for ownership checks.
 * Usage: router.use('/videos/:id', loadResource('Video', 'reciter_id'))
 */
export function loadResource(modelName, ownerField) {
  return async (req, res, next) => {
    const id = req.params.id;
    if (!id) return next();

    try {
      // Import prisma dynamically
      const { prisma } = await import('../../db.js');
      const modelNameCamel =
        modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const model = prisma[modelNameCamel];

      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }

      const record = await model.findUnique({ where: { id } });
      if (!record) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      req.resource = record;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: optional authentication - populates req.user if token valid,
 * but doesn't require it. Used for public endpoints that show different
 * content based on auth state.
 */
export function optionalAuth(req, res, next) {
  // The authenticate({ required: false }) middleware already handles this.
  // This is a no-op passthrough for clarity in route definitions.
  next();
}

/**
 * Helper: get user's effective permissions
 */
export function getUserPermissions(user) {
  if (!user) return getPermissionsForRole('anonymous');
  return getPermissionsForRole(user.role || 'user');
}

/**
 * Helper: check if user can moderate a target
 */
export function canModerate(user, targetType) {
  if (!user) return false;
  const role = user.role || 'user';
  switch (targetType) {
    case 'video':
      return hasPermission(role, 'moderate:video');
    case 'comment':
      return hasPermission(role, 'moderate:comment');
    case 'entry':
      return hasPermission(role, 'moderate:entry');
    case 'report':
      return hasPermission(role, 'moderate:report');
    case 'user':
      return hasPermission(role, 'moderate:user');
    default:
      return hasPermission(role, 'moderate:queue');
  }
}