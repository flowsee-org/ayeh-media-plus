/**
 * Ayeh Media Plus — Permission Hook
 *
 * Provides permission-aware helpers for components.
 *
 * Usage:
 *   const { can, hasRole, userRole, userPermissions, isAuthenticated } = usePermissions();
 *
 *   if (!can(PERMISSIONS.VIDEO_CREATE)) return <UpgradePrompt />;
 */

'use client';

import { useContext, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_HIERARCHY,
  hasPermission,
  getNextRole,
  getPermissionsForRole,
} from '@/lib/rbac';

export function usePermissions() {
  const {
    user,
    userRole,
    userPermissions,
    isAuthenticated,
    hasPermission: ctxHasPermission,
    hasRole: ctxHasRole,
  } = useAuth();

  const can = (permission) => {
    if (!isAuthenticated) return false;
    return ctxHasPermission(permission);
  };

  const isAtLeast = (minRole) => {
    if (!isAuthenticated) return false;
    return ctxHasRole(minRole);
  };

  const nextRole = useMemo(() => {
    if (!userRole) return null;
    return getNextRole(userRole);
  }, [userRole]);

  const canUpgradeTo = (targetRole) => {
    if (!userRole) return false;
    const currentIdx = ROLE_HIERARCHY.indexOf(userRole);
    const targetIdx = ROLE_HIERARCHY.indexOf(targetRole);
    return currentIdx !== -1 && targetIdx !== -1 && targetIdx > currentIdx;
  };

  return {
    user,
    userRole,
    userPermissions,
    isAuthenticated,
    can,
    hasPermission: ctxHasPermission,
    isAtLeast,
    hasRole: ctxHasRole,
    canUpgradeTo,
    nextRole,
    ROLE_LABELS,
    PERMISSIONS,
    ROLE_HIERARCHY,
  };
}
