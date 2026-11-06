'use client';
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { getAudioUrl } from "@/lib/quranApi";
import { getSurahByNumber } from "@/lib/surahData";
import {
  Sparkles, Send, Loader2, BookOpen, Play, Pause,
  Compass, Heart, CheckCircle2, RotateCcw,
  ExternalLink, Waves,
  Sun, Moon, Shield,
} from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

const SYSTEM_FRAMING = `You are a compassionate Quranic reflection companion (همدم قرآنی و تدبّر). Respond in authentic Persian.
A user shares their spiritual state, emotion, or life question. Your purpose is to listen with deep empathy, guide them to authentic Quranic verses that speak directly to their heart, and offer concrete daily actions.
Return a structured JSON with:
- empathy: A warm, heartfelt 2-3 sentence Persian message acknowledging their feeling without judgment.
- verses: Array of 1 to 3 relevant real verses, each containing:
  • verse_key: "surah:ayah" numeric (e.g. "13:28")
  • arabic: exact Arabic text of the verse with diacritics
  • translation: clear, heartwarming Persian translation
  • why: 2 sentences explaining why this verse addresses their exact feeling
  • action: one practical step, reflection, or dhikr for today
- closing: a brief spiritual du'a or encouraging closing thought.`;

const MOODS = [
  {
    id: "anxiety",
    label: "اضطراب و بی‌قراری",
    icon: Waves,
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
    prompt: "احساس اضطراب، نگرانی و دلشوره دارم و نیازمند آرامش با کلام خداوند هستم.",
  },
  {
    id: "hope",
    label: "ناامیدی و طلب امید",
    icon: Sun,
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    prompt: "احساس خستگی، ناامیدی و بسته شدن راه‌ها را دارم و به دنبال بارقه‌ای از امید و گشایش در قرآنم.",
  },
  {
    id: "loneliness",
    label: "تنهایی و دلتنگی",
    icon: Moon,
    color: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
    prompt: "احساس تنهایی، غربت و دلتنگی می‌کنم و می‌خواهم نزدیکی خداوند و مونس بودن او را حس کنم.",
  },
  {
    id: "gratitude",
    label: "شکرگزاری و شادی",
    icon: Sparkles,
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    prompt: "دلم سرشار از شکر و سپاس به درگاه الهی است؛ آیاتی برای شکرگزاری و طمأنینه بیشتر می‌خواهم.",
  },
  {
    id: "decision",
    label: "تردید و دوراهی",
    icon: Compass,
    color: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
    prompt: "بر سر یک دوراهی مهم قرار گرفته‌ام و به دنبال راهنمایی قرآنی و توکل راستین هستم.",
  },
  {
    id: "grief",
    label: "غم و داغ‌دیدگی",
    icon: Heart,
    color: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
    prompt: "غم و اندوه سنگینی بر قلبم نشسته است؛ کلماتی از جنس صبر و تسلی الهی برای آرامش می‌خواهم.",
  },
  {
    id: "anger",
    label: "خشم و رنجش",
    icon: Shield,
    color: "from-red-500/20 to-orange-500/10 border-red-500/30 text-red-600 dark:text-red-400",
    prompt: "احساس عصبانیت و رنجش از دیگران دارم و می‌خواهم راه حلم و بخشش قرآنی را بیابم.",
  },
];

