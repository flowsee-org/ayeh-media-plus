'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert, Loader2, Lock } from 'lucide-react';

/**
 * PermissionGuard - Protects routes based on user permissions and/or roles.
 *
 * Usage:
 *   <PermissionGuard requiredPermission={PERMISSIONS.VIDEO_CREATE}>
 *     <UploadPage />
 *   </PermissionGuard>
 *
 *   <PermissionGuard requiredPermissions={[PERM_A, PERM_B]}>
 *     <AdminPage />
 *   </PermissionGuard>
 *
 *   <PermissionGuard requiredRoles={['admin', 'moderator']}>
 *     <ModerationPage />
 *   </PermissionGuard>
 *
 * If the user isn't authenticated, shows a login prompt.
 * If authenticated but missing the requirement, shows the fallback
 * (or a default permission-denied message).
 */

const DEFAULT_ROLE_LABELS = {
  admin: 'مدیر سیستم',
  moderator: 'ناظر محتوا',
  creator: 'تولیدکننده محتوا',
  user: 'کاربر عادی',
  anonymous: 'مهمان',
};

export default function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  fallback,
  requiredRoles,
}) {
  const router = useRouter();
  const { user: authUser, isLoadingAuth, isAuthenticated, openAuthModal, hasPermission, hasRole } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth) {
      setChecked(true);
    }
  }, [isLoadingAuth]);

  if (!checked || isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-muted-foreground font-doran">در حال بررسی دسترسی...</p>
      </div>
    );
  }

  // Not authenticated → login prompt
  if (!isAuthenticated || !authUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <ShieldAlert className="h-12 w-12 text-red-500/30 mb-4" />
        <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">وارد حساب کاربری شوید</h2>
        <p className="text-muted-foreground mb-6">
          برای دسترسی به این بخش، باید وارد حساب کاربری خود شوید.
        </p>
        <button
          onClick={() => openAuthModal()}
          className="px-8 py-3 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-emerald-glow"
        >
          ورود / ثبت‌نام
        </button>
      </div>
    );
  }

  const userRole = authUser.role || 'user';

  // Role check (if requiredRoles provided)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some((r) => hasRole(r));
    if (!hasAnyRole) {
      return fallback || (
        <PermissionDeniedFallback
          userRole={userRole}
          reason="role"
          requiredRoles={requiredRoles}
        />
      );
    }
  }

  // Single permission check
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return fallback || (
        <PermissionDeniedFallback
          userRole={userRole}
          reason="permission"
          requiredPermission={requiredPermission}
        />
      );
    }
  }

  // Multiple permissions check (ALL required)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const missing = requiredPermissions.filter((p) => !hasPermission(p));
    if (missing.length > 0) {
      return fallback || (
        <PermissionDeniedFallback
          userRole={userRole}
          reason="permission"
          requiredPermission={missing[0]}
          missing={missing}
        />
      );
    }
  }

  return <>{children}</>;
}

/**
 * Default fallback UI shown when a user lacks permission/role.
 */
function PermissionDeniedFallback({ userRole, reason, requiredRoles, requiredPermission, missing }) {
  const labels = { ...DEFAULT_ROLE_LABELS };
  const roleLabel = labels[userRole] || userRole;

  const isRoleReason = reason === 'role';
  const isRoleRequired = reason === 'role';
  const requiredList = isRoleRequired ? requiredRoles : (missing || [requiredPermission]).filter(Boolean);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <Lock className="h-12 w-12 text-red-500/30 mb-4" />
      <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">
        {isRoleReason ? 'سطح دسترسی شما کافی نیست' : 'دسترسی محدود'}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
        {isRoleReason
          ? `این بخش فقط برای ${requiredList.map((r) => labels[r] || r).join('، ')} است. نقش شما: ${roleLabel}`
          : `شما مجاز به انجام این عملیات نیستید. مجوز مورد نیاز: ${requiredList.map((p) => String(p)).join('، ')}. نقش شما: ${roleLabel}`}
      </p>
      {userRole === 'user' && (
        <button
          onClick={() => router.push('/profile')}
          className="px-8 py-3 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-emerald-glow"
        >
          برو به پروفایل
        </button>
      )}
    </div>
  );
}
