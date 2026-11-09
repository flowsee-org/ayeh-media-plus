'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home, BookOpen, Sparkles, Video, Users, FolderHeart, Compass,
  Trophy, MessageCircle, User, Play, X, Flame, Upload, ShieldCheck,
  Settings, BarChart3, Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Ayeh Media Plus Sidebar Navigation
 * Collapsible sidebar inspired by Aparat's navigation architecture.
 * Supports expanded and compact states, RTL behavior, and role-based items.
 */
const sidebarItems = [
  { to: '/', label: 'صفحه اصلی', icon: Home, color: 'quranic-emerald', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/quran', label: 'مصحف شریف', icon: BookOpen, badge: '۱۱۴', color: 'quranic-turquoise', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/khatm', label: 'ختم قرآن', icon: Sparkles, badge: null, color: 'quranic-emerald', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/talks', label: 'گفتارهای اساتید', icon: Video, badge: null, color: 'quranic-turquoise', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/explore', label: 'کاوش موضوعی', icon: Compass, badge: null, color: 'quranic-emerald', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/topics', label: 'موضوعات', icon: Flame, badge: null, color: 'quranic-saffron', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/collections', label: 'مجموعه‌ها', icon: FolderHeart, badge: null, color: 'quranic-turquoise', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/competitions', label: 'مسابقات', icon: Trophy, badge: null, color: 'quranic-saffron', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/scholars', label: 'اساتید', icon: Users, badge: null, color: 'quranic-emerald', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
  { to: '/community', label: 'جامعه', icon: MessageCircle, badge: null, color: 'quranic-turquoise', roles: ['anonymous', 'user', 'creator', 'moderator', 'admin'] },
];

const secondaryItems = [
  { to: '/achievements', label: 'مأموریت‌ها', icon: Flame, roles: ['user', 'creator', 'moderator', 'admin'] },
  { to: '/bookmarks', label: 'نشان‌شده‌ها', icon: BookmarkIcon, roles: ['user', 'creator', 'moderator', 'admin'] },
  { to: '/watch-history', label: 'تاریخچه تماشا', icon: Clock, roles: ['user', 'creator', 'moderator', 'admin'] },
  { to: '/studio', label: 'استودیو کارت', icon: PaletteIcon, roles: ['user', 'creator', 'moderator', 'admin'] },
  { to: '/profile', label: 'پروفایل من', icon: User, roles: ['user', 'creator', 'moderator', 'admin'] },
];

const creatorItems = [
  { to: '/upload', label: 'بارگذاری محتوا', icon: Upload, color: 'quranic-emerald', roles: ['creator', 'moderator', 'admin'] },
  { to: '/creator', label: 'داشبورد تولیدکننده', icon: BarChart3, color: 'quranic-turquoise', roles: ['creator', 'moderator', 'admin'] },
];

const moderatorItems = [
  { to: '/moderation', label: 'صف بررسی محتوا', icon: ShieldCheck, color: 'quranic-saffron', roles: ['moderator', 'admin'] },
];

const adminItems = [
  { to: '/admin', label: 'پنل مدیریت سیستم', icon: Settings, color: 'quranic-emerald', roles: ['admin'] },
];

// Custom icons
function BookmarkIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PaletteIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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

export default function AppSidebar({ className = '', collapsed = false, onCollapseToggle }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const { user: authUser, openAuthModal } = useAuth();

  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to));
  const userRole = authUser?.role || 'anonymous';

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
    onCollapseToggle?.(!isCollapsed);
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 overflow-y-auto border-r border-border/50 bg-background/95 backdrop-blur-lg ${className} ${!isCollapsed ? 'lg:relative lg:w-64' : 'lg:w-20'}`}
    >
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className={`flex items-center gap-2 px-4 py-5 border-b border-border/50 bg-background/80 backdrop-blur-md z-10 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br from-quranic-emerald to-quranic-turquoise flex items-center justify-center text-white shadow-quranic-glow shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}>
            <BookOpen className={`h-5 w-5 ${isCollapsed ? 'h-6 w-6' : ''}`} />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-rokh-bold font-bold text-lg text-quranic-emerald leading-none block">آیه مدیا</span>
              <span className="font-rokh-bold font-bold text-lg text-quranic-saffron leading-none block">پلاس</span>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleCollapseToggle}
              className="ml-auto p-2 rounded-lg hover:bg-muted/50 text-foreground/70"
              aria-label="بستن منو"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={handleCollapseToggle}
              className="ml-auto p-2 rounded-lg hover:bg-muted/50 text-foreground/70"
              aria-label="باز کردن منو"
            >
              <X className="h-5 w-5 rotate-180" />
            </button>
          )}
        </div>

        {/* Main navigation */}
        <nav className={`flex-1 py-3 space-y-1 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`}>
            بخش اصلی
          </div>
          {sidebarItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? 'bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg shadow-saffron-glow/20'
                      : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? 'bg-quranic-saffron/20 text-quranic-saffron-dark' : 'text-muted-foreground/50'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isCollapsed && (
                    <span className={`font-medium ${active ? 'font-bold' : 'font-normal'}`}>
                      {item.label}
                    </span>
                  )}
                  {item.badge && !isCollapsed && (
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
            {['creator', 'moderator'].includes(userRole) && (
              <>
                <nav className={`py-3 space-y-1 px-2 border-t border-border/50 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className={`px-3 mb-2 text-[10px] font-bold text-quranic-emerald/70 uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`}>
                    تولیدکننده محتوا
                  </div>
                  {creatorItems.filter((item) => item.roles.includes(userRole)).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          active
                            ? 'bg-quranic-emerald/15 border border-quranic-emerald/30 text-quranic-emerald-dark shadow-lg shadow-quranic-glow/20'
                            : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? 'bg-quranic-emerald/20 text-quranic-emerald-dark' : 'text-muted-foreground/50'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isCollapsed && <span className={`font-medium ${active ? 'font-bold' : 'font-normal'}`}>{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
            {userRole === 'moderator' && (
              <>
                <nav className={`py-3 space-y-1 px-2 border-t border-border/50 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className={`px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`}>
                    ناظر محتوا
                  </div>
                  {moderatorItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          active
                            ? 'bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg shadow-saffron-glow/20'
                            : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? 'bg-quranic-saffron/20 text-quranic-saffron-dark' : 'text-muted-foreground/50'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isCollapsed && <span className={`font-medium ${active ? 'font-bold' : 'font-normal'}`}>{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
            {userRole === 'admin' && (
              <>
                <nav className={`py-3 space-y-1 px-2 border-t border-border/50 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className={`px-3 mb-2 text-[10px] font-bold text-red-500/70 uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`}>
                    مدیریت سیستم
                  </div>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          active
                            ? 'bg-red-500/15 border border-red-500/30 text-red-700 shadow-lg shadow-red-500/20'
                            : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? 'bg-red-500/20 text-red-700' : 'text-muted-foreground/50'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isCollapsed && <span className={`font-medium ${active ? 'font-bold' : 'font-normal'}`}>{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </>
        )}

        {/* Secondary navigation */}
        <nav className={`py-3 space-y-1 px-2 border-t border-border/50 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider ${isCollapsed ? 'hidden' : ''}`}>
            امکانات بیشتر
          </div>
          {secondaryItems
            .filter((item) => !item.roles || item.roles.includes(userRole))
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? 'bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg shadow-saffron-glow/20'
                      : 'text-foreground/70 hover:bg-secondary/40 hover:text-foreground'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center shrink-0 ${active ? 'bg-quranic-saffron/20 text-quranic-saffron-dark' : 'text-muted-foreground/50'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isCollapsed && <span className={`font-medium ${active ? 'font-bold' : 'font-normal'}`}>{item.label}</span>}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Bottom user section */}
      <div className={`p-4 border-t border-border/50 bg-background/80 backdrop-blur-md ${isCollapsed ? 'hidden lg:block' : ''}`}>
        {authUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-secondary/30 border border-border/40">
              <div className="h-9 w-9 rounded-full bg-quranic-emerald/20 text-quranic-emerald flex items-center justify-center font-bold border border-quranic-emerald/30">
                {(authUser.full_name || 'ک').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {authUser.full_name || 'کاربر'}
                </div>
                <div className="text-xs text-foreground/50 truncate">{authUser.phone || authUser.email || ''}</div>
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
