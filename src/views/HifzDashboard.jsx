'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Award,
  Calendar,
  Play,
  RotateCw,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchHifzProgress } from '@/lib/hifzService';
import { getSurahList, getSurah } from '@/lib/quranApi';
import HifzSessionRunner from '@/components/hifz/HifzSessionRunner';
import OrnamentalDivider from '@/components/OrnamentalDivider';

const fa = (n) => (n || 0).toLocaleString('fa-IR');

export default function HifzDashboard() {
  const [data, setData] = useState({
    items: [],
    due_reviews: [],
    goals: [],
    stats: {
      total_memorized: 0,
      mastered: 0,
      learning: 0,
      needs_review: 0,
      due_today: 0,
    },
  });
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick-launcher custom modal state
  const [activeSessionVerses, setActiveSessionVerses] = useState(null);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(7);
  const [loadingSession, setLoadingSession] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progressData, surahList] = await Promise.all([
        fetchHifzProgress(),
        getSurahList(),
      ]);
      setData(progressData);
      setSurahs(surahList);
    } catch (err) {
      console.error('Error loading Hifz dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Launch a session for today's due reviews
  const handleStartDueReviews = async () => {
    if (data.due_reviews.length === 0) return;
    setLoadingSession(true);
    try {
      const versesToLoad = [];
      for (const item of data.due_reviews.slice(0, 10)) {
        const s = await getSurah(item.surah_number);
        const ayah = s.ayahs.find((a) => a.numberInSurah === item.verse_number);
        if (ayah) {
          versesToLoad.push({
            surah_number: item.surah_number,
            verse_number: item.verse_number,
            arabic: ayah.arabic,
            translation: ayah.translation,
          });
        }
      }
      setActiveSessionVerses(versesToLoad);
    } catch (err) {
      console.error('Failed to load due review verses:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  // Launch custom range session
  const handleStartCustomRange = async () => {
    setLoadingSession(true);
    try {
      const s = await getSurah(Number(selectedSurah));
      const rangeVerses = s.ayahs
        .filter((a) => a.numberInSurah >= Number(startVerse) && a.numberInSurah <= Number(endVerse))
        .map((a) => ({
          surah_number: Number(selectedSurah),
          verse_number: a.numberInSurah,
          arabic: a.arabic,
          translation: a.translation,
        }));
      setActiveSessionVerses(rangeVerses);
    } catch (err) {
      console.error('Failed to load surah range:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  const currentSurahObj = surahs.find((s) => s.number === Number(selectedSurah));

  return (
    <div className="page-shell space-y-8 animate-fade-in font-doran">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded border border-amber-500/30 bg-card p-6 sm:p-10 shadow-soft">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent/15 border border-accent/30 text-accent font-ui text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> دستیار هوشمند حفظ قرآن
            </div>
            <h1 className="font-rokh-bold font-black text-2xl sm:text-4xl text-foreground tracking-tight mb-2">
              پیشخوان و برنامه تثبیت حفظ
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              تکرار هوشمند، پوشش تدریجی کلمات، و زمان‌بندی علمی بازبینی (SM-2) برای تثبیت ماندگار کلام‌الله مجید در قلب و اندیشه
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/quran">
              <Button variant="outline" className="gap-2 text-xs font-bold rounded">
                <BookOpen className="w-4 h-4" />
                <span>ورود به مصحف حفظ</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded border border-border/60 bg-card/60 p-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-rokh-bold">{fa(data.stats.total_memorized)}</div>
              <div className="text-xs text-muted-foreground">آیات در فرآیند حفظ</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded border border-border/60 bg-card/60 p-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-rokh-bold">{fa(data.stats.mastered)}</div>
              <div className="text-xs text-muted-foreground">آیات تثبیت‌شده (کامل)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded border border-border/60 bg-card/60 p-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-rokh-bold">{fa(data.stats.due_today)}</div>
              <div className="text-xs text-muted-foreground">موعد مرور امروز</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded border border-border/60 bg-card/60 p-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-rokh-bold">{fa(data.stats.needs_review)}</div>
              <div className="text-xs text-muted-foreground">نیازمند بازنگری فوری</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Reviews Queue & Session Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Review Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-rokh-bold font-bold text-lg text-foreground">
                صف مرورهای امروز (الگوریتم تکرار فاصله‌دار SM-2)
              </h2>
            </div>
            {data.due_reviews.length > 0 && (
              <Button
                onClick={handleStartDueReviews}
                disabled={loadingSession}
                className="bg-accent text-accent-foreground font-bold text-xs rounded gap-1.5 shadow-sm hover:opacity-90"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>شروع مرور سریع ({fa(data.due_reviews.length)} آیه)</span>
              </Button>
            )}
          </div>

          {data.due_reviews.length === 0 ? (
            <div className="rounded border border-dashed border-border/60 p-8 text-center bg-card/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground">همه آیات مرور شده‌اند!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                در حال حاضر هیچ آیه‌ای در موعد مرور امروز باقی نمانده است. می‌توانید مقطع جدیدی برای حفظ آغاز کنید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.due_reviews.slice(0, 8).map((rev) => (
                <div
                  key={`${rev.surah_number}:${rev.verse_number}`}
                  className="rounded border border-border/60 bg-card/50 p-3.5 flex items-center justify-between hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-accent/15 text-accent flex items-center justify-center font-bold text-xs font-ui">
                      {rev.verse_number}
                    </span>
                    <div>
                      <div className="text-sm font-bold">
                        {surahs.find((s) => s.number === rev.surah_number)?.name || `سوره ${rev.surah_number}`}
                      </div>
                      <div className="text-xs text-muted-foreground font-ui">
                        فاصله فعلی: {fa(rev.interval_days)} روز · دورهای تکرار: {fa(rev.repetitions)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-ui ${
                    rev.status === 'MASTERED'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}>
                    {rev.status === 'MASTERED' ? 'مسلط' : 'در حال یادگیری'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Custom Range Launcher */}
        <div className="rounded border border-border/60 bg-card/70 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent" />
            <h2 className="font-rokh-bold font-bold text-base text-foreground">
              شروع تمرین یا حفظ مقطع جدید
            </h2>
          </div>

          <div className="space-y-3 font-ui text-xs">
            <div>
              <label className="block text-muted-foreground mb-1">انتخاب سوره:</label>
              <select
                value={selectedSurah}
                onChange={(e) => {
                  const sNum = Number(e.target.value);
                  setSelectedSurah(sNum);
                  setStartVerse(1);
                  const sur = surahs.find((s) => s.number === sNum);
                  setEndVerse(Math.min(7, sur?.numberOfAyahs || 7));
                }}
                className="w-full bg-muted text-foreground px-3 py-2 rounded border border-border text-xs"
              >
                {surahs.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.persianName}) - {fa(s.numberOfAyahs)} آیه
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-muted-foreground mb-1">از آیه:</label>
                <input
                  type="number"
                  min={1}
                  max={currentSurahObj?.numberOfAyahs || 286}
                  value={startVerse}
                  onChange={(e) => setStartVerse(Number(e.target.value))}
                  className="w-full bg-muted text-foreground px-3 py-2 rounded border border-border text-xs"
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">تا آیه:</label>
                <input
                  type="number"
                  min={1}
                  max={currentSurahObj?.numberOfAyahs || 286}
                  value={endVerse}
                  onChange={(e) => setEndVerse(Number(e.target.value))}
                  className="w-full bg-muted text-foreground px-3 py-2 rounded border border-border text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleStartCustomRange}
              disabled={loadingSession}
              className="w-full bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded gap-2 shadow-md hover:opacity-90"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>ورود به محیط تمرین متمرکز</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Runner Modal Overlay */}
      {activeSessionVerses && (
        <HifzSessionRunner
          verses={activeSessionVerses}
          onClose={() => {
            setActiveSessionVerses(null);
            loadData();
          }}
          onComplete={() => {
            setActiveSessionVerses(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
