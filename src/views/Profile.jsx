'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  getReadCount, getProgressPercent, getRecentVerses, getUniqueSurahsRead,
  getJuzReadCount, getJuzVerseCounts, getBookmarksCount, getNotesCount,
  getCompletedSurahs, TOTAL_QURAN_VERSES,
} from "@/lib/readingTracker";
import { setStorageScope, clearScopedUserData } from "@/lib/storageScope";
import { JUZ_DATA } from "@/lib/juzData";
import { getSurahList } from "@/lib/quranApi";
import IslamicPattern from "@/components/IslamicPattern";
import CharacterAvatar from "@/components/CharacterAvatar";
import AvatarPicker from "@/components/profile/AvatarPicker";
import RecitationPlan from "@/components/profile/RecitationPlan";
import MyPostsGrid from "@/components/profile/MyPostsGrid";
import AchievementsShelf from "@/components/profile/AchievementsShelf";
import { parseAvatar, characterInfo } from "@/lib/avatars";
import { toast } from "react-hot-toast";
import { Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  BookOpen, Bookmark, FileText, Library, Clock, ChevronRight,
  Target, Loader2, Settings as SettingsIcon, Trash2, Mic, Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [avatarCfg, setAvatarCfg] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      api.auth.me().catch(() => null),
      getSurahList().catch(() => []),
    ]).then(([u, s]) => {
      // Make sure stats are read from this user's namespace, not the guest one.
      setStorageScope(u?.id || null);
      setUser(u);
      setAvatarCfg(parseAvatar(u?.avatar_config));
      setSurahs(s);
      setLoading(false);
    });
  }, []);

  // re-read localStorage data when tick changes (navigated back from a verse)
  useEffect(() => {
    if (!loading) setTick((t) => t + 1);
  }, [loading]);

  const readCount = getReadCount();
  const progress = getProgressPercent();
  const surahsRead = getUniqueSurahsRead();
  const completedSurahs = getCompletedSurahs();
  const juzRead = getJuzReadCount();
  const juzVerseCounts = getJuzVerseCounts();
  const bookmarksCount = getBookmarksCount();
  const notesCount = getNotesCount();
  const recent = getRecentVerses(8);

  // tick referenced to satisfy linter while keeping re-render on return
  void tick;

  const surahName = (num) => {
    const s = surahs.find((x) => x.number === num);
    return s ? s.persianName || s.englishName : `سوره ${num}`;
  };

  const verseKeyToPath = (key) => {
    const [s, a] = key.split(":");
    return `/verse/${s}/${a}`;
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  }

  return (
    <div className="page-shell-reading animate-fade-in font-doran">
      {!user && (
        <Card className="rounded border border-primary/30 bg-primary/5 p-4 mb-6 flex items-center justify-between gap-3 text-right">
          <CardContent className="p-0">
            <div>
              <div className="font-ui font-bold text-sm text-foreground">شما به عنوان مهمان اینجا هستید</div>
              <div className="font-ui text-xs text-muted-foreground mt-0.5">برای ذخیره پیشرفت و یادداشت‌ها، وارد حساب شوید.</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/login">ورود</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Clean UI Kit User Header */}
      <div className="rounded border border-border bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
        <div className="relative inline-block mb-3">
          {avatarCfg ? (
            <div className="ring-2 ring-primary/30 rounded">
              <CharacterAvatar config={avatarCfg} size={72} />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center h-16 w-16 rounded bg-primary/10 text-primary ring-2 ring-primary/20">
              <BookOpen className="h-7 w-7" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPickerOpen(true)}
            className="absolute -bottom-1 -left-1 h-7 w-7 rounded bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform"
            title="انتخاب آواتار"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <h1 className="font-rokh-bold font-black text-2xl sm:text-3xl text-foreground tracking-tight">
          {user?.full_name || "کاربر گرامی"}
        </h1>
        {characterInfo(user?.avatar_config) ? (
          <p className="font-doran text-muted-foreground text-sm mt-1">
            شخصیت: {characterInfo(user.avatar_config).name}
            <span className="text-muted-foreground/60"> · {characterInfo(user.avatar_config).epithet}</span>
          </p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="font-ui text-primary text-xs mt-1.5 hover:underline"
          >
            شخصیت قرآنی برای نمایه خود برگزینید
          </Button>
        )}

        {(user?.is_scholar || user?.role === "admin") && (
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/talks"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-accent text-stone-950 text-xs font-bold font-doran shadow-gold-glow hover:bg-accent/90 transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>استودیوی گفتارها و پادکست‌ها</span>
            </Link>
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-red-600 text-white text-xs font-bold font-doran shadow-soft hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
            >
              <Video className="h-3.5 w-3.5" />
              <span>پخش زنده تفسیری</span>
            </Link>
          </div>
        )}
      </div>

      {/* Level, Daily Streak & Achievements Shelf */}
      <AchievementsShelf
        readCount={readCount}
        surahsRead={surahsRead}
        completedSurahs={completedSurahs}
        notesCount={notesCount}
        bookmarksCount={bookmarksCount}
      />

      {/* Progress Ring */}
      <Card className="rounded border border-accent/15 bg-card shadow-premium">
        <CardContent className="p-8 sm:p-12">
          <IslamicPattern className="text-foreground" opacity={0.03} />
          <div className="relative flex flex-col items-center gap-6">
            <ProgressRing percent={progress} />
            <div className="text-center">
              <div className="text-3xl font-rokh-bold font-bold text-accent">
                {readCount.toLocaleString("fa-IR")}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                آیه از {TOTAL_QURAN_VERSES.toLocaleString("fa-IR")} آیه قرآن
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="rounded border border-border bg-card p-4 text-center shadow-soft">
          <CardContent className="p-0 pt-4">
            <div className="inline-flex h-9 w-9 rounded bg-secondary items-center justify-center mb-2.5 text-accent">
              <Library className="h-4.5 w-4.5" />
            </div>
            <div className="font-rokh-bold font-bold text-xl text-foreground">
              {surahsRead.toLocaleString("fa-IR")}
              <span className="text-xs text-muted-foreground font-ui"> / 114</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">سوره‌های خوانده شده</div>
          </CardContent>
        </Card>
        <Card className="rounded border border-border bg-card p-4 text-center shadow-soft">
          <CardContent className="p-0 pt-4">
            <div className="inline-flex h-9 w-9 rounded bg-secondary items-center justify-center mb-2.5 text-accent">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div className="font-rokh-bold font-bold text-xl text-foreground">
              {juzRead.toLocaleString("fa-IR")}
              <span className="text-xs text-muted-foreground font-ui"> / 30</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">اجزای خوانده شده</div>
          </CardContent>
        </Card>
        <Link href="/bookmarks">
          <Card className="rounded border border-border bg-card p-4 text-center shadow-soft">
            <CardContent className="p-0 pt-4">
              <div className="inline-flex h-9 w-9 rounded bg-secondary items-center justify-center mb-2.5 text-accent">
                <Bookmark className="h-4.5 w-4.5" />
              </div>
              <div className="font-rokh-bold font-bold text-xl text-foreground">
                {bookmarksCount.toLocaleString("fa-IR")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">نشان شده‌ها</div>
            </CardContent>
          </Card>
        </Link>
        <Card className="rounded border border-border bg-card p-4 text-center shadow-soft">
          <CardContent className="p-0 pt-4">
            <div className="inline-flex h-9 w-9 rounded bg-secondary items-center justify-center mb-2.5 text-accent">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div className="font-rokh-bold font-bold text-xl text-foreground">
              {notesCount.toLocaleString("fa-IR")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">یادداشت‌ها</div>
          </CardContent>
        </Card>
      </div>

      {/* My posts — Instagram-style grid */}
      <div className="mb-8">
        <h2 className="font-rokh-bold font-bold text-lg mb-4">پست‌های من</h2>
        <MyPostsGrid userId={user?.id} />
      </div>

      {/* Juz Progress Grid */}
      <Card className="rounded border border-accent/10 bg-card p-6 mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">پیشرفت اجزاء</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {JUZ_DATA.map((juz) => {
              const count = juzVerseCounts[juz.number] || 0;
              const isActive = count > 0;
              return (
                <div
                  key={juz.number}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent/15 text-accent ring-1 ring-accent/20"
                      : "bg-muted/40 text-muted-foreground/50"
                  }`}
                  title={`جزء ${juz.number}${count > 0 ? ` — ${count} آیه` : ""}`}
                >
                  {juz.number}
                  {count > 0 && (
                    <span className="text-[8px] text-accent/60 mt-0.5">{count.toLocaleString("fa-IR")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recently Read */}
      {recent.length > 0 ? (
        <div>
          <h2 className="font-rokh-bold font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            آخرین آیات خوانده شده
          </h2>
          <div className="space-y-2">
            {recent.map((r) => {
              const surahNum = Number(r.key.split(":")[0]);
              return (
                <Link
                  key={r.key}
                  href={verseKeyToPath(r.key)}
                  className="!group flex items-center justify-between rounded border border-accent/10 bg-card/40 p-4 hover:border-accent/30 hover:shadow-soft transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                      {r.key}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{surahName(surahNum)}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.juz ? `جزء ${r.juz} · ` : ""}{timeAgo(r.ts)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="rounded border border-dashed border-border/60 p-12 text-center">
          <CardContent>
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              هنوز آیه‌ای نخوانده‌اید. با مرور قرآن، پیشرفت شما اینجا نمایش داده می‌شود.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/quran">
                <BookOpen className="h-4 w-4 mr-2" />
                آغاز تلاوت
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══════ DAILY RECITATION PLAN ═══════ */}
      <RecitationPlan />

      {/* ═══════ SETTINGS ═══════ */}
      <SettingsSection user={user} />

      <AvatarPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentConfig={avatarCfg}
        onSaved={(cfgStr) => setAvatarCfg(parseAvatar(cfgStr))}
      />
    </div>
  );
}

function SettingsSection({ user }) {
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // The backend removes the user and every dependent record in one
      // transaction; the generic entity endpoint deliberately can't.
      await api.auth.deleteAccount();
      clearScopedUserData(user.id);
      api.auth.logout("/login");
    } catch {
      toast.error("حذف حساب در دسترس نیست. لطفاً از بخش پشتیبانی پیگیر باشید.");
    }
  };

  return (
    <Card className="rounded border border-destructive/20 bg-destructive/[0.03] p-6 mt-10">
      <CardHeader className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-destructive" />
        <CardTitle className="text-lg">تنظیمات حساب</CardTitle>
      </CardHeader>
      <CardDescription className="text-xs text-muted-foreground leading-relaxed mb-4">
        حذف حساب، همه اطلاعات شما — پیشرفت تلاوت، نشان‌ها، یادداشت‌ها و فعالیت‌ها — را برای همیشه پاک می‌کند.
      </CardDescription>
      {user ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1.5" />
              حذف حساب
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-rokh-bold">حذف حساب کاربری</AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed">
                با حذف حساب، تمام داده‌های شما — پیشرفت تلاوت، نشان‌ها، یادداشت‌ها، پست‌ها و فعالیت‌ها — برای همیشه از بین می‌رود و بازگشت ندارد.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                بله، حذف شود
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">ورود برای مدیریت حساب</Link>
        </Button>
      )}
    </Card>
  );
}

function ProgressRing({ percent }) {
  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center font-ui" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold font-rokh-bold text-foreground">{percent.toFixed(1)}%</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">پیشرفت تلاوت</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, total, color = "text-primary" }) {
  return (
    <div className="rounded border border-border bg-card p-4 text-center shadow-soft font-ui">
      <div className={`inline-flex h-9 w-9 rounded bg-secondary items-center justify-center mb-2.5 ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="font-rokh-bold font-bold text-xl text-foreground">
        {value.toLocaleString("fa-IR")}
        {total && <span className="text-xs text-muted-foreground font-ui"> / {total.toLocaleString("fa-IR")}</span>}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days.toLocaleString("fa-IR")} روز پیش`;
  if (hours > 0) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  if (minutes > 0) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
  return "همین الان";
}