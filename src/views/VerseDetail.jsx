'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { getAyah, RECITERS, getAudioUrl } from "@/lib/quranApi";
import { SURAH_DATA } from "@/lib/surahData";
import { markVerseRead } from "@/lib/readingTracker";
import { scopedKey } from "@/lib/storageScope";
import ReflectionCard from "@/components/ReflectionCard";
import IslamicPattern from "@/components/IslamicPattern";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { PersianKatibeh, PersianShamseh } from "@/components/PersianIslamicArt";
import { Image } from "@/components/ui/image";
import {
  Clock, Play, Pause, BookOpen, Sparkles, History,
  Languages, HelpCircle, Lightbulb, Compass, Link2, Video, Mic,
  Bookmark, Share2, FileText, MessageSquare, Loader2, Quote, BookMarked, RotateCw,
  ChevronRight, ChevronLeft, ChevronDown, Bot, Palette,
} from "lucide-react";
import TextSettings from "@/components/verse/TextSettings";
import BackButton from "@/components/BackButton";
import { useReadingPrefs, renderQuranWaqf, DIACRITIC_THEMES } from "@/lib/readingPrefs";
import { trackEngagement } from "@/lib/engagement";
import { useAudioPlayer } from "@/context/AudioPlayerContext";

const fa = (n) => (n || 0).toLocaleString("fa-IR");
const MIHRAB_IMG = "/images/art/nasir_light_columns.jpg";

const TABS = [
  { id: "overview", label: "نمای کلی", icon: BookOpen },
  { id: "linguistic", label: "زبان‌شناسی", icon: Languages },
  { id: "context", label: "زمینه", icon: History },
  { id: "tafsir", label: "تفسیر", icon: Compass },
  { id: "reflections", label: "تدبّر", icon: Sparkles },
  { id: "lessons", label: "درس‌ها", icon: Lightbulb },
  { id: "media", label: "رسانه", icon: Video },
  { id: "related", label: "مرتبط", icon: Link2 },
  { id: "notes", label: "یادداشت", icon: FileText },
];

