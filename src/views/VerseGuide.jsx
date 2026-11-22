'use client';
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getAyah } from "@/lib/quranApi";
import ProblemForm from "@/components/guide/ProblemForm";
import GuideVerseCard from "@/components/guide/GuideVerseCard";
import BackButton from "@/components/BackButton";
import { PersianToranjDivider } from "@/components/PersianIslamicArt";
import { AlertCircle, Compass, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PROMPT = (problem) => `You are a compassionate Quranic guidance assistant for a Persian-language app.
A person describes a real life difficulty. Your job: find the Quranic verses that speak directly to THIS difficulty.

Person's difficulty:
"""${problem}"""

Return PERSIAN (Farsi) text. Rules:
- Give exactly 3 verse references, each in "surah:ayah" numeric form (e.g. 94:5). Only real, existing verses — never invent a reference.
- Choose verses that address the actual emotion and situation (grief, debt, fear, separation, illness, loneliness, injustice, hope).
- For each verse write:
  • why: 2–3 sentences in warm plain Persian explaining why this verse answers this person's situation.
  • action: one concrete, practical step they can take today.
  • visual: one concrete idea for a short video or image expressing this verse (scene, mood, text on screen).
- understanding: one warm sentence naming what the person is going through, without judgment.
- caption: a short Instagram-style caption in Persian (max 2 lines) that could accompany posting this verse.
- Never claim your reading is the only correct interpretation.`;

export default function VerseGuide() {
  const [user, setUser] = useState(null);
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState(null);
  const [verses, setVerses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const search = async (text) => {
    setProblem(text);
    setLoading(true);
    setError(null);
    setResult(null);
    setVerses({});
    try {
      const res = await api.integrations.Core.InvokeLLM({
        prompt: PROMPT(text),
        response_json_schema: {
          type: "object",
          properties: {
            understanding: { type: "string" },
            caption: { type: "string" },
            verses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  verse_key: { type: "string" },
                  why: { type: "string" },
                  action: { type: "string" },
                  visual: { type: "string" },
                },
                required: ["verse_key", "why"],
              },
            },
          },
          required: ["verses"],
        },
      });
      setResult(res);
      setLoading(false);

      (res?.verses || []).forEach(async (m) => {
        const [s, a] = String(m.verse_key || "").split(":");
        if (!s || !a) return;
        try {
          const ayah = await getAyah(Number(s), Number(a));
          setVerses((prev) => ({ ...prev, [m.verse_key]: ayah }));
        } catch {}
      });
    } catch {
      setError("جست‌وجو ناموفق بود. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <div className="page-shell-reading animate-fade-in">
      <BackButton label="بازگشت به خانه" to="/" className="mb-6" />

      {/* Clean UI Kit Header */}
      <Card className="rounded border border-border bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary border border-border text-foreground font-ui text-xs font-semibold mb-3">
          <Compass className="h-3.5 w-3.5 text-primary" /> راهنمای تدبّر و تسکین قلوب
        </div>
        <CardTitle className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
          آیه‌ی راه
        </CardTitle>
        <CardDescription className="font-editorial text-muted-foreground text-sm max-w-lg mx-auto">
          کلام وحی برای تسکین اندوه‌ها، رفع تردیدها و یافتن هدایت در گذرگاه‌های سخت زندگی
        </CardDescription>
      </Card>

      <div className="mb-8">
        <ProblemForm onSubmit={search} loading={loading} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      {loading && (
        <div className="my-8 space-y-4">
          <div className="text-center text-xs text-muted-foreground animate-pulse mb-2">
            در حال جست‌وجو در گنجینه کلام الهی و تطبیق احوال با آیات آرامش‌بخش…
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded border border-accent/15 bg-card/50" />
          ))}
        </div>
      )}

      {result && !loading && (
        <div className="mt-8 space-y-6">
          {problem && (
            <div className="text-center font-ui text-xs text-muted-foreground">
              دغدغه بررسی‌شده: <span className="font-bold text-foreground">«{problem}»</span>
            </div>
          )}
          <PersianToranjDivider label="آیات برگزیده برای شما" />

          {result.understanding && (
            <Card className="rounded border border-accent/25 bg-accent/[0.06] shadow-soft">
              <CardContent className="p-5 text-sm sm:text-base leading-[2.2] text-foreground/90">
                <div className="flex items-center gap-2 text-accent font-bold text-xs mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>نگاه همدلانه قرآن به احوال شما:</span>
                </div>
                <p>{result.understanding}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {(result.verses || []).map((m, i) => (
              <GuideVerseCard
                key={`${m.verse_key}-${i}`}
                match={m}
                user={user}
                verse={verses[m.verse_key]}
              />
            ))}
          </div>

          {result.caption && (
            <Card className="rounded border border-dashed border-accent/30 bg-card/50 shadow-soft">
              <CardContent className="p-5">
                <div className="mb-2 text-xs font-bold text-accent flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>متن پیشنهادی برای بازنشر و یادآوری قلبی:</span>
                </div>
                <p className="text-sm leading-[2] text-muted-foreground">{result.caption}</p>
              </CardContent>
            </Card>
          )}

          <Card className="flex items-start gap-2.5 rounded border border-accent/20 bg-card/60 p-4 text-xs leading-[2] text-muted-foreground shadow-soft">
            <CardContent className="p-0 pt-1">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                این راهنمایی‌ها جنبه تدبّر و تسکین قلبی دارد. برای تصمیمات فقهی، حقوقی یا درمانی از مشاوران متخصص و علمای دین راهنمایی بجویید.
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
