import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "@/lib/router-compat";
import {
  BookOpen,
  Library,
  Users,
  FolderHeart,
  Search,
  User,
  Trophy,
  MessageCircle,
  Video,
  Compass,
  Globe,
  Menu,
  X,
  Sparkles,
  Bookmark,
  Home as HomeIcon,
  Flame,
  Palette,
} from "lucide-react";
import api from "@/lib/api";
import { useScholar } from "@/lib/scholarAccess";
import NotificationBell from "./notifications/NotificationBell";
import LiveNotifications from "./notifications/LiveNotifications";
import ThemeToggle, { useTheme } from "./ThemeToggle";
import StreakBadge from "./gamification/StreakBadge";
import { TabNavProvider } from "@/lib/tabNavigation";
import BottomNav from "./BottomNav";
import StoryBarProvider from "./stories/StoryBarProvider";
import LiveBar from "./live/LiveBar";
import GlobalAudioPlayer from "./audio/GlobalAudioPlayer";
import { AnimatePresence, motion } from "framer-motion";
import { IslamicStar } from "./IslamicOrnaments";
import { useAuth } from "@/lib/AuthContext";
import PwaInstallBanner from "./pwa/PwaInstallBanner";

const desktopNav = [
  { to: "/", label: "خانه", icon: HomeIcon },
  { to: "/quran", label: "مصحف شریف", icon: Library },
  { to: "/khatm", label: "ختم قرآن", icon: Sparkles },
  { to: "/studio", label: "استودیو کارت", icon: Palette },
  { to: "/achievements", label: "مأموریت‌ها", icon: Flame },
  { to: "/community", label: "جامعه قرآنی", icon: MessageCircle },
];

const mobileNav = [
  { to: "/", label: "خانه", icon: HomeIcon },
  { to: "/quran", label: "قرآن", icon: Library },
  { to: "/khatm", label: "ختم", icon: Sparkles },
  { to: "/studio", label: "استودیو", icon: Palette },
  { to: "/community", label: "جامعه", icon: MessageCircle },
];