export default function VerseDetail() {
  const { surah, ayah } = useParams();
  const [ayahData, setAyahData] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [scholars, setScholars] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState("ar.alafasy");
  const [prefs, handlePrefsChange] = useReadingPrefs();

  const navigate = useNavigate();
  const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  const surahNum = Number(surah);
  const ayahNum = Number(ayah);
  const totalAyahs = SURAH_DATA[surahNum - 1]?.numberOfAyahs || ayahData?.totalVerses || 286;

  const currentTheme =
    DIACRITIC_THEMES.find((t) => t.id === prefs.diacriticTheme) || DIACRITIC_THEMES[0];

  const arabic = reflection?.arabic || ayahData?.arabic || "";
  const translation = reflection?.translation || ayahData?.translation || "";
  const transliteration = reflection?.transliteration || ayahData?.transliteration || "";
  const surahName = ayahData?.surahName || reflection?.surah_name_arabic || `سوره ${surah}`;
  const activeReciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
  const computedAudio = getAudioUrl(surahNum, ayahNum, selectedReciter) || ayahData?.audio || reflection?.audio_url || "";
  const difficultyLabel = reflection?.difficulty_level
    ? { beginner: "مقدماتی", intermediate: "متوسط", advanced: "پیشرفته" }[reflection.difficulty_level] || reflection.difficulty_level
    : null;

  const isThisVersePlaying = isPlaying && currentTrack?.id === `verse-${surah}-${ayah}`;

  const toggleAudio = (reciterId = selectedReciter) => {
    trackEngagement("audio_play");
    const targetRec = RECITERS.find((r) => r.id === reciterId) || activeReciter;
    const trackAudioUrl = getAudioUrl(surahNum, ayahNum, reciterId);
    if (currentTrack?.id === `verse-${surah}-${ayah}` && currentTrack?.reciterId === reciterId) {
      togglePlay();
    } else {
      playTrack({
        id: `verse-${surah}-${ayah}`,
        title: `سوره ${surahName} — آیه ${fa(ayahNum)}`,
        subtitle: `${targetRec.style} • ${targetRec.name}`,
        audioUrl: trackAudioUrl,
        type: "quran",
        verseKey: `${surah}:${ayah}`,
        reciter: targetRec.name,
        reciterId: targetRec.id,
      });
    }
  };

  const handleReciterChange = (newReciterId) => {
    setSelectedReciter(newReciterId);
    if (isThisVersePlaying) {
      toggleAudio(newReciterId);
    }
  };

  const hasPrev = ayahNum > 1;
  const hasNext = ayahNum < totalAyahs;

  const goToPrev = () => {
    if (hasPrev) {
      navigate(`/verse/${surahNum}/${ayahNum - 1}`);
    }
  };
  const goToNext = () => {
    if (hasNext) {
      navigate(`/verse/${surahNum}/${ayahNum + 1}`);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${arabic || ""}\n«${translation || ""}»\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `آیه ${ayah} ${surahName}`, text, url });
        return;
      } catch {}
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("متن و پیوند آیه رونوشت شد");
    } catch {
      toast.error("امکان کپی در این مرورگر فراهم نشد");
    }
  };

  useEffect(() => {
    const key = `${surah}:${ayah}`;
    const bookmarks = JSON.parse(localStorage.getItem(scopedKey("tadabbur-bookmarks")) || "[]");
    setBookmarked(bookmarks.includes(key));
  }, [surah, ayah]);

  useEffect(() => {
    if (reflection || ayahData) {
      const key = `${surah}:${ayah}`;
      const translation = reflection?.translation || ayahData?.translation || "";
      localStorage.setItem("tadabbur-last-verse", JSON.stringify({ verse_key: key, translation }));
    }
  }, [reflection, ayahData, surah, ayah]);

  const toggleBookmark = () => {
    const key = `${surah}:${ayah}`;
    const bookmarks = JSON.parse(localStorage.getItem(scopedKey("tadabbur-bookmarks")) || "[]");
    const wasBookmarked = bookmarks.includes(key);
    const updated = wasBookmarked
      ? bookmarks.filter((b) => b !== key)
      : [...bookmarks, key];
    localStorage.setItem(scopedKey("tadabbur-bookmarks"), JSON.stringify(updated));
    setBookmarked(updated.includes(key));
    if (!wasBookmarked) trackEngagement("bookmark");
  };

  useEffect(() => {
    setLoading(true);
    setAyahData(null);
    setReflection(null);
    const key = `${surah}:${ayah}`;
    Promise.all([
      getAyah(Number(surah), Number(ayah)).catch(() => null),
      api.entities.Verse.filter({ verse_key: key }, "-created_date", 5).catch(() => []),
    ])
      .then(async ([a, refls]) => {
        setAyahData(a);
        if (a) { markVerseRead(`${surah}:${ayah}`, { juz: a.juz, surah: Number(surah) }); trackEngagement("verse_read"); }
        const refl = refls[0] || null;
        setReflection(refl);
        if (refl) {
          const ids = [...new Set((refl.reflections || []).map((r) => r.scholar_id).filter(Boolean))];
          const map = {};
          await Promise.all(
            ids.map(async (sid) => {
              try { map[sid] = await api.entities.Scholar.get(sid); } catch { map[sid] = { name: "نامشخص" }; }
            })
          );
          setScholars(map);
        }
      })
      .finally(() => setLoading(false));
  }, [surah, ayah]);

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  }

  if (!ayahData && !reflection) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">بارگذاری این آیه ناموفق بود. لطفاً دوباره تلاش کنید.</p>
        <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all">
          <RotateCw className="h-4 w-4" /> تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ═══════════════ VERSE HERO ═══════════════ */}
      <section className="relative overflow-hidden border-b border-accent/10">
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.1] pointer-events-none">
          <img src={MIHRAB_IMG} className="w-full h-full object-cover" alt="" />
        </div>
        <IslamicPattern className="text-foreground" opacity={0.03} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-10">
            <BackButton to={`/quran?surah=${surah}`} label={surahName} />

            {/* Stepper: Previous / Next Ayah navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-accent/20 bg-card/85 backdrop-blur-md shadow-soft">
              <button
                type="button"
                onClick={goToPrev}
                disabled={!hasPrev}
                title="آیه قبلی"
                className={`p-1 rounded-full transition-all flex items-center justify-center ${
                  hasPrev
                    ? "text-foreground hover:bg-accent/20 hover:text-accent active:scale-95 cursor-pointer"
                    : "text-muted-foreground/30 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <span className="text-[11px] sm:text-xs font-bold font-ui text-foreground px-2 py-0.5 rounded-full bg-muted/60 whitespace-nowrap">
                آیه {fa(ayahNum)} از {fa(totalAyahs)}
              </span>

              <button
                type="button"
                onClick={goToNext}
                disabled={!hasNext}
                title="آیه بعدی"
                className={`p-1 rounded-full transition-all flex items-center justify-center ${
                  hasNext
                    ? "text-foreground hover:bg-accent/20 hover:text-accent active:scale-95 cursor-pointer"
                    : "text-muted-foreground/30 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <TextSettings prefs={prefs} onChange={handlePrefsChange} />
          </div>

          <PersianKatibeh className={`text-center my-6 ${currentTheme.className}`}>
            <div className="flex items-center justify-center gap-2 text-xs tracking-[0.25em] text-accent mb-6 font-semibold">
              <PersianShamseh size={20} className="text-accent" />
              <span>{surahName} · آیه {ayah} ({surah}:{ayah})</span>
              <PersianShamseh size={20} className="text-accent" />
            </div>

            {/* Large Arabic verse with Quran typography */}
            <div
              className="text-foreground/95 will-animate my-6 font-bold"
              dir="rtl"
              lang="ar"
              style={{
                fontFamily: prefs.arabicFont,
                fontSize: `calc(clamp(1.875rem, 5vw, 3rem) * ${prefs.arabicScale || prefs.textScale || 1.15})`,
                lineHeight: prefs.lineHeight || 2.5,
              }}
            >
              {renderQuranWaqf(arabic, prefs.highlightWaqf !== false)}
            </div>

            {transliteration && (
              <p className="text-sm text-muted-foreground/60 mt-4 tracking-wide font-light" dir="ltr">
                {transliteration}
              </p>
            )}

            <OrnamentalDivider className="my-6 sm:my-8" />

            {prefs.showTranslation && (
              <p
                className="max-w-2xl mx-auto text-foreground/85 font-medium leading-[2.3]"
                style={{
                  fontSize: `calc(clamp(1.125rem, 2vw, 1.3rem) * ${prefs.translationScale || 1.0})`,
                }}
              >
                «{translation}»
              </p>
            )}
          </PersianKatibeh>

          {/* Verse Visual Content */}
          {(reflection?.videos?.length > 0 || reflection?.images?.length > 0) && (
            <div className="mt-8 mx-auto max-w-2xl">
              {reflection?.videos?.[0]?.url ? (
                <div className="rounded-2xl overflow-hidden border border-accent/15 shadow-premium">
                  <video src={reflection.videos[0].url} controls className="w-full" poster={reflection?.images?.[0]} />
                  {reflection.videos[0].title && (
                    <div className="px-4 py-3 bg-card/60 text-center text-sm text-muted-foreground">
                      {reflection.videos[0].title}
                    </div>
                  )}
                </div>
              ) : reflection?.images?.[0] ? (
                <Image
                  src={reflection.images[0]}
                  fittingType="fill"
                  className="w-full rounded-2xl border border-accent/15 shadow-premium"
                  originWidth={1200}
                  originHeight={675}
                />
              ) : null}
            </div>
          )}

          {/* Badges */}
          <div className="mt-8 flex items-center justify-center gap-2 flex-wrap text-xs">
            {ayahData?.revelationType && <Badge>{ayahData.revelationType === "Meccan" ? "مکی" : "مدنی"}</Badge>}
            {difficultyLabel && <Badge>{difficultyLabel}</Badge>}
            {reflection?.estimated_reading_time && <Badge><Clock className="h-3 w-3 ml-1" /> {reflection.estimated_reading_time} دقیقه</Badge>}
            {ayahData?.juz && <Badge>جزء {ayahData.juz}</Badge>}
            {(reflection?.tags || []).slice(0, 4).map((t) => <Badge key={t}>{t}</Badge>)}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <ActionBtn onClick={() => navigate(`/studio?surah=${surah}&ayah=${ayah}`)} icon={Palette} label="طراحی کارت و استوری" />
            <ActionBtn onClick={toggleBookmark} active={bookmarked} icon={Bookmark} label={bookmarked ? "نشان شده" : "نشان کردن"} />
            <ActionBtn onClick={handleShare} icon={Share2} label="اشتراک‌گذاری" />
            <ActionBtn onClick={() => navigate(`/community?verse=${surah}:${ayah}`)} icon={MessageSquare} label="گفتگو پیرامون آیه" />
            <ActionBtn onClick={() => setTab("notes")} active={tab === "notes"} icon={FileText} label="یادداشت شخصی" />
          </div>

          {/* Global Audio Player Bar */}
          {computedAudio && (
            <div className="mt-8 mx-auto max-w-xl rounded-2xl border border-accent/30 bg-card/90 backdrop-blur-md p-4 sm:p-5 shadow-premium">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => toggleAudio()}
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-accent to-yellow-500 text-stone-950 flex items-center justify-center hover:shadow-gold-glow transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
                  title={isThisVersePlaying ? "توقف تلاوت" : "پخش در پلیر سراسری"}
                >
                  {isThisVersePlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current mr-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">تلاوت ترتیل آیه مبارکه</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground truncate">{activeReciter.name}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-xs text-accent font-semibold">{isThisVersePlaying ? "در حال پخش" : activeReciter.style}</span>
                  </div>
                </div>

                {/* Reciter selector */}
                <div className="relative shrink-0">
                  <select
                    value={selectedReciter}
                    onChange={(e) => handleReciterChange(e.target.value)}
                    className="appearance-none bg-accent/10 border border-accent/25 hover:border-accent/50 text-accent font-ui text-xs font-bold rounded-xl py-2 pl-7 pr-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    title="انتخاب قاری"
                  >
                    {RECITERS.map((r) => (
                      <option key={r.id} value={r.id} className="bg-card text-foreground">
                        {r.name} ({r.style})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-accent pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ TAB BAR ═══════════════ */}
      <div className="sticky top-16 z-30 border-b border-accent/10 glass-strong">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2.5 no-scrollbar">
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button
                key={tid}
                onClick={() => setTab(tid)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  tab === tid ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {tab === "overview" && <Overview reflection={reflection} translation={translation} />}
        {tab === "linguistic" && <Linguistic reflection={reflection} />}
        {tab === "context" && <Context reflection={reflection} />}
        {tab === "tafsir" && (
          <Tafsir
            reflection={reflection}
            surah={surah}
            ayah={ayah}
            surahName={surahName}
            translation={translation}
            navigate={navigate}
          />
        )}
        {tab === "reflections" && (
          <Reflections reflection={reflection} scholars={scholars} />
        )}
        {tab === "lessons" && <Lessons reflection={reflection} />}
        {tab === "media" && (
          <Media
            reflection={reflection}
            audio={computedAudio}
            reciter={activeReciter.name}
          />
        )}
        {tab === "related" && <Related reflection={reflection} />}
        {tab === "notes" && <Notes verseKey={`${surah}:${ayah}`} />}
      </div>
    </div>
  );
}

/* ── UI Primitives ── */
function Badge({ children }) {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary text-foreground font-ui text-xs font-medium border border-border">{children}</span>;
}
/**
 * @param {{ icon: any; label: string; onClick: () => void; active?: boolean }} props
 */
function ActionBtn({ icon: Icon, label, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-ui font-bold border transition-all ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
function Section({ icon: Icon, title, children }) {
  return (
    <section className="mb-8 sm:mb-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-kalameh font-bold text-lg sm:text-xl text-foreground">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}
function Prose({ children }) {
  return <div className="text-foreground/70 leading-[2.1] whitespace-pre-line max-w-none text-[15px] sm:text-base">{children}</div>;
}
function Empty({ text = "محتوایی برای این بخش ثبت نشده است." }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
      <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
      {text}
    </div>
  );
}

/* ── Tab Content Components ── */
function Overview({ reflection, translation }) {
  return (
    <div>
      <Section icon={Compass} title="ترجمه و معنا">
        <div className="rounded-2xl border border-border/40 bg-card/40 p-6">
          <Quote className="h-5 w-5 text-accent/40 mb-3" />
          <Prose>{translation}</Prose>
        </div>
      </Section>
      <Section icon={Sparkles} title="تدبّر">
        {reflection?.tadabbur ? (
          <div className="rounded-2xl border border-border/40 bg-card/40 p-6"><Prose>{reflection.tadabbur}</Prose></div>
        ) : <Empty />}
      </Section>
      {reflection?.questions_to_reflect?.length > 0 && (
        <Section icon={HelpCircle} title="پرسش‌های تدبّر">
          <div className="space-y-3">
            {reflection.questions_to_reflect.map((q, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-border/40 bg-card/30 p-4">
                <span className="shrink-0 h-6 w-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">؟</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Linguistic({ reflection }) {
  if (!reflection) return <Empty />;
  return (
    <div>
      {reflection.word_analysis?.length > 0 && (
        <Section icon={Languages} title="معنای کلمه‌به‌کلمه">
          <div className="grid sm:grid-cols-2 gap-3">
            {reflection.word_analysis.map((w, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-4 hover:border-accent/20 transition-colors">
                <div className="text-right text-2xl font-arabic text-foreground/80 mb-1" dir="rtl">{w.word}</div>
                <div className="text-xs text-muted-foreground italic">{w.transliteration}</div>
                <div className="text-sm mt-1.5 font-medium">{w.meaning}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {reflection.root_words?.length > 0 && (
        <Section icon={BookOpen} title="ریشه واژه‌ها">
          <div className="grid sm:grid-cols-2 gap-3">
            {reflection.root_words.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-4 flex items-center justify-between">
                <div>
                  <div className="font-arabic text-2xl text-foreground/80" dir="rtl">{r.root}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{r.meaning}</div>
                </div>
                <span className="text-xs text-accent font-medium shrink-0">{r.occurrences}× در قرآن</span>
              </div>
            ))}
          </div>
        </Section>
      )}
      {reflection.grammar_breakdown && (
        <Section icon={FileText} title="تجزیه گرامری">
          <div className="rounded-2xl border border-border/40 bg-card/40 p-6"><Prose>{reflection.grammar_breakdown}</Prose></div>
        </Section>
      )}
      {!reflection.word_analysis?.length && !reflection.root_words?.length && !reflection.grammar_breakdown && <Empty />}
    </div>
  );
}

function Context({ reflection }) {
  if (!reflection) return <Empty />;
  const hasContent = reflection.historical_context || reflection.asbab_al_nuzul;
  if (!hasContent) return <Empty />;

  return (
    <div>
      {/* Timeline style */}
      <div className="relative pr-6">
        <div className="absolute right-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/30 via-border to-transparent" />
        {reflection.historical_context && (
          <TimelineItem icon={History} title="زمینه تاریخی">
            <Prose>{reflection.historical_context}</Prose>
          </TimelineItem>
        )}
        {reflection.asbab_al_nuzul && (
          <TimelineItem icon={Compass} title="اسباب نزول">
            <Prose>{reflection.asbab_al_nuzul}</Prose>
          </TimelineItem>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ icon: Icon, title, children }) {
  return (
    <div className="relative mb-8">
      <div className="absolute right-0 top-0 h-6 w-6 rounded-full bg-card border-2 border-accent/30 flex items-center justify-center -mr-1.5">
        <Icon className="h-3 w-3 text-accent" />
      </div>
      <div className="mr-8">
        <h3 className="font-display font-bold text-lg mb-3">{title}</h3>
        <div className="rounded-2xl border border-border/40 bg-card/40 p-5">{children}</div>
      </div>
    </div>
  );
}

function Tafsir({ reflection, surah, ayah, surahName, translation, navigate }) {
  if (reflection?.classical_tafsir || reflection?.modern_tafsir) {
    return (
      <div>
        {reflection.classical_tafsir && (
          <Section icon={BookOpen} title="تفسیر کلاسیک">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6"><Prose>{reflection.classical_tafsir}</Prose></div>
          </Section>
        )}
        {reflection.modern_tafsir && (
          <Section icon={Sparkles} title="تفسیر نوین">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6"><Prose>{reflection.modern_tafsir}</Prose></div>
          </Section>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-card/60 backdrop-blur-sm p-6 sm:p-10 text-center shadow-soft">
      <div className="h-12 w-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4 border border-accent/20 shadow-xs">
        <Compass className="h-6 w-6" />
      </div>
      <h3 className="font-kalameh font-bold text-lg sm:text-xl mb-2 text-foreground">
        تفسیر و شأن نزول {surahName}، آیه {fa(ayah)}
      </h3>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
        تفسیر سنتی این آیه در دیتابیس محلی ثبت نشده است. می‌توانید تفسیر تحلیلی، شأن نزول، اسباب نزول و تدبّر عمیق این آیه را مستقیماً از دستیار هوشمند قرآنی دریافت نمایید یا با اعضای انجمن تدبّر به اشتراک بگذارید.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/assistant?q=${encodeURIComponent(
                `لطفاً تفسیر، شأن نزول و نکات تدبّری آیه ${ayah} ${surahName} («${translation}») را برایم شرح دهید.`
              )}`
            )
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-ui text-xs font-bold shadow-soft hover:shadow-glow transition-all cursor-pointer"
        >
          <Bot className="h-4 w-4" />
          تفسیر تحلیلی با دستیار قرآنی
        </button>
        <button
          type="button"
          onClick={() => navigate(`/community?verse=${surah}:${ayah}`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted text-foreground font-ui text-xs font-medium hover:bg-muted/80 transition-all border border-border/40 cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          طرح پرسش در انجمن تدبّر
        </button>
      </div>
    </div>
  );
}

function Reflections({ reflection, scholars }) {
  if (!reflection?.reflections?.length) return <Empty text="بازتاب تدبّری برای این آیه ثبت نشده است." />;
  return (
    <div className="grid gap-3">
      {reflection.reflections.map((r, i) => (
        <ReflectionCard key={i} reflection={r} scholarName={r.scholar_id ? scholars[r.scholar_id]?.name : null} />
      ))}
    </div>
  );
}

function Lessons({ reflection }) {
  if (!reflection) return <Empty />;
  return (
    <div>
      {reflection.life_lessons?.length > 0 && (
        <Section icon={Lightbulb} title="درس‌های زندگی">
          <div className="space-y-3">
            {reflection.life_lessons.map((l, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-4">
                <span className="shrink-0 h-7 w-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{l}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
      {reflection.practical_applications?.length > 0 && (
        <Section icon={Compass} title="کاربردهای عملی">
          <div className="space-y-3">
            {reflection.practical_applications.map((a, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-border/40 bg-card/40 p-4">
                <Compass className="shrink-0 h-5 w-5 text-accent mt-0.5" />
                <span className="text-sm text-muted-foreground leading-relaxed">{a}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
      {!reflection.life_lessons?.length && !reflection.practical_applications?.length && <Empty />}
    </div>
  );
}

function Media({ reflection, audio, reciter }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElemRef = useRef(null);

  const toggleMediaPlay = () => {
    if (!audioElemRef.current) return;
    if (isPlaying) {
      audioElemRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElemRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div>
      {reflection?.videos?.length > 0 ? (
        <Section icon={Video} title="ویدیوها">
          <div className="grid sm:grid-cols-2 gap-4">
            {reflection.videos.map((v, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden hover:shadow-soft transition-all duration-300">
                <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
                  <Video className="h-8 w-8 text-muted-foreground/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="font-medium text-sm">{v.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{v.scholar}{v.duration ? ` · ${v.duration}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : <Empty text="ویدیویی برای این آیه موجود نیست." />}
      {audio && (
        <Section icon={Mic} title="صوت">
          <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
            <div className="flex items-center gap-4 mb-3">
              <button
                type="button"
                onClick={toggleMediaPlay}
                className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 hover:shadow-glow transition-all"
                title={isPlaying ? "توقف تلاوت" : "پخش تلاوت"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 mr-0.5" />}
              </button>
              <div>
                <div className="text-sm font-medium">تلاوت آیه</div>
                <div className="text-xs text-muted-foreground">{reciter}</div>
              </div>
            </div>
            <audio
              ref={audioElemRef}
              src={audio}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              controls
              className="w-full"
            />
          </div>
        </Section>
      )}
    </div>
  );
}

function Related({ reflection }) {
  if (!reflection) return <Empty />;
  return (
    <div>
      {reflection.related_verses?.length > 0 && (
        <Section icon={Link2} title="آیات مرتبط">
          <div className="space-y-3">
            {reflection.related_verses.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-4 flex items-start gap-3">
                <BookMarked className="h-4 w-4 text-accent/50 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
      {reflection.related_hadith?.length > 0 && (
        <Section icon={BookOpen} title="احادیث مرتبط">
          <div className="space-y-3">
            {reflection.related_hadith.map((h, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-5">
                <Quote className="h-4 w-4 text-accent/40 mb-2" />
                <p className="text-sm italic text-muted-foreground leading-relaxed">«{h.text}»</p>
                <div className="text-xs text-muted-foreground/80 mt-3 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-accent/40" />
                  {h.narrator} · {h.source}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {reflection.references?.length > 0 && (
        <Section icon={FileText} title="منابع">
          <div className="rounded-2xl border border-border/40 bg-card/40 p-5 space-y-2">
            {reflection.references.map((r, i) => (
              <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-accent font-mono text-xs shrink-0 mt-0.5">[{i + 1}]</span>
                <span className="leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
      {!reflection.related_verses?.length && !reflection.related_hadith?.length && !reflection.references?.length && <Empty />}
    </div>
  );
}

function Notes({ verseKey }) {
  const [notes, setNotes] = useState("");
  const [savedStatus, setSavedStatus] = useState(false);
  // Notes are namespaced per account so two users on the same browser don't
  // read each other's tadabbur notes (and the profile note count matches).
  const storageKey = scopedKey(`tadabbur-notes-${verseKey}`);

  useEffect(() => {
    setNotes(localStorage.getItem(storageKey) || "");
  }, [storageKey]);

  const save = (val) => {
    setNotes(val);
    localStorage.setItem(storageKey, val);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleManualSave = () => {
    localStorage.setItem(storageKey, notes);
    setSavedStatus(true);
    toast.success("یادداشت با موفقیت ذخیره شد");
    if (notes.trim()) trackEngagement("note");
  };

  return (
    <div>
      <Section icon={FileText} title="یادداشت شخصی">
        <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
          <textarea
            value={notes}
            onChange={(e) => save(e.target.value)}
            onBlur={() => { if (notes.trim()) trackEngagement("note"); }}
            placeholder="یادداشت‌های خود را درباره این آیه اینجا بنویسید…"
            className="w-full min-h-[220px] bg-transparent text-sm leading-relaxed focus:outline-none resize-y placeholder:text-muted-foreground/50"
            dir="rtl"
          />
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {savedStatus ? "✓ تغییرات ذخیره شد" : "یادداشت‌ها خودکار در این مرورگر ذخیره می‌شوند."}
            </span>
            <button
              onClick={handleManualSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-ui text-xs font-bold shadow-soft hover:opacity-90 transition-opacity"
            >
              ذخیره یادداشت
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}