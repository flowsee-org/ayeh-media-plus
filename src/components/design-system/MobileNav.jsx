'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Home, BookOpen, Sparkles, Video, Users, FolderHeart, Compass, Trophy, MessageCircle, User, Flame } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Mobile Navigation Drawer
 * Slide-over navigation for mobile devices.
 */
const mobileItems = [
  { to: '/', label: 'صفحه اصلی', icon: Home },
  { to: '/quran', label: 'مصحف شریف', icon: BookOpen },
  { to: '/khatm', label: 'ختم قرآن', icon: Sparkles },
  { to: '/talks', label: 'گفتارهای اساتید', icon: Video },
  { to: '/explore', label: 'کاوش موضوعی', icon: Compass },
  { to: '/topics', label: 'موضوعات', icon: Flame },
  { to: '/collections', label: 'مجموعه‌ها', icon: FolderHeart },
  { to: '/competitions', label: 'مسابقات', icon: Trophy },
  { to: '/scholars', label: 'اساتید', icon: Users },
  { to: '/community', label: 'جامعه', icon: MessageCircle },
];

export default function MobileNav({ isOpen, onClose, className = '' }) {
  const pathname = usePathname();
  const { user: authUser, openAuthModal } = useAuth();
  const userRole = authUser?.role || 'anonymous';

  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to));

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden ${className}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-[80vw] bg-card border-l border-quranic-emerald/30 shadow-premium flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-quranic-emerald to-quranic-turquoise flex items-center justify-center text-white shadow-quranic-glow">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-rokh-bold font-bold text-base text-quranic-emerald">آیه مدیا پلاس</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Section */}
        <div className="p-4">
          {authUser ? (
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-quranic-emerald/20 text-quranic-emerald flex items-center justify-center font-bold border border-quranic-emerald/30">
                {(authUser.full_name || 'ک').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {authUser.full_name || 'کاربر'}
                </div>
                <div className="text-xs text-foreground/50 truncate">{authUser.phone || authUser.email || ''}</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { onClose(); openAuthModal(); }}
              className="w-full py-3 rounded-xl bg-quranic-emerald text-white text-xs font-bold hover:opacity-90 shadow-quranic-glow"
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold text-quranic-saffron/70 uppercase tracking-wider">
            بخش اصلی
          </div>
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-quranic-saffron/15 border border-quranic-saffron/30 text-quranic-saffron-dark shadow-lg'
                    : 'text-foreground/70 hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {authUser && (
            <>
              <div className="px-3 mb-2 mt-4 text-[10px] font-bold text-quranic-emerald/70 uppercase tracking-wider">
                امکانات بیشتر
              </div>
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:bg-secondary/50 hover:text-foreground transition-all"
              >
                <User className="h-4 w-4 shrink-0" /> پروفایل من
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
