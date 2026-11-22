'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Upload, Sun, Moon, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/components/ThemeToggle';
import BrandLogo from '@/components/ui/brand-logo';
import GlobalSearch from '@/components/ui/global-search';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';

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
          <Button
            onClick={onMenuToggle}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* Logo only on mobile/tablet — desktop sidebar already shows brand */}
          <BrandLogo variant="inline" className="shrink-0 lg:hidden" />
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-[640px] mx-auto">
          <GlobalSearch className="w-full" />
        </div>

        {/* End: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ms-auto shrink-0">
          <Button
            onClick={() => setMobileSearchOpen((v) => !v)}
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="جستجو"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleUpload}
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Upload className="h-3.5 w-3.5" />
            آپلود ویدیو
          </Button>

          {authUser && <NotificationBell className="hidden sm:block" />}

          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            aria-label="تغییر تم"
          >
            <ThemeIcon className="h-5 w-5" />
          </Button>

          {authUser ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded hover:bg-muted text-foreground text-xs font-medium transition-all group"
            >
              <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                {(authUser?.full_name || 'ک').charAt(0)}
              </div>
              <span className="hidden lg:block truncate max-w-[100px]">
                {authUser?.full_name || 'کاربر'}
              </span>
            </Link>
          ) : (
            <Button
              onClick={() => openAuthModal()}
              variant="outline"
              size="sm"
            >
              ورود
            </Button>
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
