'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, BookOpen, Trophy, Mic, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';
import StreakBadge from '@/components/gamification/StreakBadge';
// New design system
import BrandLogo from '@/components/design-system/BrandLogo';
import GlobalSearch from '@/components/design-system/GlobalSearch';

/* ── Quick Tags — Sub Header ── */
const quickTags = [
  { label: "قرائت تحقيق", category: "recitation", color: "badge-emerald", icon: Mic },
  { label: "قرائت ترتیل", category: "recitation", color: "badge-turquoise", icon: Search },
  { label: "مسابقات بین‌المللی", category: "competition", color: "badge-saffron", icon: Trophy },
  { label: "تفسیر قرآن", category: "tafsir", color: "badge-emerald", icon: BookOpen },
  { label: "محافل انس با قرآن", category: "gathering", color: "badge-turquoise", icon: ChevronRight },
];

/* ── Search Suggestions ── */
const searchSuggestions = {
  surah: [
    "سوره بقره", "سوره یاسین", "سوره رحمان", "سوره ملک", "سوره وقعه",
    "سوره کاف", "سوره طه", "سوره مومنون", "سوره نور", "سوره احزاب",
  ],
  reciters: [
    "شیخ مشاری راشد عفاسی", "عبدالباسط عبدالصمد", "سعود الشریم",
    "ماهر المعیقلی", "علی جابر", "احمد العجمی", "یاسر الدوسری",
    "محمد صدیق المنشاوی", "محمود خلیل الحصری",
  ],
  competitions: [
    "مسابقات قرآنی ۱۴۰۳", "مسابقات قرآنی بین‌المللی",
    "مسابقات حفظ قرآن", "مسابقات تلاوت", "مسابقات تفسیر",
  ],
  verses: [
    "آیه کرسی", "آیه نور", "آیه فطریه", "آیه توحید", "آیه حفظ",
    "آیه شفاء", "آیه رزق", "آیه صبر", "آیه توبه", "آیه دعا",
  ],
};

/**
 * Header Component — Updated to use new design system
 * Keeps backward compatibility with MainLayout (onMenuToggle prop)
 */
export default function Header({ onMenuToggle }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = null;
  const { user: authUser, openAuthModal } = useAuth();
  useTheme();

  const handleQuickSearch = (query, category) => {
    setSearchQuery(query);
    setActiveCategory(category);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(query)}&category=${category}`);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/60 backdrop-blur-xl transition-all duration-300 ${
        isScrolled ? 'bg-background/95 shadow-lg' : 'bg-background/80'
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* ── Top Bar: Logo, Search, Actions ── */}
      <div className="px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2.5 rounded hover:bg-quranic-emerald/5 text-foreground/70 transition-colors"
            aria-label="بسته منو"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo variant="inline" className="shrink-0" />
        </div>

        {/* Center: Global Search (New Design System) */}
        <div className="hidden lg:flex items-center flex-1 max-w-[600px] mx-6">
          <GlobalSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <StreakBadge compact className="hidden sm:block" />
          <NotificationBell />
          <ThemeToggle />
          {authUser ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded bg-quranic-emerald/5 border border-quranic-emerald/10 text-xs font-medium text-foreground hover:bg-quranic-emerald/10 transition-all group"
            >
              <div className="h-7 w-7 rounded bg-quranic-emerald text-quranic-ink flex items-center justify-center font-bold text-xs shrink-0 border border-quranic-emerald/30 group-hover:scale-105 transition-transform">
                {(authUser.full_name || "ک").charAt(0)}
              </div>
              <span className="hidden sm:block truncate max-w-[120px]">{authUser.full_name || "کاربر"}</span>
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="px-4 py-2 rounded bg-quranic-emerald text-white text-xs font-bold hover:opacity-90 shadow-quranic-glow transition-all"
            >
              ورود / ثبت‌نام
            </button>
          )}
        </div>
      </div>

      {/* ── Sub Header: Quick Tags ── */}
      <div className="border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 space-x-2">
            {quickTags.map((tag) => {
              const Icon = tag.icon;
              const isActive = activeCategory === tag.category;
              return (
                <button
                  key={tag.label}
                  onClick={() => handleQuickSearch(tag.label, tag.category)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium font-ui transition-all border ${
                    isActive
                      ? `bg-quranic-saffron text-quranic-ink border-quranic-saffron shadow-saffron-glow`
                      : `bg-transparent text-muted-foreground border-border/50 hover:bg-muted/50 hover:text-foreground hover:border-border`
                  }`}
                >
                  <Icon className={`h-3 w-3 ${isActive ? "text-quranic-ink" : "text-muted-foreground/60"}`} />
                  {tag.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setActiveCategory("all");
                router.push("/search");
              }}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium font-ui text-muted-foreground border border-border/50 bg-transparent hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <Search className="h-3 w-3" /> فلتری پیشرفته
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
