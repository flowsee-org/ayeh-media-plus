'use client';
import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import DailyRecommendation from "@/components/home/DailyRecommendation";
import KhatmHomeBanner from "@/components/home/KhatmHomeBanner";
import GamificationHomeBanner from "@/components/home/GamificationHomeBanner";
import IslamicArtShowcase from "@/components/home/IslamicArtShowcase";
import TalksPreview from "@/components/home/TalksPreview";
import FeedList from "@/components/feed/FeedList";
import SuggestedRail from "@/components/feed/SuggestedRail";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const [dailyVerse, setDailyVerse] = useState(null);

  useEffect(() => {
    // Pick a featured curated verse for hero
    base44.entities.Verse.list("-created_date", 5)
      .then((items) => {
        if (items && items.length > 0) {
          setDailyVerse(items[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Grand Islamic Hero & Gateway */}
      <Hero dailyVerse={dailyVerse} />

      {/* 2. Smart Personalized Ayah Recommendations */}
      <DailyRecommendation />

      {/* 2.5 Collaborative Khatm Quran Banner */}
      <KhatmHomeBanner />

      {/* 2.8 Gamification, Streaks & Daily Quests Banner */}
      <GamificationHomeBanner />

      {/* 3. Scholars & Video Talks Preview */}
      <TalksPreview />

      {/* 3.5 Persian-Islamic Architecture & Art Gallery Showcase */}
      <IslamicArtShowcase />

      {/* 4. Active Community Tadabbur Feed & Suggestion Rail */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-border/80">
          <div>
            <h2 className="font-kalameh font-bold text-2xl sm:text-3xl text-foreground">
              نبض جامعه قرآنی
            </h2>
            <p className="font-yekan text-xs sm:text-sm text-muted-foreground mt-1">
              تأملات، یادداشت‌های تفسیری و کارت‌های قرآنی به اشتراک گذاشته شده توسط همراهان
            </p>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <FeedList />
          </div>
          <aside className="sticky top-24 hidden lg:block">
            <SuggestedRail />
          </aside>
        </div>
      </section>
    </div>
  );
}
