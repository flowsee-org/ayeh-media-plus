'use client';
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { getAudioUrl } from "@/lib/quranApi";
import { getSurahByNumber } from "@/lib/surahData";
import { cn } from "@/lib/utils";
import {
  Sparkles, Send, Loader2, BookOpen, Play, Pause,
  Compass, Heart, CheckCircle2, RotateCcw,
  ExternalLink, Waves, Sun, Moon, Shield, User, Users, Wand2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/**
 * Quranic Assistant Personas
 * Each persona has a distinct framing, tone, and purpose.
 */
const ASSISTANTS = [
  {
    id: "reflection",
    name: "همدم تدبّر",
    nameEnglish: "Reflection Companion",
    icon: Compass,
    color: "bg-gradient-to-br from-emerald-500/20 to-turquoise-500/10 border-emerald-500/30 text-emerald-600",
    avatarBg: "bg-emerald-500/15",
    avatarColor: "text-emerald-600",
    shortDesc: "تأمل در معانی و پیوند با دل",
    framing: `You are a compassionate Quranic reflection companion (همدم تدبّر). Respond in authentic Persian.
Help the user reflect deeply on Quranic verses relevant to their emotional or spiritual state.
Return structured JSON:
- empathy: warm 2-3 sentence Persian message acknowledging their feeling
- verses: 1-3 real verses with verse_key, arabic, translation, why (2 sentences), action (one practical step)
- closing: brief spiritual du'a or encouraging thought`,
  },
  {
    id: "tafsir",
    name: "مفسر",
    nameEnglish: "Tafsir Guide",
    icon: BookOpen,
    color: "bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-600",
    avatarBg: "bg-blue-500/15",
    avatarColor: "text-blue-600",
    shortDesc: "تفسیر، شان نزول و مفاهیم",
    framing: `You are a knowledgeable Quranic tafsir assistant (مفسر قرآنی). Respond in authentic Persian.
Provide verse context, sha'n nuzul (occasion of revelation), and clear explanation of meaning.
Return structured JSON:
- empathy: warm 2-3 sentence Persian introduction
- verses: 1-3 real verses with verse_key, arabic, translation, why (explanation of meaning/context), action (reflection step)
- closing: brief concluding thought`,
  },
  {
    id: "comfort",
    name: "تسلی‌بخش",
    nameEnglish: "Comfort Giver",
    icon: Heart,
    color: "bg-gradient-to-br from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-600",
    avatarBg: "bg-rose-500/15",
    avatarColor: "text-rose-600",
    shortDesc: "کلمات صبر و آرامش برای دل",
    framing: `You are a gentle Quranic comfort assistant (تسلی‌بخش). Respond in authentic Persian.
Offer soothing Quranic verses and gentle words for grief, anxiety, loneliness, or hardship.
Return structured JSON:
- empathy: warm, tender 2-3 sentence Persian message
- verses: 1-3 comforting real verses with verse_key, arabic, translation, why (why it comforts), action (dhikr or small step)
- closing: a brief spiritual du'a`,
  },
  {
    id: "guidance",
    name: "راهنمای قرآنی",
    nameEnglish: "Guidance Assistant",
    icon: Users,
    color: "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600",
    avatarBg: "bg-amber-500/15",
    avatarColor: "text-amber-600",
    shortDesc: "راهنمایی در تصمیم‌گیری و دوراهی‌ها",
    framing: `You are a Quranic guidance assistant (راهنمای قرآنی). Respond in authentic Persian.
Help the user with decisions, crossroads, and life direction using Quranic wisdom and tawakkul.
Return structured JSON:
- empathy: warm 2-3 sentence Persian message acknowledging their situation
- verses: 1-3 guiding real verses with verse_key, arabic, translation, why (how it guides), action (practical step)
- closing: brief encouraging thought or du'a`,
  },
];

export default function AssistantsRoute() {
  const [searchParams] = useSearchParams();
  const [selectedAssistantId, setSelectedAssistantId] = useState("reflection");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const queryHandledRef = useRef(false);
  const [initialized, setInitialized] = useState(false);

  const assistant = useMemo(() => ASSISTANTS.find((a) => a.id === selectedAssistantId) || ASSISTANTS[0], [selectedAssistantId]);

  const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      setMessages([
        {
          role: "assistant",
          assistantId: assistant.id,
          content: {
            empathy: `سلام. من ${assistant.name} هستم — ${assistant.shortDesc}. حال دل‌تان چطور است؟`,
          },
        },
      ]);
    } else if (searchParams.get("q") && !queryHandledRef.current) {
      queryHandledRef.current = true;
      send(searchParams.get("q").trim());
    }
  }, [initialized, assistant.id, searchParams]);

  const send = async (textToSend) => {
    const text = (typeof textToSend === "string" ? textToSend : input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.integrations.Core.InvokeLLM({
        prompt: `${assistant.framing}\n\nپیام کاربر:\n"""${text}"""\nپاسخ را به زبان فارسی و به صورت JSON معتبر بازگردانید.`,
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
                required: ["verse_key", "arabic", "translation", "why", "action"],
              },
            },
            closing: { type: "string" },
          },
          required: ["empathy", "verses", "closing"],
        },
      });

      setMessages((m) => [
        ...m,
        { role: "assistant", assistantId: assistant.id, content: res, structured: true },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          assistantId: assistant.id,
          content: {
            empathy: "متأسفانه در دریافت پاسخ مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
          },
        },
      ]);
    }
    setLoading(false);
  };

  const handleSwitchAssistant = (id) => {
    setSelectedAssistantId(id);
    setMessages([
      {
        role: "assistant",
        assistantId: id,
        content: {
          empathy: `سلام. من ${ASSISTANTS.find((a) => a.id === id)?.name} هستم. چگونه می‌توانم کمکتان کنم؟`,
        },
      },
    ]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        assistantId: selectedAssistantId,
        content: {
          empathy: `گفتگوی تازه با ${assistant.name} آغاز شد. حال دل‌تان را بگویید.`,
        },
      },
    ]);
  };

  return (
    <div
      className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)] animate-fade-in font-doran"
      dir="rtl"
    >
      {/* Header: Assistant Selection + Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 p-3.5 sm:p-4 rounded border border-border/80 bg-card/95 backdrop-blur-sm shadow-soft">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded p-1.5 border border-border/60 bg-secondary/40">
            {ASSISTANTS.map((a) => (
              <button
                key={a.id}
                onClick={() => handleSwitchAssistant(a.id)}
                className={cn(
                  "h-8 w-8 rounded flex items-center justify-center transition-all",
                  selectedAssistantId === a.id
                    ? `${a.color} shadow-md`
                    : "bg-background/50 text-muted-foreground hover:bg-muted/50 border-transparent"
                )}
                title={a.name}
              >
                <a.icon className={`h-4 w-4 fill-current`} />
              </button>
            ))}
          </div>
          <div>
            <h1 className="font-rokh-bold font-bold text-lg sm:text-xl text-foreground leading-tight">
              {assistant.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-doran">
              {assistant.shortDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleClearChat}
            variant="outline"
            size="icon-sm"
            className="px-2 font-ui"
            title="شروع گفتگوی جدید"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 py-2 rounded bg-secondary/20 border border-border/40 p-3 sm:p-4 mb-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            } animate-fade-in-up`}
          >
            {m.role === "assistant" ? (
              <Avatar
                className={cn(
                  "h-8 w-8 mt-1 shadow-xs",
                  m.assistantId
                    ? ASSISTANTS.find((a) => a.id === m.assistantId)?.avatarBg ||
                        "bg-accent/15"
                    : "bg-accent/15",
                  m.assistantId
                    ? ASSISTANTS.find((a) => a.id === m.assistantId)?.avatarColor ||
                        "text-accent"
                    : "text-accent"
                )}
              >
                <AvatarFallback>
                  <BookOpen className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground border border-primary/20 mt-1 font-bold text-xs font-ui">
                <AvatarFallback>شما</AvatarFallback>
              </Avatar>
            )}

            <Card
              className={cn(
                "max-w-[92%] sm:max-w-[85%] rounded p-4 sm:p-5 text-sm leading-relaxed transition-all shadow-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground font-medium rounded-tr-xs border-none"
                  : "bg-card border border-border/80 rounded-tl-xs text-foreground"
              )}
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
            </Card>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 animate-fade-in">
            <Avatar className="h-8 w-8 bg-accent/15 text-accent border border-accent/30">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Avatar>
            <Card className="rounded bg-card border border-border/70 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-xs border-none">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              <span>در حال پاسخ‌گویی...</span>
            </Card>
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
          placeholder={`سوال یا حال را برای ${assistant.name} بنویسید...`}
          disabled={loading}
          className="flex-1 py-3.5 pr-4 pl-12 rounded bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 font-doran text-xs sm:text-sm shadow-soft transition-all disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!input.trim() || loading}
          variant="accent"
          size="icon-sm"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-9 w-9 px-0 shadow-soft"
          aria-label="ارسال"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 rotate-180" />
          )}
        </Button>
      </form>
    </div>
  );
}

function AssistantStructuredResponse({ content, playTrack, currentTrack, isPlaying, togglePlay }) {
  const { empathy, verses = [], closing } = content || {};

  return (
    <div className="space-y-4">
      {empathy && (
        <Card className="rounded border border-accent/20 bg-accent/5 shadow-sm">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center gap-1.5 text-accent font-bold mb-1 font-rokh-bold">
              <Heart className="h-3.5 w-3.5 fill-current" />
              <span>همدلی:</span>
            </div>
            <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground/90 font-medium">
              {empathy}
            </p>
          </CardContent>
        </Card>
      )}

      {verses.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-rokh-bold">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>آیات:</span>
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

      {closing && (
        <div className="pt-2 border-t border-border/50 text-xs sm:text-[13px] text-muted-foreground/90 italic font-doran leading-relaxed">
          {closing}
        </div>
      )}
    </div>
  );
}

function CompanionVerseCard({ verse, playTrack, currentTrack, isPlaying, togglePlay }) {
  const { verse_key, arabic, translation, why, action } = verse || {};

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

  const isThisVersePlaying = isPlaying && currentTrack?.verseKey === verse_key;

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
    <Card
      variant="interactive"
      className="rounded border-primary/20 bg-gradient-to-b from-card via-primary/5 to-secondary/30 p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="inline-flex items-center gap-1.5 rounded bg-background/80 px-3 py-1 font-rokh-bold text-xs font-bold text-foreground border border-border/80">
          <BookOpen className="h-3 w-3 text-accent" />
          <span>
            {meta ? `سوره ${meta.surahName} • آیه ${fa(meta.ayah)}` : `آیه ${verse_key}`}
          </span>
        </div>

        {meta && (
          <Button
            onClick={handleAudio}
            variant={isThisVersePlaying ? "accent" : "outline"}
            size="icon-sm"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-ui transition-all shadow-xs",
              isThisVersePlaying
                ? "bg-amber-500 text-amber-950 ring-2 ring-amber-500/40 animate-pulse"
                : "bg-secondary text-primary hover:bg-accent/15 hover:text-accent border border-border/60"
            )}
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
          </Button>
        )}
      </div>

      {arabic && (
        <div
          className="my-3 text-lg sm:text-xl leading-[2.3] text-foreground text-center font-bold tracking-wide select-text"
          dir="rtl"
          lang="ar"
        >
          {arabic}
        </div>
      )}

      {translation && (
        <p className="font-doran text-xs sm:text-sm leading-relaxed text-muted-foreground text-center font-medium my-2">
          «{translation}»
        </p>
      )}

      {why && (
        <Card className="mt-3 rounded bg-card/70 border border-border/40 shadow-sm border-none">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-1 text-xs text-foreground/85 leading-relaxed font-doran">
              <span className="font-bold text-accent font-rokh-bold">نکته تدبّری:</span>
              <span>{why}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {action && (
        <div className="mt-2 flex items-start gap-2 rounded bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-doran font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="font-bold ml-1 font-rokh-bold">امروز انجام دهید:</span>
            <span>{action}</span>
          </div>
        </div>
      )}

      {meta && (
        <div className="mt-3 flex justify-end">
          <Link
            to={`/verse/${meta.surah}/${meta.ayah}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline font-ui"
          >
            <span>مطالعه در مصحف</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </Card>
  );
}
