'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X, Home, Compass, Video, Radio, Users, FolderHeart,
  Trophy, MessageCircle, User, BookOpen, Clock, Bookmark, Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import BrandLogo from './BrandLogo';

const mobileItems = [
  { to: '/', label: 'صفحه اصلی', icon: Home },
  { to: '/explore', label: 'کاوش', icon: Compass },
  { to: '/talks', label: 'ویدیوها', icon: Video },
  { to: '/live', label: 'پخش زنده', icon: Radio },
  { to: '/scholars', label: 'کانال‌ها و اساتید', icon: Users },
  { to: '/collections', label: 'لیست‌های پخش', icon: FolderHeart },
  { to: '/competitions', label: 'مسابقات', icon: Trophy },
  { to: '/community', label: 'جامعه', icon: MessageCircle },
  { to: '/quran', label: 'مصحف شریف', icon: BookOpen },
];

export default function MobileNav({ isOpen, onClose, className = '' }) {
  const pathname = usePathname();
  const { user: authUser, openAuthModal } = useAuth();

  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to));

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${className}`} onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="absolute inset-y-0 end-0 w-[min(100%,320px)] bg-card border-s border-border shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <BrandLogo variant="inline" />
          <button
            onClick={onClose}
            className="h-9 w-9 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          {authUser ? (
            <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
              <div className="h-11 w-11 rounded bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                {(authUser.full_name || 'ک').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {authUser.full_name || 'کاربر'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {authUser.phone || authUser.email || 'پروفایل من'}
                </div>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => { onClose(); openAuthModal(); }}
              className="w-full py-2.5 rounded bg-primary text-primary-foreground text-sm font-bold hover:opacity-90"
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground/80 hover:bg-muted'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {authUser && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-bold text-muted-foreground">کتابخانه من</div>
              <Link href="/watch-history" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-foreground/80 hover:bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" /> تاریخچه تماشا
              </Link>
              <Link href="/bookmarks" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-foreground/80 hover:bg-muted">
                <Bookmark className="h-5 w-5 text-muted-foreground" /> نشان‌شده‌ها
              </Link>
              <Link href="/upload" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-foreground/80 hover:bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" /> آپلود ویدیو
              </Link>
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-foreground/80 hover:bg-muted">
                <User className="h-5 w-5 text-muted-foreground" /> پروفایل من
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
