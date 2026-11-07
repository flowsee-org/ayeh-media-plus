'use client';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Search,
  Lock,
  Globe,
  CheckCircle2,
  ChevronLeft,
  HeartHandshake,
  BookMarked,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

const INTENTION_SUGGESTIONS = [
  "تعجیل در فرج و سلامتی امام عصر (عج)",
  "شفای عاجل بیماران و التماس‌دعای همراهان",
  "شادی روح درگذشتگان و اموات",
  "گشایش امور و برآورده شدن حاجات",
  "ختم ماهانه انس با معارف قرآن",
];

export default function Khatm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'juz' | 'hezb' | 'my'
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    intention: INTENTION_SUGGESTIONS[0],
    customIntention: "",
    target_type: "juz", // 'juz' (30) or 'hezb' (60)
    is_private: false,
    deadline: "",
  });
  const [creating, setCreating] = useState(false);

  // Private Code Join State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joining, setJoining] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalCompletedParts: 0,
    totalSalawat: 0,
  });

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.entities.KhatmSession.list("-created_date", 50);
      const items = Array.isArray(res) ? res : res.items || [];
      setSessions(items);

      // Calculate global stats
      const totalSal = items.reduce((acc, curr) => acc + (curr.salawat_count || 0), 0);
      setStats({
        totalSessions: items.length,
        totalCompletedParts: items.length * 12, // display metric
        totalSalawat: totalSal,
      });
    } catch (err) {
      console.error("Error loading khatm sessions:", err);
      toast.error("خطا در بارگذاری دوره‌های ختم قرآن");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();

    // Subscribe to real-time session changes
    const unsub = api.entities.KhatmSession.subscribe(() => {
      loadSessions();
    });
    return () => unsub?.();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error("لطفاً عنوان دوره را وارد کنید");
      return;
    }

    try {
      setCreating(true);
      const partsCount = createForm.target_type === "hezb" ? 60 : 30;
      const finalIntention = createForm.customIntention.trim() || createForm.intention;
      const inviteCode = createForm.is_private
        ? Math.random().toString(36).substring(2, 8).toUpperCase()
        : null;

      const newSession = await api.entities.KhatmSession.create({
        title: createForm.title.trim(),
        description: createForm.description.trim() || null,
        intention: finalIntention,
        target_type: createForm.target_type,
        total_parts: partsCount,
        is_private: createForm.is_private,
        invite_code: inviteCode,
        creator_id: user?.id || "guest",
        creator_name: user?.full_name || "کاربر آیه پلاس",
        creator_avatar: user?.avatar_url || null,
        status: "active",
        salawat_count: 0,
        deadline: createForm.deadline || null,
      });

      // Bulk create initial parts (all available)
      const partsPayload = [];
      for (let i = 1; i <= partsCount; i++) {
        partsPayload.push({
          session_id: newSession.id,
          part_number: i,
          user_id: null,
          user_name: null,
          user_avatar: null,
          status: "available",
        });
      }
      await api.entities.KhatmPart.bulkCreate(partsPayload);

      toast.success("دوره ختم قرآن با موفقیت ایجاد شد 🎉");
      setShowCreateModal(false);
      navigate(`/khatm/${newSession.id}`);
    } catch (err) {
      console.error("Error creating khatm session:", err);
      toast.error("خطا در ایجاد دوره ختم");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error("لطفاً کد دعوت را وارد کنید");
      return;
    }

    try {
      setJoining(true);
      const res = await api.entities.KhatmSession.filter({ invite_code: code });
      const found = Array.isArray(res) ? res[0] : res?.items?.[0];
      if (found) {
        toast.success(`به دوره «${found.title}» خوش آمدید`);
        setShowJoinModal(false);
        navigate(`/khatm/${found.id}`);
      } else {
        toast.error("دوره‌ای با این کد دعوت یافت نشد");
      }
    } catch (err) {
      console.error("Error finding session by code:", err);
      toast.error("خطا در جستجوی کد دعوت");
    } finally {
      setJoining(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    // If private and not created by current user, don't show in public list
    if (s.is_private && s.creator_id !== user?.id) return false;

    if (filterType === "juz" && s.target_type !== "juz") return false;
    if (filterType === "hezb" && s.target_type !== "hezb") return false;
    if (filterType === "my" && s.creator_id !== user?.id) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchIntention = s.intention?.toLowerCase().includes(q);
      const matchDesc = s.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchIntention && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-20 pt-4" dir="rtl">
      {/* Hero Banner with Authentic Persian Carpet & Stained Glass Backdrop */}
      <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-8 mb-8 border border-amber-400/30 bg-card p-6 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/art/nasir_carpet_window.jpg"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.25] dark:brightness-[0.16] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/95 backdrop-blur-[1px]" />
        </div>
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>محفل تلاوت و ختم‌های دسته‌جمعی آیه پلاس</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-kalameh tracking-tight text-foreground">
              ختم قرآن دسته‌جمعی و گروه‌های تلاوت
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              در ثواب تلاوت کلام‌الله مجید سهیم شوید. جزء یا حزب مورد نظر خود را انتخاب کرده، با دیگر همراهان به تلاوت بپردازید و نیت‌های معنوی خود را در دیوار دعا ثبت کنید.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-foreground font-semibold shadow-md hover:bg-accent/90 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد دوره جدید</span>
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border/70 hover:border-accent/40 font-medium text-foreground transition-all active:scale-95 shadow-sm"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span>ورود با کد دعوت</span>
            </button>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="mt-8 pt-6 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{stats.totalSessions.toLocaleString("fa-IR")}</div>
              <div className="text-xs text-muted-foreground">دوره‌های فعال و تکمیل‌شده</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">۳۰ جزء و ۶۰ حزب</div>
              <div className="text-xs text-muted-foreground">امکان تقسیم منعطف</div>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{stats.totalSalawat.toLocaleString("fa-IR")}</div>
              <div className="text-xs text-muted-foreground">صلوات ثبت شده همراهان</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="mx-4 sm:mx-8 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-card/60 backdrop-blur border border-border/50 rounded-2xl overflow-x-auto">
          {[
            { id: "all", label: "همه دوره‌ها" },
            { id: "juz", label: "۳۰ جزء" },
            { id: "hezb", label: "۶۰ حزب" },
            { id: "my", label: "دوره‌های من" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نیت، عنوان یا هدف..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Session Cards Grid */}
      <div className="mx-4 sm:mx-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-card/50 border border-border/40 animate-pulse p-6 space-y-4" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border/70 bg-card/30">
            <BookMarked className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">دوره‌ای یافت نشد</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              هیچ دوره ختمی با این مشخصات ثبت نشده است. می‌توانید خودتان اولین دوره را ایجاد کنید!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold shadow-sm hover:bg-accent/90"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد دوره جدید</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <KhatmCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Create New Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">ایجاد دوره جدید ختم قرآن</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-accent/10 flex items-center justify-center text-muted-foreground hover:text-foreground text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-foreground mb-1">عنوان دوره *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="مثال: ختم نورانی به نیت شفای بیماران"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">نیت ختم</label>
                <select
                  value={createForm.intention}
                  onChange={(e) => setCreateForm({ ...createForm, intention: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent mb-2"
                >
                  {INTENTION_SUGGESTIONS.map((int) => (
                    <option key={int} value={int}>{int}</option>
                  ))}
                  <option value="سایر">سایر (تایپ نیت دلخواه)...</option>
                </select>
                {createForm.intention === "سایر" && (
                  <input
                    type="text"
                    value={createForm.customIntention}
                    onChange={(e) => setCreateForm({ ...createForm, customIntention: e.target.value })}
                    placeholder="نیت معنوی اختصاصی خود را بنویسید..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                )}
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">مدل تقسیم سهم‌ها</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, target_type: "juz" })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      createForm.target_type === "juz"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-border/60 hover:border-border text-muted-foreground"
                    }`}
                  >
                    <div className="font-bold">۳۰ جزء</div>
                    <div className="text-xs opacity-75 mt-0.5">سهم‌های کامل و استاندارد</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, target_type: "hezb" })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      createForm.target_type === "hezb"
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-border/60 hover:border-border text-muted-foreground"
                    }`}
                  >
                    <div className="font-bold">۶۰ حزب</div>
                    <div className="text-xs opacity-75 mt-0.5">سهم‌های کوتاه‌تر و سریع‌تر</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">توضیحات اختیاری</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="پیام یا توضیحاتی برای شرکت‌کنندگان در این ختم..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50">
                <div>
                  <div className="font-semibold text-foreground">دوره خصوصی (Private)</div>
                  <div className="text-xs text-muted-foreground">صرفاً با کد دعوت یا لینک مستقیم قابل دسترسی باشد</div>
                </div>
                <input
                  type="checkbox"
                  checked={createForm.is_private}
                  onChange={(e) => setCreateForm({ ...createForm, is_private: e.target.checked })}
                  className="w-5 h-5 accent-accent rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-accent/10 text-muted-foreground font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold shadow-md hover:bg-accent/90 disabled:opacity-50"
                >
                  {creating ? "در حال ایجاد..." : "تایید و شروع ختم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join with Invite Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">ورود به دوره با کد دعوت</h2>
              </div>
              <button
                onClick={() => setShowJoinModal(false)}
                className="w-8 h-8 rounded-full hover:bg-accent/10 flex items-center justify-center text-muted-foreground hover:text-foreground text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                اگر توسط یکی از دوستان، اعضای خانواده یا مدیر مسجد کد ۶ رقمی دعوت دریافت کرده‌اید، آن را در کادر زیر وارد کنید:
              </p>
              <div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="مثال: A7B9F2"
                  className="w-full text-center tracking-widest text-lg font-mono uppercase px-4 py-3 rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2.5 rounded-xl hover:bg-accent/10 text-muted-foreground font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold shadow-md hover:bg-accent/90 disabled:opacity-50"
                >
                  {joining ? "در حال بررسی..." : "ورود به محفل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Single Khatm Session Card
function KhatmCard({ session }) {
  const [completedCount, setCompletedCount] = useState(0);
  const [reservedCount, setReservedCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const parts = await api.entities.KhatmPart.filter({ session_id: session.id });
        const items = Array.isArray(parts) ? parts : parts.items || [];
        if (isMounted) {
          const comp = items.filter((p) => p.status === "completed").length;
          const resv = items.filter((p) => p.status === "reserved").length;
          setCompletedCount(comp);
          setReservedCount(resv);
        }
      } catch {
        // Fallback gracefully
      }
    }
    fetchStats();
    return () => { isMounted = false; };
  }, [session.id]);

  const totalParts = session.total_parts || 30;
  const progressPercent = Math.round((completedCount / totalParts) * 100);

  return (
    <Link
      to={`/khatm/${session.id}`}
      className="group flex flex-col justify-between rounded-3xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-xl hover:border-accent/40 transition-all duration-300 relative overflow-hidden"
    >
      {/* Decorative top accent glow */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-accent via-amber-400 to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            <Sparkles className="w-3 h-3" />
            <span>{session.target_type === "hezb" ? "۶۰ حزب" : "۳۰ جزء"}</span>
          </span>

          <div className="flex items-center gap-2">
            {session.is_private ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3" />
                <span>خصوصی</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <Globe className="w-3 h-3" />
                <span>عمومی</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold font-kalameh text-foreground group-hover:text-accent transition-colors line-clamp-1 mb-1.5">
          {session.title}
        </h3>

        {/* Intention */}
        {session.intention && (
          <p className="text-xs text-amber-700 dark:text-amber-400/90 font-medium line-clamp-1 mb-2">
            ✨ نیت: {session.intention}
          </p>
        )}

        {/* Description */}
        {session.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {session.description}
          </p>
        )}
      </div>

      {/* Progress & Bottom Bar */}
      <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-foreground">
              {completedCount.toLocaleString("fa-IR")} از {totalParts.toLocaleString("fa-IR")} سهم تکمیل شده
            </span>
            <span className="text-accent font-bold">{progressPercent.toLocaleString("fa-IR")}٪</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${Math.round((reservedCount / totalParts) * 100)}%` }}
            />
          </div>
        </div>

        {/* Action & Stats Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {session.salawat_count > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{session.salawat_count.toLocaleString("fa-IR")} صلوات</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:-translate-x-1 transition-transform">
            <span>مشاهده و انتخاب سهم</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
