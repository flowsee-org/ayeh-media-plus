'use client';
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import {
  ChevronRight,
  Sparkles,
  Share2,
  CheckCircle2,
  Clock,
  BookOpen,
  Heart,
  Send,
  Lock,
  Globe,
  RefreshCw,
  Check,
  Copy,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { JUZ_DATA } from "@/lib/juzData";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

export default function KhatmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [session, setSession] = useState(null);
  const [parts, setParts] = useState([]);
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dua input
  const [newDuaText, setNewDuaText] = useState("");
  const [submittingDua, setSubmittingDua] = useState(false);

  // Salawat counter state & animation
  const [salawatCount, setSalawatCount] = useState(0);
  const [salawatAnimating, setSalawatAnimating] = useState(false);

  // Socket reference
  const socketRef = useRef(null);

  // Load Session Data
  const loadData = async () => {
    try {
      setLoading(true);
      const sessionData = await api.entities.KhatmSession.get(id);
      if (!sessionData) {
        toast.error("دوره ختم مورد نظر یافت نشد");
        navigate("/khatm");
        return;
      }
      setSession(sessionData);
      setSalawatCount(sessionData.salawat_count || 0);

      // Load parts
      const partsRes = await api.entities.KhatmPart.filter(
        { session_id: id },
        "part_number",
        100
      );
      const partsList = Array.isArray(partsRes) ? partsRes : partsRes.items || [];
      // Sort parts numerically
      partsList.sort((a, b) => a.part_number - b.part_number);
      setParts(partsList);

      // Load Duas
      const duasRes = await api.entities.KhatmDua.filter(
        { session_id: id },
        "-created_date",
        50
      );
      setDuas(Array.isArray(duasRes) ? duasRes : duasRes.items || []);
    } catch (err) {
      console.error("Error loading khatm details:", err);
      toast.error("خطا در دریافت اطلاعات دوره ختم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Socket.io real-time connection (uses authenticated global socket from api)
    const socket = api.socket.get();
    if (socket) {
      socketRef.current = socket;

      socket.emit("khatm:join", { sessionId: id });

      socket.on("khatm:salawat_updated", (data) => {
        if (data.sessionId === id) {
          setSalawatCount(data.salawat_count);
        }
      });
    }

    // Entity change subscriptions
    const unsubPart = api.entities.KhatmPart.subscribe((event) => {
      if (event.data?.session_id === id || event.data?.[0]?.session_id === id) {
        loadData();
      }
    });

    const unsubDua = api.entities.KhatmDua.subscribe((event) => {
      if (event.data?.session_id === id) {
        loadData();
      }
    });

    return () => {
      if (socket) {
        socket.emit("khatm:leave", { sessionId: id });
        socket.off("khatm:salawat_updated");
      }
      unsubPart?.();
      unsubDua?.();
    };
  }, [id]);

  // Handle Salawat Tap
  const handleSendSalawat = () => {
    setSalawatAnimating(true);
    setTimeout(() => setSalawatAnimating(false), 300);

    // Optimistic UI update
    setSalawatCount((prev) => prev + 1);

    // Emit via socket
    if (socketRef.current) {
      socketRef.current.emit("khatm:salawat", { sessionId: id, amount: 1 });
    }
  };

  // Reserve Part (atomic /api/khatm — entity updates are blocked)
  const doReservePart = async (part, targetUser) => {
    if (!targetUser) return;
    try {
      const updated = await api.khatm.reservePart(part.id);

      setParts((prev) =>
        prev.map((p) => (p.id === part.id ? { ...p, ...updated } : p))
      );
      toast.success(`${session.target_type === "hezb" ? "حزب" : "جزء"} ${part.part_number} با موفقیت برای شما رزرو شد 📖`);
    } catch (err) {
      console.error("Error reserving part:", err);
      toast.error(err?.message || "خطا در رزرو سهم");
    }
  };

  const handleReservePart = async (part) => {
    if (!user) {
      openAuthModal((loggedInUser) => {
        doReservePart(part, loggedInUser);
      });
      return;
    }
    doReservePart(part, user);
  };

  // Cancel Reservation
  const handleCancelReservation = async (part) => {
    try {
      const updated = await api.khatm.releasePart(part.id);

      setParts((prev) =>
        prev.map((p) => (p.id === part.id ? { ...p, ...updated } : p))
      );
      toast("سهم آزاد شد و به لیست بازگشت", { icon: "ℹ️" });
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      toast.error(err?.message || "خطا در لغو رزرو");
    }
  };

  // Mark Part Completed
  const handleCompletePart = async (part) => {
    try {
      const updated = await api.khatm.completePart(part.id);

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#f59e0b", "#3b82f6", "#ec4899"],
      });

      setParts((prev) =>
        prev.map((p) => (p.id === part.id ? { ...p, ...updated } : p))
      );
      toast.success(`قبول حق! تلاوت ${session.target_type === "hezb" ? "حزب" : "جزء"} ${part.part_number} به عنوان خوانده‌شده ثبت شد ✨`);
    } catch (err) {
      console.error("Error completing part:", err);
      toast.error(err?.message || "خطا در ثبت اتمام سهم");
    }
  };

  // Submit Dua
  const handleSubmitDua = async (e) => {
    e.preventDefault();
    if (!newDuaText.trim()) return;

    try {
      setSubmittingDua(true);
      const newDua = await api.entities.KhatmDua.create({
        session_id: id,
        user_id: user?.id || "guest",
        user_name: user?.full_name || "همراه قرآنی",
        user_avatar: user?.avatar_url || null,
        message: newDuaText.trim(),
      });

      setDuas((prev) => [newDua, ...prev]);
      setNewDuaText("");
      toast.success("دعای شما بر روی دیوار ثبت شد 🤲");
    } catch (err) {
      console.error("Error submitting dua:", err);
      toast.error("خطا در ثبت دعا");
    } finally {
      setSubmittingDua(false);
    }
  };

  // Copy Share Link
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    toast.success("لینک دعوت به این ختم کپی شد 📋");
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">در حال فراخوانی محفل ختم قرآن...</p>
        </div>
      </div>
    );
  }

  const totalParts = session.total_parts || 30;
  const completedParts = parts.filter((p) => p.status === "completed").length;
  const reservedParts = parts.filter((p) => p.status === "reserved").length;
  const availableParts = totalParts - completedParts - reservedParts;
  const progressPercent = Math.round((completedParts / totalParts) * 100);

  return (
    <div className="min-h-screen bg-background pb-24 pt-4" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/khatm"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span>بازگشت به دوره‌های ختم</span>
          </Link>

          <div className="flex items-center gap-2">
            {session.is_private && session.invite_code && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(session.invite_code);
                  toast.success(`کد دعوت (${session.invite_code}) کپی شد`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 text-xs font-mono font-medium hover:border-accent text-foreground transition-all shadow-sm"
              >
                <Copy className="w-3.5 h-3.5 text-accent" />
                <span>کد: {session.invite_code}</span>
              </button>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold border border-accent/20 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>اشتراک‌گذاری</span>
            </button>
          </div>
        </div>

        {/* Hero Session Card with authentic Persian carpet & sunlight atmosphere */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-card p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/images/art/nasir_carpet_window.jpg"
              alt=""
              className="w-full h-full object-cover filter brightness-[0.25] dark:brightness-[0.16] contrast-[1.1] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/95 backdrop-blur-[1px]" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                  <Sparkles className="w-3 h-3" />
                  <span>{session.target_type === "hezb" ? "۶۰ حزب قرآن" : "۳۰ جزء کامل"}</span>
                </span>
                {session.is_private ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>حلقه خصوصی</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <Globe className="w-3 h-3" />
                    <span>ختم عمومی</span>
                  </span>
                )}
                {progressPercent === 100 && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>ختم کامل شد 🎉</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-rokh-bold text-foreground">
                {session.title}
              </h1>

              {session.intention && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span>نیت ختم: {session.intention}</span>
                </div>
              )}

              {session.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {session.description}
                </p>
              )}
            </div>

            {/* Live Salawat Counter Interactive Widget */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-background/80 border border-border/70 backdrop-blur-md shadow-inner text-center shrink-0 min-w-[220px]">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                صلوات‌شمار زنده محفل
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-accent my-1">
                {salawatCount.toLocaleString("fa-IR")}
              </div>
              <button
                onClick={handleSendSalawat}
                className={`mt-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-amber-500 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all active:scale-90 flex items-center gap-2 ${
                  salawatAnimating ? "scale-105" : ""
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>ذکر صلوات (+۱)</span>
              </button>
            </div>
          </div>

          {/* Progress Indicators Bar */}
          <div className="mt-8 pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">
                  پیشرفت کل ختم ({completedParts.toLocaleString("fa-IR")} از {totalParts.toLocaleString("fa-IR")} سهم)
                </span>
                <span className="text-accent font-bold">{progressPercent.toLocaleString("fa-IR")}٪</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted/60 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-700"
                  style={{ width: `${Math.round((reservedParts / totalParts) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:col-span-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{completedParts.toLocaleString("fa-IR")}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">قرائت شده</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="font-bold text-amber-600 dark:text-amber-400">{reservedParts.toLocaleString("fa-IR")}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">در حال تلاوت</div>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <div className="font-bold text-foreground">{availableParts.toLocaleString("fa-IR")}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">آزاد برای رزرو</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of Parts (30 Juz or 60 Hezb) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold font-rokh-bold text-foreground">
                سهم‌های تلاوت ({session.target_type === "hezb" ? "۶۰ حزب" : "۳۰ جزء"})
              </h2>
            </div>
            <div className="text-xs text-muted-foreground">
              روی هر سهم کلیک کرده و تلاوت خود را آغاز کنید
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parts.map((part) => {
              const isJuz = session.target_type !== "hezb";
              const juzInfo = isJuz ? JUZ_DATA[part.part_number - 1] : null;
              const isMine = user && part.user_id === user.id;

              return (
                <div
                  key={part.id}
                  className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    part.status === "completed"
                      ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20"
                      : part.status === "reserved"
                      ? isMine
                        ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                        : "bg-card border-border/60"
                      : "bg-card border-border/40 hover:border-accent/40 hover:shadow-md"
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-accent/10 text-accent">
                        {isJuz ? `جزء ${part.part_number}` : `حزب ${part.part_number}`}
                      </span>

                      {/* Status indicator badge */}
                      {part.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قرائت شد</span>
                        </span>
                      ) : part.status === "reserved" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>در حال تلاوت</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          آزاد جهت رزرو
                        </span>
                      )}
                    </div>

                    {/* Juz Name & Range if 30 Juz */}
                    {juzInfo && (
                      <div className="mb-3">
                        <div className="text-sm font-bold text-foreground font-arabic">
                          {juzInfo.arabicName}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {juzInfo.verseRange}
                        </div>
                      </div>
                    )}

                    {/* Reader info if claimed */}
                    {part.status !== "available" && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3 bg-background/50 p-1.5 rounded-lg border border-border/40">
                        <div className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">
                          {part.user_name?.slice(0, 1) || "ک"}
                        </div>
                        <span className="truncate">
                          {part.user_name || "کاربر آیه پلاس"}
                          {isMine && " (شما)"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-border/40 flex items-center gap-2">
                    {part.status === "available" ? (
                      <button
                        onClick={() => handleReservePart(part)}
                        className="w-full py-2 rounded-xl bg-accent text-accent-foreground font-semibold text-xs shadow-sm hover:bg-accent/90 transition-all active:scale-95 flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>رزرو این سهم</span>
                      </button>
                    ) : part.status === "reserved" && isMine ? (
                      <div className="w-full flex items-center gap-1.5">
                        <Link
                          to={`/quran?juz=${part.part_number}&khatm_part_id=${part.id}`}
                          className="flex-1 py-2 rounded-xl bg-accent text-accent-foreground font-semibold text-xs text-center hover:bg-accent/90 transition-all flex items-center justify-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>شروع تلاوت</span>
                        </Link>
                        <button
                          onClick={() => handleCompletePart(part)}
                          title="علامت‌گذاری به عنوان خوانده شده"
                          className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all text-xs font-semibold"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelReservation(part)}
                          title="انصراف از سهم"
                          className="p-2 rounded-xl bg-card border border-border/70 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : part.status === "reserved" ? (
                      <div className="w-full py-1.5 text-center text-xs text-muted-foreground font-medium">
                        در انتظار اتمام تلاوت
                      </div>
                    ) : (
                      <div className="w-full py-1.5 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تقبل‌الله</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dua & Prayer Wall (دیوار ادعیه و نیات) */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold font-rokh-bold text-foreground">
                دیوار دعای خیر و نیات همراهان
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {duas.length.toLocaleString("fa-IR")} دعا و التماس‌دعا ثبت شده
            </span>
          </div>

          {/* New Dua Input Form */}
          <form onSubmit={handleSubmitDua} className="flex gap-2">
            <input
              type="text"
              value={newDuaText}
              onChange={(e) => setNewDuaText(e.target.value)}
              placeholder="دعای خیر یا نیت قلبی خود را برای شرکت‌کنندگان بنویسید..."
              className="flex-1 px-4 py-3 rounded-2xl bg-background border border-border/70 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <button
              type="submit"
              disabled={submittingDua || !newDuaText.trim()}
              className="px-5 py-3 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm shadow-sm hover:bg-accent/90 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>ثبت دعا</span>
            </button>
          </form>

          {/* List of Duas */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {duas.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                هنوز دعایی ثبت نشده است. اولین دعای خیر این محفل را شما بنویسید 🤲
              </div>
            ) : (
              duas.map((dua) => (
                <div
                  key={dua.id}
                  className="p-4 rounded-2xl bg-background/60 border border-border/40 text-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                      <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px]">
                        {dua.user_name?.slice(0, 1) || "ک"}
                      </div>
                      <span>{dua.user_name || "همراه قرآنی"}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(dua.created_date).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  <p className="text-foreground/90 text-xs sm:text-sm leading-relaxed pr-7">
                    {dua.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
