'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Upload, Sun, Moon, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/components/ThemeToggle';
import BrandLogo from './BrandLogo';
import GlobalSearch from './GlobalSearch';
import NotificationBell from '@/components/notifications/NotificationBell';

/**
 * Global Header — Aparat-style light chrome
 * Logo · centered search · upload CTA · notifications · theme · profile
 */
export default function AppHeader({ onMenuToggle, className = '' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user: authUser, openAuthModal } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const router = useRouter();
  const ThemeIcon = mounted ? (theme === 'dark' ? Sun : Moon) : Moon;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpload = () => {
    if (!authUser) {
      openAuthModal();
      return;
    }
    router.push('/upload');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/80 transition-all duration-200 ${
        isScrolled ? 'bg-card/95 shadow-sm backdrop-blur-md' : 'bg-card/90 backdrop-blur-md'
      } ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="px-3 sm:px-5 lg:px-6 h-14 sm:h-16 flex items-center gap-3">
        {/* Start: Menu + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-muted text-foreground/70 transition-colors"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Logo only on mobile/tablet — desktop sidebar already shows brand */}
          <BrandLogo variant="inline" className="shrink-0 lg:hidden" />
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-[640px] mx-auto">
          <GlobalSearch className="w-full" />
        </div>

        {/* End: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ms-auto shrink-0">
          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl hover:bg-muted text-foreground/70 transition-colors"
            aria-label="جستجو"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={handleUpload}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-sm transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            آپلود ویدیو
          </button>

          {authUser && <NotificationBell className="hidden sm:block" />}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted text-foreground/70 transition-colors"
            aria-label="تغییر تم"
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          {authUser ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-muted text-foreground text-xs font-medium transition-all group"
            >
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                {(authUser?.full_name || 'ک').charAt(0)}
              </div>
              <span className="hidden lg:block truncate max-w-[100px]">
                {authUser?.full_name || 'کاربر'}
              </span>
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-bold hover:bg-muted transition-all"
            >
              ورود
            </button>
          )}
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 border-t border-border/60">
          <GlobalSearch className="w-full mt-3" />
        </div>
      )}
    </header>
  );
}
