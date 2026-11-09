'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, BookOpen, Sparkles, Video, Users, FolderHeart, Compass,
  Trophy, MessageCircle, User, Play, X, Flame, Upload, ShieldCheck,
  Settings, BarChart3,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/components/ThemeToggle";

// Palette icon inline (function declaration for hoisting)
function PaletteIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="8.5" cy="8.5" r="4.5" />
      <circle cx="15.5" cy="8.5" r="3.5" />
      <circle cx="15.5" cy="15.5" r="2.5" />
      <circle cx="8.5" cy="15.5" r="1.5" />
      <line x1="12" y1="6" x2="12" y2="12" />
      <line x1="6" y1="12" x2="12" y2="12" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="18" y1="12" x2="12" y2="12" />
    </svg>
  );
}

const sidebarItems = [
  { to: "/", label: "صفحه اصلی", icon: Home, badge: null, color: "quranic-emerald", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/quran", label: "مصحف شریف", icon: BookOpen, badge: "۱۱۴", color: "quranic-turquoise", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/khatm", label: "ختم قرآن", icon: Sparkles, badge: null, color: "quranic-emerald", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/talks", label: "گفتارهای اساتید", icon: Video, badge: null, color: "quranic-turquoise", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/explore", label: "کاوش موضوعی", icon: Compass, badge: null, color: "quranic-emerald", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/topics", label: "موضوعات", icon: Flame, badge: null, color: "quranic-saffron", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/collections", label: "مجموعه‌ها", icon: FolderHeart, badge: null, color: "quranic-turquoise", roles: ["user", "creator", "moderator", "admin"] },
  { to: "/competitions", label: "مسابقات", icon: Trophy, badge: null, color: "quranic-saffron", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/scholars", label: "اساتید", icon: Users, badge: null, color: "quranic-emerald", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
  { to: "/community", label: "جامعه", icon: MessageCircle, badge: null, color: "quranic-turquoise", roles: ["anonymous", "user", "creator", "moderator", "admin"] },
];

const secondaryItems = [
  { to: "/achievements", label: "مأموریت‌ها", icon: Flame, badge: null, roles: ["user", "creator", "moderator", "admin"] },
  { to: "/bookmarks", label: "نشان‌شده‌ها", icon: User, badge: null, roles: ["user", "creator", "moderator", "admin"] },
  { to: "/studio", label: "استودیو کارت", icon: PaletteIcon, badge: null, roles: ["user", "creator", "moderator", "admin"] },
  { to: "/profile", label: "پروفایل من", icon: User, badge: null, roles: ["user", "creator", "moderator", "admin"] },
];

const creatorItems = [
  { to: "/upload", label: "بارگذاری محتوا", icon: Upload, badge: null, color: "quranic-emerald", roles: ["creator", "moderator", "admin"] },
  { to: "/creator", label: "داشبورد تولیدکننده", icon: BarChart3, badge: null, color: "quranic-turquoise", roles: ["creator", "moderator", "admin"] },
];

const moderatorItems = [
  { to: "/moderation", label: "صف بررسی محتوا", icon: ShieldCheck, badge: null, color: "quranic-saffron", roles: ["moderator", "admin"] },
];

const adminItems = [
  { to: "/admin", label: "پنل مدیریت سیستم", icon: Settings, badge: null, color: "quranic-emerald", roles: ["admin"] },
];

export default function SidebarNav({ className = "" }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user: authUser, openAuthModal } = useAuth();
  useTheme();

  const isActive = (to) => pathname === to || (to !== "/" && pathname.startsWith(to));

  return (
    <aside
      className={`${className} fixed left-0 top-0 bottom-0 w-64 lg:relative lg:w-64 z-30 transition-all duration-300 overflow-y-auto lg:overflow-visible border-r border-border/50 bg-background/95 backdrop-blur-lg`}
    >
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border/50 bg-background/80 backdrop-blur-md z-10">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-quranic-emerald to-quranic-turquoise flex items-center justify-center text-white shadow-quranic-glow">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="hidden lg:block">
            <span className="font-rokh-bold font-bold text-lg text-quranic-emerald leading-none block">آیه</span>
            <span className="font-rokh-bold font-bold text-lg text-quranic-saffron leading-none block">پلاس</span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="lg:hidden ml-auto p-2 rounded-lg hover:bg-muted/50 text-foreground/70"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          <div className="px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider">
            بخش اصلی
          </div>
          {sidebarItems
            .filter((item) => !item.roles || item.roles.includes(authUser?.role || "anonymous"))
            .map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? "bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg shadow-saffron-glow/20"
                      : "text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? "bg-quranic-saffron/20 text-quranic-saffron-dark" : "text-muted-foreground/50"}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className={`font-medium ${active ? "font-bold" : "font-normal"}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-auto h-6 min-w-6 rounded-full bg-quranic-saffron text-quranic-ink text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Role-based sections */}
        {authUser && (
          <>
            {["creator", "moderator"].includes(authUser.role) && (
              <>
                <nav className="py-3 space-y-1 px-2 border-t border-border/50">
                  <div className="px-3 mb-2 text-[10px] font-bold text-quranic-emerald/70 uppercase tracking-wider">
                    تولیدکننده محتوا
                  </div>
                  {creatorItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          active
                            ? "bg-quranic-emerald/15 border border-quranic-emerald/30 text-quranic-emerald-dark shadow-lg shadow-quranic-glow/20"
                            : "text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? "bg-quranic-emerald/20 text-quranic-emerald-dark" : "text-muted-foreground/50"}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className={`font-medium ${active ? "font-bold" : "font-normal"}`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
            {authUser.role === "moderator" && (
              <>
                <nav className="py-3 space-y-1 px-2 border-t border-border/50">
                  <div className="px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider">
                    ناظر محتوا
                  </div>
                  {moderatorItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          active
                            ? "bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg shadow-saffron-glow/20"
                            : "text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? "bg-quranic-saffron/20 text-quranic-saffron-dark" : "text-muted-foreground/50"}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className={`font-medium ${active ? "font-bold" : "font-normal"}`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
            {authUser.role === "admin" && (
              <>
                <nav className="py-3 space-y-1 px-2 border-t border-border/50">
                  <div className="px-3 mb-2 text-[10px] font-bold text-red-500/70 uppercase tracking-wider">
                    مدیریت سیستم
                  </div>
                  {adminItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          active
                            ? "bg-red-500/15 border border-red-500/30 text-red-700 shadow-lg shadow-red-500/20"
                            : "text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? "bg-red-500/20 text-red-700" : "text-muted-foreground/50"}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className={`font-medium ${active ? "font-bold" : "font-normal"}`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </>
        )}

        {/* Secondary navigation */}
        <nav className="py-3 space-y-1 px-2 border-t border-border/50">
          <div className="px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider">
            امکانات بیشتر
          </div>
          {secondaryItems
            .filter((item) => !item.roles || item.roles.includes(authUser?.role || "anonymous"))
            .map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? "bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg shadow-saffron-glow/20"
                      : "text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? "bg-quranic-saffron/20 text-quranic-saffron-dark" : "text-muted-foreground/50"}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className={`font-medium ${active ? "font-bold" : "font-normal"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Bottom user section */}
      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-md">
        {authUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-secondary/30 border border-border/40">
              <div className="h-9 w-9 rounded-full bg-quranic-emerald/20 text-quranic-emerald flex items-center justify-center font-bold border border-quranic-emerald/30">
                {(authUser.full_name || "ک").charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {authUser.full_name || "کاربر"}
                </div>
                <div className="text-xs text-foreground/50 truncate">{authUser.phone || authUser.email || ""}</div>
              </div>
            </div>
            <Link
              href="/profile"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-quranic-emerald hover:bg-quranic-emerald/5 transition-colors"
            >
              <User className="h-4 w-4" /> پروفایل کاربری
            </Link>
            <button
              onClick={() => openAuthModal()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-quranic-emerald to-quranic-turquoise shadow-quranic-glow hover:opacity-90 transition-all"
            >
              <Play className="h-3.5 w-3.5" /> ورود به حساب
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-quranic-emerald to-quranic-turquoise shadow-quranic-glow hover:opacity-90 transition-all"
          >
            <User className="h-4 w-4" /> ورود / ثبت‌نام
          </button>
        )}
      </div>
    </aside>
  );
}