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
    <div dir="rtl" className="page-shell animate-fade-in font-doran pb-16">
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-rokh-bold"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          بازگشت به صفحه اصلی
        </Link>
      </div>

      {/* Soft hero — aligned with Collections/Competitions card headers */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft mb-8 overflow-hidden relative">
        <div className="absolute -top-16 -end-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-rokh-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>سطح معنوی فعلی: {levelInfo.name} ({levelInfo.title})</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-rokh-bold text-foreground tracking-tight">
              مسیر نورانی انس و تدبر در قرآن
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-editorial leading-relaxed">
              «خَیْرُ الْأَعْمَالِ مَا دَامَ عَلَیْهِ صَاحِبُهُ وَإِنْ قَلَّ» — بهترین و باارزش‌ترین اعمال، کاری است که تداوم و استمرار داشته باشد گرچه اندک باشد.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-3.5 rounded-2xl bg-secondary border border-border flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-foreground">
                  {streakDays} <span className="text-xs font-rokh-bold text-muted-foreground">روز</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-rokh-bold">
                  استریک پیوسته
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 rounded-2xl bg-secondary border border-border flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-foreground">
                  {totalXp.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground font-rokh-bold">
                  امتیاز معنوی (XP)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 pt-5 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 font-rokh-bold">
            <span>پیشرفت تا سطح بعدی: {levelInfo.maxXp.toLocaleString()} XP</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: "quests", label: "مأموریت‌های امروز", icon: BookOpen, badge: status?.completed_quests_count !== undefined ? `${status.completed_quests_count}/3` : null },
          { id: "badges", label: "نشان‌ها و مدال‌ها", icon: Award },
          { id: "leaderboard", label: "تابلوی رده‌بندی", icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-rokh-bold text-sm font-bold transition-all shrink-0 border ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-background/30 text-current font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

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
  );
}
