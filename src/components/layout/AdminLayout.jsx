'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeToggle';
import { AnimatePresence, motion } from 'framer-motion';
import LiveNotifications from '@/components/notifications/LiveNotifications';
import PwaInstallBanner from '@/components/pwa/PwaInstallBanner';

import AdminHeader from '@/components/layout/AdminHeader';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useTheme();

  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
  }, [pathname]);

  return (
    <div
      className="relative min-h-screen bg-background text-foreground font-body selection:bg-primary/15 selection:text-foreground"
      dir="rtl"
    >
      <AdminHeader onMenuToggle={() => setMenuOpen((prev) => !prev)} />

      <main className="flex-1 min-h-0 px-3 sm:px-5 lg:px-6 py-4 sm:py-5 pb-24 lg:pb-6">
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

      <LiveNotifications />
      <PwaInstallBanner />
    </div>
  );
}
