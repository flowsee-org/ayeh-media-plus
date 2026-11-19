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
import BottomNav from '@/components/BottomNav';
import FloatingAssistantChat from '@/components/assistant/FloatingAssistantChat';
import {
  Home, Compass, Video, Radio, User,
} from 'lucide-react';

import AdminLayout from '@/components/layout/AdminLayout';
import AppHeader from '@/components/ui/app-header';
import AppSidebar from '@/components/ui/app-sidebar';
import MobileNav from '@/components/ui/mobile-nav';

const MOBILE_TABS = [
  { to: '/', label: 'خانه', icon: Home },
  { to: '/explore', label: 'کاوش', icon: Compass },
  { to: '/talks', label: 'ویدیو', icon: Video },
  { to: '/live', label: 'زنده', icon: Radio },
  { to: '/profile', label: 'پروفایل', icon: User },
];

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useAuth();
  useTheme();

  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
    setMenuOpen(false);
  }, [pathname]);

  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  const isLiveViewer = Boolean(pathname?.match(/^\/live\/[^/]+/));
  const hideChrome = isLiveViewer;

  return (
    <div
      className="relative min-h-screen bg-background text-foreground font-body selection:bg-primary/15 selection:text-foreground"
      dir="rtl"
    >
      <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-h-screen">
        {!hideChrome && (
          <AppSidebar
            collapsed={sidebarCollapsed}
            onCollapseToggle={setSidebarCollapsed}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {!hideChrome && (
            <>
              <AppHeader onMenuToggle={() => setMenuOpen(true)} />
              {/* Stories bar — floating, pinned to the top of the screen just under the header */}
              <StoryBarProvider />
            </>
          )}

          <main
            className={`flex-1 min-h-0 ${
              hideChrome
                ? 'p-0'
                : 'px-3 sm:px-5 lg:px-6 py-4 sm:py-5 pb-24 lg:pb-6'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav — Aparat-style */}
      {!hideChrome && (
        <div className="lg:hidden">
          <BottomNav tabs={MOBILE_TABS} />
        </div>
      )}

      {!hideChrome && (
        <div className="lg:hidden fixed bottom-14 inset-x-0 z-30 pointer-events-none [&>*]:pointer-events-auto">
          <LiveBar />
          <GlobalAudioPlayer />
        </div>
      )}

      <LiveNotifications />
      <PwaInstallBanner />
      <FloatingAssistantChat />
    </div>
  );
}
