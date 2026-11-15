'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert, Loader2, Lock } from "lucide-react";

/**
 * RoleGuard - Protects routes based on user roles and/or permissions.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['creator', 'moderator', 'admin']}>
 *     <CreatorDashboard />
 *   </RoleGuard>
 *
 *   <RoleGuard allowedRoles={['user']} requiredPermission={PERMISSIONS.VIDEO_CREATE}>
 *     <UploadPage />
 *   </RoleGuard>
 *
 * If user doesn't have required role/permission, shows unauthorized state.
 * If not authenticated, redirects to login via auth modal.
 */

export default function RoleGuard({ children, allowedRoles, requiredPermission, requiredPermissions, fallback }) {
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
          className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-emerald-glow"
        >
          ورود / ثبت‌نام
        </button>
      </div>
    );
  }

  const userRole = authUser.role || "user";

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAnyRole = allowedRoles.some((r) => hasRole(r));
    if (!hasAnyRole) {
      return fallback || <AccessDeniedFallback userRole={userRole} reason="role" allowedRoles={allowedRoles} />;
    }
  }

  // Single permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <AccessDeniedFallback userRole={userRole} reason="permission" requiredPermission={requiredPermission} />;
  }

  // Multiple permissions check (ALL required)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const missing = requiredPermissions.filter((p) => !hasPermission(p));
    if (missing.length > 0) {
      return fallback || <AccessDeniedFallback userRole={userRole} reason="permission" requiredPermission={missing[0]} missing={missing} />;
    }
  }

  return <>{children}</>;
}

function AccessDeniedFallback({ userRole, reason, allowedRoles, requiredPermission, missing }) {
  const labels = {
    admin: "مدیر سیستم",
    moderator: "ناظر محتوا",
    creator: "تولیدکننده محتوا",
    user: "کاربر عادی",
    anonymous: "مهمان",
  };
  const roleLabel = labels[userRole] || userRole;

  const isRoleReason = reason === "role";
  const requiredList = isRoleReason ? allowedRoles : (missing || [requiredPermission]).filter(Boolean);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <Lock className="h-12 w-12 text-red-500/30 mb-4" />
      <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">
        {isRoleReason ? "سطح دسترسی شما کافی نیست" : "دسترسی محدود"}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
        {isRoleReason
          ? `این بخش فقط برای ${requiredList.map((r) => labels[r] || r).join("، ")} است. نقش شما: ${roleLabel}`
          : `شما مجاز به انجام این عملیات نیستید. مجوز مورد نیاز: ${requiredList.map((p) => String(p)).join("، ")}. نقش شما: ${roleLabel}`}
      </p>
      {userRole === "user" && (
        <button
          onClick={() => router.push("/profile")}
          className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-emerald-glow"
        >
          برو به پروفایل
        </button>
      )}
    </div>
  );
}
