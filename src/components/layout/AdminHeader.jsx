'use client';

import { useEffect, useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeToggle';
import BrandLogo from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';

/**
 * Admin Header — simplified admin chrome
 * Logo · theme toggle · profile
 */
export default function AdminHeader({ onMenuToggle, className = '' }) {
  const [mounted, setMounted] = useState(false);
  const { toggleTheme, theme } = useTheme();
  const ThemeIcon = mounted ? (theme === 'dark' ? Sun : Moon) : Moon;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/80 transition-all duration-200 bg-card/95 backdrop-blur-md ${className}`}
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
          <BrandLogo variant="inline" className="shrink-0 lg:hidden" />
        </div>

        {/* End: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ms-auto shrink-0">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            aria-label="تغییر تم"
          >
            <ThemeIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
