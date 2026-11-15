'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, Video, Radio, Users, FolderHeart, Clock,
  Bookmark, Upload, ShieldCheck, Settings, BarChart3, LogOut,
  User, BookOpen, Trophy, MessageCircle, ChevronRight, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import BrandLogo from './BrandLogo';

/**
 * Aparat-style sidebar — video-first IA, collapsible, RTL (right rail).
 */
const primaryItems = [
  { to: '/', label: 'صفحه اصلی', icon: Home },
  { to: '/explore', label: 'کاوش', icon: Compass },
  { to: '/talks', label: 'ویدیوها', icon: Video },
  { to: '/live', label: 'پخش زنده', icon: Radio },
  { to: '/scholars', label: 'کانال‌ها و اساتید', icon: Users },
  { to: '/collections', label: 'لیست‌های پخش', icon: FolderHeart },
];

const libraryItems = [
  { to: '/watch-history', label: 'تاریخچه تماشا', icon: Clock, auth: true },
  { to: '/bookmarks', label: 'نشان‌شده‌ها', icon: Bookmark, auth: true },
  { to: '/community', label: 'جامعه', icon: MessageCircle },
  { to: '/competitions', label: 'مسابقات', icon: Trophy },
  { to: '/quran', label: 'مصحف شریف', icon: BookOpen },
];

const creatorItems = [
  { to: '/upload', label: 'آپلود ویدیو', icon: Upload, roles: ['user', 'creator', 'moderator', 'admin'] },
  { to: '/creator', label: 'داشبورد سازنده', icon: BarChart3, roles: ['user', 'creator', 'moderator', 'admin'] },
];

const staffItems = [
  { to: '/moderation', label: 'بررسی محتوا', icon: ShieldCheck, roles: ['moderator', 'admin'] },
  { to: '/admin', label: 'مدیریت سیستم', icon: Settings, roles: ['admin'] },
];

function NavLink({ item, active, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-xl text-sm transition-all duration-150 ${
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
      } ${
        active
          ? 'bg-primary/10 text-primary font-bold'
          : 'text-foreground/75 hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="my-2 mx-auto h-px w-8 bg-border" />;
  return (
    <div className="px-3 pt-4 pb-1.5 text-[11px] font-bold text-muted-foreground tracking-wide">
      {children}
    </div>
  );
}

export default function AppSidebar({ className = '', collapsed = false, onCollapseToggle }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const { user: authUser, openAuthModal, logout } = useAuth();

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to));
  const userRole = authUser?.role || 'anonymous';

  const handleCollapseToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapseToggle?.(next);
  };

  const widthClass = isCollapsed ? 'w-[72px]' : 'w-60';

  return (
    <aside
      className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-s border-border bg-card z-30 transition-[width] duration-200 ${widthClass} ${className}`}
    >
      <div className={`flex items-center gap-2 border-b border-border h-16 px-3 ${isCollapsed ? 'justify-center' : ''}`}>
        {isCollapsed ? (
          <BrandLogo variant="icon-only" />
        ) : (
          <BrandLogo variant="inline" />
        )}
        <button
          onClick={handleCollapseToggle}
          className={`p-2 rounded-lg hover:bg-muted text-muted-foreground ${isCollapsed ? 'hidden' : 'ms-auto'}`}
          aria-label="جمع کردن منو"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-border">
          <button
            onClick={handleCollapseToggle}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label="باز کردن منو"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <SectionLabel collapsed={isCollapsed}>منوی اصلی</SectionLabel>
        {primaryItems.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={isCollapsed} />
        ))}

        <SectionLabel collapsed={isCollapsed}>کتابخانه</SectionLabel>
        {libraryItems
          .filter((item) => !item.auth || authUser)
          .map((item) => (
            <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={isCollapsed} />
          ))}

        {authUser && creatorItems.some((i) => i.roles.includes(userRole)) && (
          <>
            <SectionLabel collapsed={isCollapsed}>سازنده محتوا</SectionLabel>
            {creatorItems
              .filter((item) => item.roles.includes(userRole))
              .map((item) => (
                <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={isCollapsed} />
              ))}
          </>
        )}

        {authUser && staffItems.some((i) => i.roles.includes(userRole)) && (
          <>
            <SectionLabel collapsed={isCollapsed}>مدیریت</SectionLabel>
            {staffItems
              .filter((item) => item.roles.includes(userRole))
              .map((item) => (
                <NavLink key={item.to} item={item} active={isActive(item.to)} collapsed={isCollapsed} />
              ))}
          </>
        )}
      </nav>

      <div className={`border-t border-border p-3 ${isCollapsed ? 'px-2' : ''}`}>
        {authUser ? (
          <div className="space-y-2">
            {!isCollapsed && (
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
                  {(authUser.full_name || 'ک').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground truncate">
                    {authUser.full_name || 'کاربر'}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {authUser.phone || authUser.email || 'پروفایل من'}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground rotate-180" />
              </Link>
            )}
            <button
              onClick={() => logout()}
              className={`w-full flex items-center gap-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
                isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              }`}
              title="خروج"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && 'خروج از حساب'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal()}
            className={`w-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:opacity-90 transition-all ${
              isCollapsed ? 'p-2.5' : 'px-3 py-2.5'
            }`}
            title="ورود"
          >
            <User className="h-4 w-4" />
            {!isCollapsed && 'ورود / ثبت‌نام'}
          </button>
        )}
      </div>
    </aside>
  );
}
