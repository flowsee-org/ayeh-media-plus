import { useState, useEffect } from "react";
import { Link } from "@/lib/router-compat";
import {
  BookOpen,
  Brain,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Volume2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function DailyQuestsCard({ onProgressUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [dailyContent, setDailyContent] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [submittingSocial, setSubmittingSocial] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElem, setAudioElem] = useState(null);

  const fetchStatusAndContent = async () => {
    try {
      setLoading(true);
      const [st, dc] = await Promise.all([
        api.gamification.getStatus(),
        api.gamification.getDailyContent(),
      ]);
      setStatus(st);
      setDailyContent(dc);
    } catch (err) {
      console.error("Error fetching quests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndContent();
  }, [user]);

  const handlePlayVerseAudio = () => {
    if (!dailyContent?.featured_verse?.audio_url) return;

    if (audioPlaying && audioElem) {
      audioElem.pause();
      setAudioPlaying(false);
      return;
    }

    const audio = new Audio(dailyContent.featured_verse.audio_url);
    audio.play();
    setAudioPlaying(true);
    setAudioElem(audio);

    // Track activity after 5 seconds of listening
    setTimeout(async () => {
      try {
        if (user) {
          const res = await api.gamification.trackActivity({
            type: "audio",
            duration_seconds: 15,
            verse_key: dailyContent.featured_verse.verse_key,
          });
          if (res?.earned_xp) {
            toast.success(`+${res.earned_xp} XP معنوی برای استماع کلام وحی!`);
            fetchStatusAndContent();
            if (onProgressUpdate) onProgressUpdate(res);
          }
        }
      } catch {}
    }, 4000);

    audio.onended = () => {
      setAudioPlaying(false);
    };
  };

  const handleQuizSubmit = async () => {
    if (selectedOption === null || submittingQuiz) return;
    if (!user) {
      toast.error("برای ثبت پاسخ کوییز و دریافت امتیاز، لطفاً وارد حساب شوید.");
      return;
    }

    try {
      setSubmittingQuiz(true);
      const res = await api.gamification.completeQuest({
        quest_type: "quiz",
        answer_index: selectedOption,
      });

      if (res.correct) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
        toast.success(`احسنت! تدبر شما صحیح بود (+${res.xp_awarded} XP)`);
        setQuizResult({
          correct: true,
          explanation: res.explanation,
        });
        fetchStatusAndContent();
        if (onProgressUpdate) onProgressUpdate(res);
      }
    } catch (err) {
      const msg = err.data?.message || "پاسخ صحیح نبود، دوباره تأمل فرمایید.";
      toast.error(msg);
      setQuizResult({
        correct: false,
        explanation: err.data?.explanation,
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleQuickSalawat = async () => {
    if (!user) {
      toast.error("برای ثبت صلوات و دریافت امتیاز، لطفاً وارد حساب کاربری شوید.");
      return;
    }
    try {
      setSubmittingSocial(true);
      const res = await api.gamification.completeQuest({
        quest_type: "social",
        action_detail: "صلوات نذر ختم قرآن",
      });

      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 },
      });
      toast.success(`اللهم صل علی محمد و آل محمد (+${res.xp_awarded} XP)`);
      fetchStatusAndContent();
      if (onProgressUpdate) onProgressUpdate(res);
    } catch (err) {
      toast.error("خطا در ثبت نذر صلوات");
    } finally {
      setSubmittingSocial(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-border animate-pulse flex flex-col gap-4">
        <div className="h-6 w-48 bg-muted rounded-lg"></div>
        <div className="h-20 bg-muted rounded-2xl"></div>
        <div className="h-20 bg-muted rounded-2xl"></div>
      </div>
    );
  }

  const quests = status?.today_quests || [];
  const completedCount = status?.completed_quests_count || 0;
  const progressPercent = Math.round((completedCount / 3) * 100);

  return (
    <div className="rounded-3xl bg-card/90 border border-emerald-900/30 p-5 sm:p-7 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background Islamic Ambient glow */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header with progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <h3 className="text-lg font-bold font-rokh-bold text-foreground">
              مأموریت‌های سه‌گانه روز
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            با تکمیل ۳ مأموریت روزانه، شعله استریک خود را روشن نگه داشته و امتیاز تجربه (XP) کسب کنید.
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-3 bg-muted/60 px-4 py-2 rounded-2xl border border-border shrink-0">
          <div className="text-right">
            <div className="text-xs font-bold font-rokh-bold text-foreground">
              {completedCount} از ۳ تکمیل شده
            </div>
            <div className="text-[10px] text-muted-foreground">
              {progressPercent === 100 ? "استریک امروز تثبیت شد 🎉" : "در حال پیشرفت"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-950/20 border-2 border-emerald-600/40 flex items-center justify-center font-bold text-xs text-primary font-mono">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div className="grid grid-cols-1 gap-4 mt-5">
        {/* Quest 1: Reading / Listening */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            quests[0]?.is_completed
              ? "bg-emerald-500/5 border-emerald-500/30"
              : "bg-muted/30 border-border/70 hover:border-emerald-600/40"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  quests[0]?.is_completed
                    ? "bg-emerald-600 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {quests[0]?.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <BookOpen className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-rokh-bold text-foreground">
                    {quests[0]?.title || "تلاوت و استماع آیه روز"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-mono font-bold">
                    +50 XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {quests[0]?.description}
                </p>

                {/* Today's Featured Verse snippet */}
                {dailyContent?.featured_verse && (
                  <div className="mt-3 p-3 rounded-xl bg-card border border-emerald-900/20 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5 font-mono">
                      <span>آیه منتخب امروز: {dailyContent.featured_verse.verse_key}</span>
                      <button
                        onClick={handlePlayVerseAudio}
                        className="flex items-center gap-1 text-primary hover:underline font-rokh-bold font-bold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {audioPlaying ? "توقف تلاوت" : "پخش صوت"}
                      </button>
                    </div>
                    <p className="font-arabic text-sm text-foreground/90 leading-relaxed text-right line-clamp-2">
                      {dailyContent.featured_verse.arabic}
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-1 line-clamp-1">
                      {dailyContent.featured_verse.translation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 self-center">
              {quests[0]?.is_completed ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-rokh-bold font-bold">
                  انجام شد
                </span>
              ) : (
                <Link
                  to="/quran"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-rokh-bold font-bold transition-transform active:scale-95"
                >
                  ورود به قرآن
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quest 2: Interactive Conceptual Quiz */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            quests[1]?.is_completed
              ? "bg-emerald-500/5 border-emerald-500/30"
              : "bg-muted/30 border-border/70 hover:border-emerald-600/40"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 w-full">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  quests[1]?.is_completed
                    ? "bg-emerald-600 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {quests[1]?.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Brain className="w-5 h-5" />
                )}
              </div>
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-rokh-bold text-foreground">
                    {quests[1]?.title || "تدبر مفهومی و کوییز آیه روز"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-mono font-bold">
                    +40 XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {quests[1]?.description}
                </p>

                {/* The Quiz Box */}
                {dailyContent?.quiz && (
                  <div className="mt-3 p-3.5 rounded-xl bg-card border border-primary/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold font-rokh-bold text-primary mb-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      موضوع: {dailyContent.quiz.theme}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-relaxed mb-3">
                      {dailyContent.quiz.question}
                    </p>

                    {/* Quiz Options */}
                    {!quests[1]?.is_completed ? (
                      <div className="space-y-2">
                        {dailyContent.quiz.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            className={`w-full text-right p-2.5 rounded-xl text-xs transition-all border flex items-center justify-between ${
                              selectedOption === idx
                                ? "bg-primary/15 border-primary text-foreground font-bold shadow-sm"
                                : "bg-muted/40 border-border hover:bg-muted/80 text-foreground/80"
                            }`}
                          >
                            <span>{opt}</span>
                            <span className="w-4 h-4 rounded-full border border-primary/40 flex items-center justify-center text-[10px] font-mono shrink-0">
                              {idx + 1}
                            </span>
                          </button>
                        ))}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={handleQuizSubmit}
                            disabled={selectedOption === null || submittingQuiz}
                            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold font-rokh-bold disabled:opacity-50 transition-all flex items-center gap-1.5"
                          >
                            {submittingQuiz ? "در حال ثبت..." : "ثبت پاسخ و تدبر"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
                        <div className="font-bold flex items-center gap-1.5 mb-1 font-rokh-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          پاسخ شما با موفقیت ثبت شد
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {quizResult?.explanation || dailyContent.quiz.explanation || "با تشکر از تدبر شما در کلام وحی."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quest 3: Social & Khatm Contribution */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 ${
            quests[2]?.is_completed
              ? "bg-emerald-500/5 border-emerald-500/30"
              : "bg-muted/30 border-border/70 hover:border-emerald-600/40"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  quests[2]?.is_completed
                    ? "bg-emerald-600 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {quests[2]?.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <HeartHandshake className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-rokh-bold text-foreground">
                    {quests[2]?.title || "مشارکت معنوی در ختم یا جامعه"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-mono font-bold">
                    +30 XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {quests[2]?.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-center">
              {quests[2]?.is_completed ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-rokh-bold font-bold">
                  انجام شد
                </span>
              ) : (
                <button
                  onClick={handleQuickSalawat}
                  disabled={submittingSocial}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-rokh-bold font-bold transition-transform active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {submittingSocial ? "در حال ثبت..." : "نذر صلوات روز"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
