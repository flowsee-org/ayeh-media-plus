import { useState, useEffect } from "react";
import {
  Flame, Award, Lock, Sparkles, BookOpen, Library,
  PenLine, Bookmark, Crown, ChevronDown, ChevronUp, Star,
  CheckCircle2, Compass,
} from "lucide-react";
import { getEngagementSnapshot, ENGAGEMENT_EVENT } from "@/lib/engagement";
import DailyQuests from "@/components/engagement/DailyQuests";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

export default function AchievementsShelf({ readCount = 0, surahsRead = 0, notesCount = 0, bookmarksCount = 0 }) {
  const [snap, setSnap] = useState(getEngagementSnapshot);
  const [showQuests, setShowQuests] = useState(true);

  useEffect(() => {
    const refresh = () => setSnap(getEngagementSnapshot());
    window.addEventListener(ENGAGEMENT_EVENT, refresh);
    return () => window.removeEventListener(ENGAGEMENT_EVENT, refresh);
  }, []);

  const { xp, streak, bestStreak, level, nextLevel } = snap;

  // Level progress percentage
  const currentLevelMin = level.min || 0;
  const nextLevelMin = nextLevel ? nextLevel.min : currentLevelMin + 500;
  const xpInLevel = Math.max(0, xp - currentLevelMin);
  const xpNeeded = Math.max(1, nextLevelMin - currentLevelMin);
  const progressPct = nextLevel ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  // 8 Quranic Badges with dynamic unlock status
  const BADGES = [
    {
      id: "first_verse",
      title: "نخستین گام",
      description: "مطالعه اولین آیه از قرآن کریم",
      icon: Sparkles,
      unlocked: readCount >= 1,
      color: "from-amber-500/20 to-yellow-500/10 text-amber-500 border-amber-500/30",
    },
    {
      id: "devoted_50",
      title: "اهل انس",
      description: "مطالعه بیش از ۵۰ آیه نورانی",
      icon: BookOpen,
      unlocked: readCount >= 50,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-500 border-emerald-500/30",
    },
    {
      id: "surah_complete",
      title: "فاتح سوره",
      description: "تلاوت کامل حداقل یک سوره",
      icon: Library,
      unlocked: surahsRead >= 1,
      color: "from-blue-500/20 to-cyan-500/10 text-blue-500 border-blue-500/30",
    },
    {
      id: "reflection_author",
      title: "صاحب اندیشه",
      description: "نگارش یادداشت و تفکر پیرامون آیه",
      icon: PenLine,
      unlocked: notesCount >= 1,
      color: "from-purple-500/20 to-violet-500/10 text-purple-500 border-purple-500/30",
    },
    {
      id: "bookmark_collector",
      title: "گنجینه‌دار آیات",
      description: "نشان‌گذاری ۳ آیه منتخب",
      icon: Bookmark,
      unlocked: bookmarksCount >= 3,
      color: "from-rose-500/20 to-pink-500/10 text-rose-500 border-rose-500/30",
    },
    {
      id: "streak_3",
      title: "استقامت و پیوستگی",
      description: "حداقل ۳ روز استریک روزانه مداوم",
      icon: Flame,
      unlocked: streak >= 3 || bestStreak >= 3,
      color: "from-orange-500/20 to-amber-500/10 text-orange-500 border-orange-500/30",
    },
    {
      id: "wisdom_seeker",
      title: "جویای حکمت",
      description: "کسب بیش از ۳۰۰ امتیاز تدبّر",
      icon: Compass,
      unlocked: xp >= 300,
      color: "from-indigo-500/20 to-blue-500/10 text-indigo-500 border-indigo-500/30",
    },
    {
      id: "scholar_rank",
      title: "مصباح معرفت",
      description: "رسیدن به سطح عالی تدبّر (حکیم و بالاتر)",
      icon: Crown,
      unlocked: xp >= 600,
      color: "from-yellow-500/20 to-amber-500/10 text-yellow-500 border-yellow-500/30",
    },
  ];

  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6 mb-8 font-yekan animate-fade-in">
      {/* ── Level & Streak Master Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-5 sm:p-7 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-border/50">
          {/* Level Info */}
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-accent/25 to-primary/20 border border-accent/35 flex items-center justify-center text-accent shadow-xs shrink-0">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-ui text-muted-foreground">رتبه معنوی شما:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 text-xs font-bold font-kalameh">
                  <Star className="h-3 w-3 fill-current" />
                  {level.name}
                </span>
              </div>
              <div className="font-kalameh font-black text-2xl text-foreground mt-0.5">
                {fa(xp)} <span className="text-xs font-normal text-muted-foreground font-yekan">امتیاز تدبّر</span>
              </div>
            </div>
          </div>

          {/* Daily Streak Indicator */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
              <Flame className="h-6 w-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-black font-kalameh text-amber-600 dark:text-amber-400">
                <span>{fa(streak)}</span>
                <span>روز مداومت قرآنی</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {streak > 0 ? "همراهی شما پایدار است!" : "امروز با تلاوت آیه‌ای آغاز کنید"}
              </p>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-ui mb-2">
            <span>
              {nextLevel
                ? `پیشرفت به سطح «${nextLevel.name}»`
                : "شما به والاترین سطح همراهی دست یافته‌اید"}
            </span>
            <span>
              {fa(xp)} / {fa(nextLevelMin)} امتیاز
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-amber-500 transition-all duration-700 shadow-xs"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Badges Showcase Shelf ── */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-kalameh font-bold text-lg text-foreground">
                نشان‌های افتخار و دستاوردها
              </h2>
              <p className="text-xs text-muted-foreground">
                مدال‌های قرآنی که در مسیر انس و تدبّر کسب می‌کنید
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs font-bold font-ui text-foreground border border-border/60">
            {fa(unlockedCount)} از {fa(BADGES.length)} باز شده
          </span>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ${
                  b.unlocked
                    ? `bg-gradient-to-b ${b.color} shadow-xs hover:scale-105`
                    : "bg-secondary/30 border-border/40 opacity-55 grayscale"
                }`}
              >
                {/* Badge Icon */}
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-2.5 shadow-xs ${
                    b.unlocked
                      ? "bg-card border border-current"
                      : "bg-muted text-muted-foreground/60 border border-border/40"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="font-kalameh font-bold text-sm text-foreground">
                  {b.title}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug mt-1 font-yekan">
                  {b.description}
                </p>

                {/* Status indicator */}
                <div className="mt-2.5">
                  {b.unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-ui">
                      <CheckCircle2 className="h-3 w-3" />
                      کسب شده
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground font-ui">
                      <Lock className="h-2.5 w-2.5" />
                      قفل است
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Daily Quests (Collapsible) ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={() => setShowQuests(!showQuests)}
            className="flex items-center gap-2 text-sm font-bold font-kalameh text-foreground hover:text-accent transition-colors"
          >
            <span>مأموریت‌های امروز و جوایز روزانه</span>
            {showQuests ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        {showQuests && <DailyQuests />}
      </div>
    </div>
  );
}