const moreNav = [
  { to: "/studio", label: "استودیوی طراحی کارت و استوری", icon: Palette },
  { to: "/achievements", label: "مأموریت‌ها، استریک و افتخارات", icon: Flame },
  { to: "/khatm", label: "ختم قرآن دسته‌جمعی", icon: Sparkles },
  { to: "/talks", label: "گفتارهای اساتید و درس‌گفتارها", icon: Video },
  { to: "/explore", label: "کاوش و تدبّر در مفاهیم", icon: Globe },
  { to: "/topics", label: "موضوعات و مفاهیم کلیدی", icon: Compass },
  { to: "/collections", label: "مجموعه‌های منتخب آیات", icon: FolderHeart },
  { to: "/guide", label: "آیه‌ی راه (هوش مصنوعی)", icon: Compass },
  { to: "/assistant", label: "دستیار تفسیری", icon: Sparkles },
  { to: "/scholars", label: "اساتید و مفسران", icon: Users },
  { to: "/competitions", label: "مسابقات قرآنی", icon: Trophy },
  { to: "/bookmarks", label: "نشان‌شده‌ها", icon: Bookmark },
  { to: "/profile", label: "پروفایل من", icon: User },
  { to: "/admin", label: "پنل مدیریت", icon: BookOpen },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user: authUser, openAuthModal } = useAuth();
  const [onlineCount, setOnlineCount] = useState(1);
  const { isScholar } = useScholar();

  const activeUser = authUser;

  useEffect(() => {
    const unsub = api.socket?.on("presence:global", (data) => {
      if (typeof data?.count === "number") {
        setOnlineCount(data.count);
      }
    });
    return () => unsub?.();
  }, []);

  useTheme();

  useEffect(() => {
    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <TabNavProvider tabs={mobileNav}>
      <div className="relative min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-accent/20" dir="rtl">
        {/* Subtle geometric pattern & Orsi stained-glass ambient atmosphere */}
        <div className="fixed inset-0 pattern-islamic pointer-events-none opacity-30 z-0" />
        <div className="fixed top-0 -right-40 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed bottom-0 -left-40 w-96 h-96 bg-gradient-to-tr from-rose-500/8 via-cyan-500/6 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

        {/* Top Header */}
        <header
          className="sticky top-0 z-40 glass-header shadow-soft transition-all"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            {/* Brand Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-950 text-white shadow-emerald-glow transition-transform group-hover:scale-105 border border-amber-400/40">
                <BookOpen className="h-5 w-5 text-orange-300" strokeWidth={2.2} />
                <div className="absolute -top-1 -right-1">
                  <IslamicStar size={12} className="text-orange-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight leading-tight text-foreground group-hover:text-primary transition-colors">
                  آیه مدیا <span className="text-accent">پلاس</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                  رسانه و جامعه چندرسانه‌ای قرآن کریم
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {desktopNav.map(({ to, label, icon: Icon }) => {
                const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      active
                        ? "bg-primary/10 text-primary font-bold shadow-soft border border-primary/20 dark:bg-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-medium"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Online Presence Pill */}
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium"
                title="کاربران آنلاین هم‌اکنون در سامانه"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{onlineCount.toLocaleString("fa-IR")} آنلاین</span>
              </div>

              <Link
                to="/search"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="جستجو"
                title="جستجو در قرآن"
              >
                <Search className="h-4 w-4" />
              </Link>

              <StreakBadge compact />
              <NotificationBell />
              <ThemeToggle />

              {isScholar && (
                <Link
                  to="/assistant"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-accent hover:bg-accent/15 transition-colors"
                  aria-label="دستیار علمی"
                  title="دستیار علمی اساتید"
                >
                  <Sparkles className="h-4 w-4" />
                </Link>
              )}

              {activeUser ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pr-1.5 pl-3 py-1 rounded-full bg-secondary/80 hover:bg-secondary border border-border text-xs font-medium transition-all"
                >
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    {(activeUser.full_name || activeUser.phone || activeUser.email || "؟").charAt(0)}
                  </div>
                  <span className="truncate max-w-[90px]">{activeUser.full_name || "کاربر"}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:shadow-emerald-glow transition-all"
                >
                  ورود / ثبت‌نام
                </button>
              )}

              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="منوی بیشتر"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              <StreakBadge compact />
              <Link
                to="/search"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="جستجو"
              >
                <Search className="h-4 w-4" />
              </Link>
              <ThemeToggle />
              <NotificationBell />
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-secondary"
                aria-label="منوی جانبی"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* More Menu Drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <div
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-accent/30 shadow-premium animate-slide-in-right flex flex-col overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pattern-islamic absolute inset-0 opacity-15 pointer-events-none" />

              <div className="relative flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <IslamicStar size={16} className="text-accent" />
                  <span className="font-display font-bold text-base text-primary dark:text-accent">
                    سامانه آیه مدیا پلاس
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span>{onlineCount.toLocaleString("fa-IR")}</span>
                  </span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* User badge in drawer */}
              {activeUser ? (
                <div className="relative mx-4 mt-4 rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 to-primary/10 p-3 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                      {(activeUser.full_name || activeUser.phone || activeUser.email || "؟").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-sm truncate">{activeUser.full_name || "کاربر گرامی"}</div>
                      <div className="text-xs text-muted-foreground truncate">{activeUser.phone || activeUser.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline"
                  >
                    <User className="h-3 w-3" /> مشاهده و ویرایش حساب کاربری
                  </Link>
                </div>
              ) : (
                <div className="relative mx-4 mt-4 p-3 rounded-xl border border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground mb-2">برای استفاده کامل از امکانات وارد شوید</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openAuthModal();
                    }}
                    className="inline-block w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
                  >
                    ورود به حساب
                  </button>
                </div>
              )}

              {/* Nav sections in drawer */}
              <nav className="relative flex-1 overflow-y-auto px-3 py-3 space-y-4">
                <div>
                  <div className="px-3 pb-1 text-[11px] font-bold text-accent uppercase tracking-wider">
                    بخش‌های اصلی
                  </div>
                  <div className="space-y-0.5">
                    {desktopNav.map(({ to, label, icon: Icon }) => {
                      const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            active
                              ? "bg-primary text-primary-foreground font-semibold shadow-soft"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-3 pb-1 text-[11px] font-bold text-accent uppercase tracking-wider">
                    امکانات تکمیلی
                  </div>
                  <div className="space-y-0.5">
                    {moreNav.map(({ to, label, icon: Icon }) => {
                      const active = pathname === to;
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            active
                              ? "bg-accent/20 text-accent font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          <Icon className="h-4 w-4 text-accent" />
                          <span className="flex-1">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>

              <div className="relative p-4 border-t border-border text-center bg-secondary/30">
                <p className="font-arabic text-sm text-accent/80" dir="rtl" lang="ar">
                  كِتَابٌ أَنْزَلْنَاهُ إِلَيْكَ مُبَارَكٌ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Notifications & Banners */}
        <LiveNotifications />
        <StoryBarProvider />
        <LiveBar />
        <GlobalAudioPlayer />

        {/* Main Routed Content */}
        <main className="relative z-10 flex-1 pb-20 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav tabs={mobileNav} />

        {/* Footer */}
        <footer className="hidden md:block relative z-10 border-t border-accent/20 bg-card/60 backdrop-blur-md mt-16">
          <div className="pattern-islamic absolute inset-0 opacity-10 pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-emerald-glow border border-accent/40">
                  <BookOpen className="h-4 w-4 text-accent" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight text-foreground">
                  سامانه چندرسانه‌ای <span className="text-accent">آیه مدیا پلاس</span>
                </span>
              </div>

              <p className="font-arabic text-2xl text-accent/90" dir="rtl" lang="ar">
                كِتَابٌ أَنْزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِيَدَّبَّرُوا آيَاتِهِ
              </p>

              <div className="flex items-center gap-3">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent/40" />
                <IslamicStar size={16} className="text-accent" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-accent/40" />
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground pt-2">
                <Link to="/quran" className="hover:text-accent transition-colors">مصحف شریف</Link>
                <Link to="/explore" className="hover:text-accent transition-colors">کاوش موضوعی</Link>
                <Link to="/talks" className="hover:text-accent transition-colors">سخنرانی‌های اساتید</Link>
                <Link to="/community" className="hover:text-accent transition-colors">جامعه تدبّر</Link>
                <Link to="/competitions" className="hover:text-accent transition-colors">مسابقات تلاوت</Link>
                <Link to="/guide" className="hover:text-accent transition-colors">راهنمای هوشمند قرآنی</Link>
              </div>

              <p className="text-xs text-muted-foreground/80 max-w-xl leading-relaxed pt-2">
                محتوای تفسیری و دروس ارائه شده در این درگاه بازتابی علمی برای تدبّر و تعمیق در معارف وحیانی است. کلیه حقوق برای آیه مدیا پلاس محفوظ است.
              </p>
            </div>
          </div>
        </footer>
      </div>
      <PwaInstallBanner />
    </TabNavProvider>
  );
}