export default function Assistant() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: {
        empathy:
          "السلام علیکم و رحمة الله. من همدم قرآنی شما هستم. قرآن شفابخش دل‌ها و راهنمای هر تلاطم درونی است. اکنون حال دلتان چگونه است؟ می‌توانید از نوار بالای صفحه حال خود را برگزینید یا هر دغدغه‌ای دارید بی‌پرده بنویسید.",
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const queryHandledRef = useRef(false);

  // Audio Player hook
  const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim() && !queryHandledRef.current) {
      queryHandledRef.current = true;
      send(q.trim());
    }
  }, [searchParams]);

  const send = async (textToSend) => {
    const text = (typeof textToSend === "string" ? textToSend : input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_FRAMING}\n\nپیام یا حال روحی کاربر:\n"""${text}"""`,
        response_json_schema: {
          type: "object",
          properties: {
            empathy: { type: "string" },
            verses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  verse_key: { type: "string" },
                  arabic: { type: "string" },
                  translation: { type: "string" },
                  why: { type: "string" },
                  action: { type: "string" },
                },
              },
            },
            closing: { type: "string" },
          },
        },
      });

      setMessages((m) => [...m, { role: "assistant", content: res, structured: true }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: {
            empathy:
              "متأسفانه در دریافت پاسخ مشکلی رخ داد. اما بدانید که درهای رحمت الهی همواره گشوده است. لطفاً پرسش خود را دوباره مطرح بفرمایید.",
          },
        },
      ]);
    }
    setLoading(false);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: {
          empathy:
            "گفتگوی تازه آغاز شد. حال دل خود را با انتخاب یکی از گزینه‌ها یا نوشتن پیامی به اشتراک بگذارید تا آیات روشنگر متناسب را با هم مرور کنیم.",
        },
      },
    ]);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)] animate-fade-in font-yekan">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 mb-3 p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/95 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-accent/20 to-primary/20 text-accent border border-accent/30 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-kalameh font-bold text-lg sm:text-xl text-foreground">
              همدم قرآنی و دستیار تدبّر
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              تطبیق احوالات روحی، آرامش با کلام وحی و تلاوت صوتی آیات
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-secondary/60 hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors font-ui"
          title="شروع گفتگوی جدید"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">شروع دوباره</span>
        </button>
      </div>

      {/* Mood Selector Horizontal Bar */}
      <div className="mb-3 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-muted-foreground shrink-0 font-ui ml-1">
            حال درونی شما:
          </span>
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.id}
                onClick={() => send(mood.prompt)}
                disabled={loading}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold font-ui border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 bg-gradient-to-r ${mood.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 py-2 rounded-2xl bg-secondary/20 border border-border/40 p-3 sm:p-4 mb-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            } animate-fade-in-up`}
          >
            {m.role === "assistant" ? (
              <div className="h-8 w-8 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <BookOpen className="h-4 w-4" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground border border-primary/20 flex items-center justify-center shrink-0 mt-1 font-bold text-xs font-ui">
                شما
              </div>
            )}

            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground font-medium rounded-tr-xs shadow-soft"
                  : "bg-card border border-border/80 rounded-tl-xs text-foreground shadow-soft"
              }`}
            >
              {typeof m.content === "string" ? (
                <div className="whitespace-pre-line">{m.content}</div>
              ) : (
                <AssistantStructuredResponse
                  content={m.content}
                  playTrack={playTrack}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  togglePlay={togglePlay}
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="h-8 w-8 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl bg-card border border-border/70 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span>همدم قرآنی در حال کاوش آیات و آماده‌سازی پاسخ است...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="relative flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="حال درونی، دغدغه یا موضوع مورد نظر خود را بنویسید..."
          disabled={loading}
          className="flex-1 py-3.5 pr-4 pl-12 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 font-yekan text-xs sm:text-sm shadow-soft transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shadow-soft"
          aria-label="ارسال"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 rotate-180" />
          )}
        </button>
      </form>
    </div>
  );
}

/**
 * Renders the structured companion message with empathy box, interactive verse cards and audio player
 */
function AssistantStructuredResponse({ content, playTrack, currentTrack, isPlaying, togglePlay }) {
  const { empathy, verses = [], closing } = content || {};

  return (
    <div className="space-y-4">
      {/* Empathy Box */}
      {empathy && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
          <div className="flex items-center gap-1.5 text-accent font-bold mb-1 font-kalameh">
            <Heart className="h-3.5 w-3.5 fill-current" />
            <span>همدلی با شما:</span>
          </div>
          <p className="whitespace-pre-line">{empathy}</p>
        </div>
      )}

      {/* Recommended Verse Cards */}
      {verses.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-kalameh">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>آیات تسکین‌بخش و هدایت‌گر:</span>
          </div>

          {verses.map((v, idx) => (
            <CompanionVerseCard
              key={idx}
              verse={v}
              playTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              togglePlay={togglePlay}
            />
          ))}
        </div>
      )}

      {/* Closing Thought */}
      {closing && (
        <div className="pt-2 border-t border-border/50 text-xs sm:text-[13px] text-muted-foreground/90 italic font-yekan leading-relaxed">
          {closing}
        </div>
      )}
    </div>
  );
}

/**
 * Individual interactive verse card with audio player, calligraphy and action step
 */
function CompanionVerseCard({ verse, playTrack, currentTrack, isPlaying, togglePlay }) {
  const { verse_key, arabic, translation, why, action } = verse || {};

  // Surah parsing
  const meta = useMemo(() => {
    if (!verse_key) return null;
    const parts = verse_key.split(":").map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    const [surah, ayah] = parts;
    const sInfo = getSurahByNumber(surah);
    return {
      surah,
      ayah,
      surahName: sInfo ? sInfo.persianName : `سوره ${surah}`,
      audioUrl: getAudioUrl(surah, ayah, "ar.alafasy"),
    };
  }, [verse_key]);

  const isThisVersePlaying =
    isPlaying && currentTrack?.verseKey === verse_key;

  const handleAudio = (e) => {
    e.preventDefault();
    if (!meta) return;

    if (isThisVersePlaying) {
      togglePlay();
    } else {
      playTrack({
        id: `assistant-verse-${meta.surah}-${meta.ayah}`,
        title: `سوره ${meta.surahName} — آیه ${fa(meta.ayah)}`,
        subtitle: "تلاوت ترتیل • مشاری العفاسی",
        audioUrl: meta.audioUrl,
        type: "quran",
        verseKey: verse_key,
        reciter: "مشاری العفاسی",
      });
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card via-primary/5 to-secondary/30 p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40">
      {/* Header: Surah Name Badge + Play Recitation Button */}
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 font-kalameh text-xs font-bold text-foreground border border-border/80">
          <BookOpen className="h-3 w-3 text-accent" />
          <span>
            {meta ? `سوره ${meta.surahName} • آیه ${fa(meta.ayah)}` : `آیه ${verse_key}`}
          </span>
        </div>

        {meta && (
          <button
            onClick={handleAudio}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-ui transition-all shadow-xs ${
              isThisVersePlaying
                ? "bg-amber-500 text-amber-950 ring-2 ring-amber-500/40 animate-pulse"
                : "bg-secondary text-primary hover:bg-accent/15 hover:text-accent border border-border/60"
            }`}
            title={isThisVersePlaying ? "توقف تلاوت" : "پخش تلاوت ترتیل آیه"}
          >
            {isThisVersePlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>در حال پخش</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                <span>تلاوت آیه</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Arabic Calligraphy */}
      {arabic && (
        <div
          className="my-3 font-arabic text-lg sm:text-xl leading-[2.3] text-foreground text-center font-bold tracking-wide select-text"
          dir="rtl"
          lang="ar"
        >
          {arabic}
        </div>
      )}

      {/* Translation */}
      {translation && (
        <p className="font-yekan text-xs sm:text-sm leading-relaxed text-muted-foreground text-center font-medium my-2">
          «{translation}»
        </p>
      )}

      {/* Why this verse */}
      {why && (
        <div className="mt-3 rounded-xl bg-card/70 border border-border/40 p-2.5 text-xs text-foreground/85 leading-relaxed font-yekan">
          <span className="font-bold text-accent ml-1 font-kalameh">نکته تدبّری:</span>
          <span>{why}</span>
        </div>
      )}

      {/* Action item */}
      {action && (
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-yekan font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="font-bold ml-1 font-kalameh">گام و ذکر امروز:</span>
            <span>{action}</span>
          </div>
        </div>
      )}

      {/* Link to Verse in Quran */}
      {meta && (
        <div className="mt-3 flex justify-end">
          <Link
            to={`/verse/${meta.surah}/${meta.ayah}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline font-ui"
          >
            <span>مطالعه در مصحف و تفاسیر</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
