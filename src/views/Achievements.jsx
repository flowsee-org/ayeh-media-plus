'use client';
import { useState, useEffect } from "react";
import {
  Flame,
  Sparkles,
  Trophy,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import DailyQuestsCard from "@/components/gamification/DailyQuestsCard";
import BadgeGallery from "@/components/gamification/BadgeGallery";
import LeaderboardTable from "@/components/gamification/LeaderboardTable";

export default function Achievements() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("quests"); // 'quests' | 'badges' | 'leaderboard'
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.gamification.getStatus();
      setStatus(res);
    } catch (err) {
      console.error("Error fetching gamification status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const streakDays = status?.streak_days || user?.streak_days || 0;
  const totalXp = status?.total_xp || user?.total_xp || 0;
  const levelInfo = status?.current_level_info || {
    name: "مستمع",
    minXp: 0,
    maxXp: 250,
    title: "مستمع کلام وحی",
  };

  const xpInCurrentLevel = totalXp - levelInfo.minXp;
  const levelSpan = levelInfo.maxXp - levelInfo.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / levelSpan) * 100)));

  return (
    <div dir="rtl" className="min-h-screen pb-20 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-rokh-bold"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            بازگشت به صفحه اصلی
          </Link>
        </div>

        {/* Hero Section: Royal Emerald Spiritual Card with Chehel Sotoun Gold Vault */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#063326] via-[#04241b] to-[#02130e] border border-amber-400/40 p-6 sm:p-8 text-white shadow-2xl overflow-hidden mb-8">
          {/* Authentic Safavid Gilded Vault Ceiling Backdrop */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/images/art/chehel_sotoun_gold_vault.webp"
              alt=""
              className="w-full h-full object-cover filter brightness-[0.28] contrast-[1.1] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#031c15]/95 via-[#04241b]/85 to-[#02130e]/95 backdrop-blur-[1px]" />
          </div>

          {/* Ambient decorative lights */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-400/30 text-emerald-200 text-xs font-rokh-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>سطح معنوی فعلی: {levelInfo.name} ({levelInfo.title})</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-rokh-bold text-white tracking-tight">
                مسیر نورانی انس و تدبر در قرآن
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl font-doran leading-relaxed">
                «خَیْرُ الْأَعْمَالِ مَا دَامَ عَلَیْهِ صَاحِبُهُ وَإِنْ قَلَّ» — بهترین و باارزش‌ترین اعمال، کاری است که تداوم و استمرار داشته باشد گرچه اندک باشد.
              </p>
            </div>

            {/* Streak & XP Stats Widgets */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Streak Card */}
              <div className="px-5 py-3.5 rounded-2xl bg-black/40 border border-orange-500/30 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
                  <Flame className="w-6 h-6 fill-white animate-pulse" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-white">
                    {streakDays} <span className="text-xs font-rokh-bold text-orange-300">روز</span>
                  </div>
                  <div className="text-[11px] text-orange-200/80 font-rokh-bold">
                    استریک پیوسته
                  </div>
                </div>
              </div>

              {/* Total XP Card */}
              <div className="px-5 py-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 backdrop-blur-md flex items-center gap-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-white">
                    {totalXp.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-200/80 font-rokh-bold">
                    امتیاز معنوی (XP)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="relative z-10 mt-6 pt-5 border-t border-emerald-800/60">
            <div className="flex items-center justify-between text-xs text-emerald-200/90 mb-2 font-rokh-bold">
              <span>پیشرفت تا سطح بعدی: {levelInfo.maxXp.toLocaleString()} XP</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-border/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("quests")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-rokh-bold text-sm font-bold transition-all shrink-0 ${
              activeTab === "quests"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            مأموریت‌های امروز
            {status?.completed_quests_count !== undefined && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-background/30 text-current font-mono">
                {status.completed_quests_count}/3
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("badges")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-rokh-bold text-sm font-bold transition-all shrink-0 ${
              activeTab === "badges"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Award className="w-4 h-4" />
            نشان‌ها و مدال‌ها
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-rokh-bold text-sm font-bold transition-all shrink-0 ${
              activeTab === "leaderboard"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Trophy className="w-4 h-4" />
            تابلوی رده‌بندی
          </button>
        </div>

        {/* Active Tab Content */}
        <div>
          {activeTab === "quests" && (
            <DailyQuestsCard onProgressUpdate={fetchStatus} />
          )}

          {activeTab === "badges" && (
            <BadgeGallery badges={status?.all_badges || []} />
          )}

          {activeTab === "leaderboard" && (
            <LeaderboardTable />
          )}
        </div>
      </div>
    </div>
  );
}
