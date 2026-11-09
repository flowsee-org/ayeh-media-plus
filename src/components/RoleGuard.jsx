'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert, Loader2, User } from "lucide-react";

/**
 * RoleGuard - Protects routes based on user roles.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['creator', 'moderator', 'admin']} fallback={<Unauthorized />}>
 *     <CreatorDashboard />
 *   </RoleGuard>
 *
 * If user doesn't have required role, shows unauthorized state.
 * If not authenticated, redirects to login.
 */

export default function RoleGuard({ children, allowedRoles, fallback }) {
  const router = useRouter();
  const { user: authUser, isLoadingAuth, isAuthenticated, openAuthModal } = useAuth();
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
  const hasRole = allowedRoles.includes(userRole);

  if (!hasRole) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <User className="h-12 w-12 text-red-500/30 mb-4" />
        <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">دسترسی محدود</h2>
        <p className="text-muted-foreground mb-6">
          شما دسترسی به این بخش را ندارید. این بخش فقط برای
          {allowedRoles.map((r) => {
            const labels = { admin: "مدیر سیستم", moderator: "ناظر محتوا", creator: "تولیدکننده محتوا", user: "کاربر عادی" };
            return labels[r] || r;
          }).join("، ")}
          است.
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

  return <>{children}</>;
}
