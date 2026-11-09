'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/components/ThemeToggle';
import LiveBar from '@/components/live/LiveBar';
import GlobalAudioPlayer from '@/components/audio/GlobalAudioPlayer';
import StoryBarProvider from '@/components/stories/StoryBarProvider';
import LiveNotifications from '@/components/notifications/LiveNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import PwaInstallBanner from '@/components/pwa/PwaInstallBanner';

// New design system imports
import AppHeader from '@/components/design-system/AppHeader';
import AppSidebar from '@/components/design-system/AppSidebar';
import MobileNav from '@/components/design-system/MobileNav';

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user: authUser, openAuthModal } = useAuth();

  useTheme();

  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-body selection:bg-quranic-saffron/20 selection:text-quranic-ink" dir="rtl">

      {/* Mobile navigation drawer */}
      <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Desktop: Sidebar + Main */}
      <div className="flex h-screen lg:flex-no-wrap overflow-hidden lg:overflow-visible">
        {/* Sidebar (desktop) */}
        <AppSidebar
          className="lg:block hidden"
          collapsed={sidebarCollapsed}
          onCollapseToggle={setSidebarCollapsed}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-y-auto lg:overflow-visible">
          {/* New Global Header */}
          <AppHeader onMenuToggle={() => setMenuOpen(true)} />

          {/* Page Content */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating elements (mobile only) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40">
        <LiveBar />
        <GlobalAudioPlayer />
      </div>

      <LiveNotifications />
      <StoryBarProvider />
      <PwaInstallBanner />
    </div>
  );
}
