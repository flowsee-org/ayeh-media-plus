'use client';

import { useEffect, useState } from 'react';
import { Menu, Upload, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/components/ThemeToggle';
import BrandLogo from './BrandLogo';
import GlobalSearch from './GlobalSearch';
import NotificationBell from '@/components/notifications/NotificationBell';

/**
 * Ayeh Media Plus Global Header — Aparat Style
 * Dark header with:
 * - Ayeh logo
 * - Prominent global search
 * - Upload button (call-to-action)
 * - Notifications, theme toggle, profile
 * - Responsive design (mobile drawer toggle)
 */
export default function AppHeader({ onMenuToggle, className = '' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user: authUser, openAuthModal } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const Icon = theme === 'dark' ? Sun : Moon;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border transition-all duration-300 ${
        isScrolled ? 'bg-background/95 shadow-lg' : 'bg-background/80 backdrop-blur-md'
      } ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-muted text-foreground/70 transition-colors"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo variant="inline" className="shrink-0" />
        </div>

        {/* Center: Prominent Global Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-[700px] mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Menu className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <GlobalSearch className="w-full pl-10" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAuthModal()}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-quranic-emerald text-white text-xs font-bold hover:opacity-90 shadow-quranic-glow transition-all"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            آپلود ویدیو
          </button>
          <NotificationBell className="hidden sm:block" />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted text-foreground/70 transition-colors sm:block"
            aria-label="تغییر تم"
          >
            <Icon className="h-5 w-5" />
          </button>
          {authUser ? (
            <ProfileTrigger />
          ) : (
            <AuthButton />
          )}
        </div>
      </div>
    </header>
  );
}

function ProfileTrigger() {
  const { user: authUser, openAuthModal } = useAuth();

  return (
    <div className="relative">
      <button
        onClick={() => openAuthModal()}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-all group"
      >
        <div className="h-7 w-7 rounded-full bg-quranic-emerald text-quranic-ink flex items-center justify-center font-bold text-xs shrink-0 border border-quranic-emerald/30 group-hover:scale-105 transition-transform">
          {(authUser?.full_name || 'ک').charAt(0)}
        </div>
        <span className="hidden sm:block truncate max-w-[120px]">
          {authUser?.full_name || 'کاربر'}
        </span>
      </button>
    </div>
  );
}

function AuthButton() {
  const { openAuthModal } = useAuth();
  return (
    <button
      onClick={() => openAuthModal()}
      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-quranic-emerald text-white text-xs font-bold hover:opacity-90 shadow-quranic-glow transition-all"
    >
      ورود / ثبت‌نام
    </button>
  );
}
