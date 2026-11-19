'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INTENTION_SUGGESTIONS = [
  "تعجیل در فرج و سلامتی امام عصر (عج)",
  "شفای عاجل بیماران و التماس‌دعای همراهان",
  "شادی روح درگذشتگان و اموات",
  "گشایش امور و برآورده شدن حاجات",
  "ختم ماهانه انس با معارف قرآن",
];

function CreateSessionModal({ open, onOpenChange, onCreate }) {
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    intention: INTENTION_SUGGESTIONS[0],
    customIntention: "",
    target_type: "juz",
    is_private: false,
    deadline: "",
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
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
        status: "active",
        salawat_count: 0,
        deadline: createForm.deadline || null,
      });
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
      onCreate(newSession);
    } catch (err) {
      console.error("Error creating khatm session:", err);
      toast.error("خطا در ایجاد دوره ختم");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={open}>
          <Plus className="w-4 h-4" />
          ایجاد دوره جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full p-0 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ایجاد دوره جدید ختم قرآن</DialogTitle>
          <DialogDescription>یک دورهٔ تلاوت دسته‌جمعی ایجاد و سهم‌ها را تقسیم کنید</DialogDescription>
        </DialogHeader>
        <Separator />
        <form onSubmit={handleSubmit} className="space-y-4 text-sm p-6">
          <div>
            <Label>عنوان دوره *</Label>
            <Input
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="مثال: ختم نورانی به نیت شفای بیماران"
            />
          </div>

          <div>
            <Label>نیت ختم</Label>
            <Select value={createForm.intention} onValueChange={(v) => setCreateForm({ ...createForm, intention: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب نیت..." />
              </SelectTrigger>
              <SelectContent>
                {INTENTION_SUGGESTIONS.map((int) => (
                  <SelectItem key={int} value={int}>{int}</SelectItem>
                ))}
                <SelectItem value="سایر">سایر (تایپ نیت دلخواه)...</SelectItem>
              </SelectContent>
            </Select>
            {createForm.intention === "سایر" && (
              <Input
                value={createForm.customIntention}
                onChange={(e) => setCreateForm({ ...createForm, customIntention: e.target.value })}
                placeholder="نیت معنوی اختصاصی خود را بنویسید..."
                className="mt-2"
              />
            )}
          </div>

          <div>
            <Label>مدل تقسیم سهم‌ها</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={createForm.target_type === "juz" ? "primary" : "outline"}
                onClick={() => setCreateForm({ ...createForm, target_type: "juz" })}
                className="flex flex-col items-center text-center"
              >
                <div className="font-bold">۳۰ جزء</div>
                <div className="text-xs opacity-75 mt-0.5">سهم‌های کامل و استاندارد</div>
              </Button>
              <Button
                variant={createForm.target_type === "hezb" ? "primary" : "outline"}
                onClick={() => setCreateForm({ ...createForm, target_type: "hezb" })}
                className="flex flex-col items-center text-center"
              >
                <div className="font-bold">۶۰ حزب</div>
                <div className="text-xs opacity-75 mt-0.5">سهم‌های کوتاه‌تر و سریع‌تر</div>
              </Button>
            </div>
          </div>

          <div>
            <Label>توضیحات اختیاری</Label>
            <Textarea
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="پیام یا توضیحاتی برای شرکت‌کنندگان در این ختم..."
            />
          </div>

          <Card className="p-3 rounded bg-card border border-border/50">
            <CardContent className="p-0 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">دوره خصوصی (Private)</CardTitle>
                  <CardDescription>صرفاً با کد دعوت یا لینک مستقیم قابل دسترسی باشد</CardDescription>
                </div>
                <Checkbox
                  checked={createForm.is_private}
                  onCheckedChange={(v) => setCreateForm({ ...createForm, is_private: v })}
                />
              </div>
            </CardContent>
          </Card>

          <CardFooter className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); }}>
              انصراف
            </Button>
            <Button type="submit" disabled={creating} className="px-6 py-2.5">
              {creating ? "در حال ایجاد..." : "تایید و شروع ختم"}
            </Button>
          </CardFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Khatm() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joining, setJoining] = useState(false);

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
      const totalSal = items.reduce((acc, curr) => acc + (curr.salawat_count || 0), 0);
      setStats({
        totalSessions: items.length,
        totalCompletedParts: items.length * 12,
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
    const unsub = api.entities.KhatmSession.subscribe(() => {
      loadSessions();
    });
    return () => unsub?.();
  }, []);

  const filteredSessions = sessions.filter((s) => {
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
        router.push(`/khatm/${found.id}`);
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

  return (
    <div className="page-shell animate-fade-in font-doran pb-16" dir="rtl">
      {/* Soft hero */}
      <div className="relative overflow-hidden rounded mb-8 border border-border bg-card p-6 sm:p-10 shadow-soft">
        <div className="absolute -start-12 -top-12 w-48 h-48 bg-primary/10 rounded blur-3xl pointer-events-none" />
        <div className="absolute -end-12 -bottom-12 w-48 h-48 bg-primary/5 rounded blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>محفل تلاوت و ختم‌های دسته‌جمعی آیه پلاس</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-rokh-bold tracking-tight text-foreground">
              ختم قرآن دسته‌جمعی و گروه‌های تلاوت
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-editorial leading-relaxed">
              در ثواب تلاوت کلام‌الله مجید سهیم شوید. جزء یا حزب مورد نظر خود را انتخاب کرده، با دیگر همراهان به تلاوت بپردازید و نیت‌های معنوی خود را در دیوار دعا ثبت کنید.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button variant="primary" className="flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3">
                  <Plus className="w-4 h-4" />
                  <span>ایجاد دوره جدید</span>
                </Button>
              </DialogTrigger>
              <CreateSessionModal open={showCreateModal} onOpenChange={setShowCreateModal} onCreate={(s) => {
                setShowCreateModal(false);
                router.push(`/khatm/${s.id}`);
              }} />
            </Dialog>
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="outline"
              className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-3"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span>ورود با کد دعوت</span>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{stats.totalSessions.toLocaleString("fa-IR")}</div>
                <div className="text-xs text-muted-foreground">دوره‌های فعال و تکمیل‌شده</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">۳۰ جزء و ۶۰ حزب</div>
                <div className="text-xs text-muted-foreground">امکان تقسیم منعطف</div>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-secondary text-foreground flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{stats.totalSalawat.toLocaleString("fa-IR")}</div>
                <div className="text-xs text-muted-foreground">صلوات ثبت شده همراهان</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded overflow-x-auto no-scrollbar">
          <Tabs defaultValue={filterType} onValueChange={setFilterType}>
            <TabsList className="gap-1.5">
              {[
                { id: "all", label: "همه دوره‌ها" },
                { id: "juz", label: "۳۰ جزء" },
                { id: "hezb", label: "۶۰ حزب" },
                { id: "my", label: "دوره‌های من" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-2 rounded text-xs sm:text-sm font-medium whitespace-nowrap transition-all"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نیت، عنوان یا هدف..."
            className="w-full pe-10 ps-4 py-2.5 rounded bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Session Cards Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded bg-card/50 border border-border/40 animate-pulse p-6 space-y-4" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="rounded border border-dashed border-border/70 bg-card/30 p-12 text-center">
            <CardContent>
              <BookMarked className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-1">دوره‌ای یافت نشد</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5 font-doran">
                هیچ دوره ختمی با این مشخصات ثبت نشده است. می‌توانید خودتان اولین دوره را ایجاد کنید!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <KhatmCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Join with Invite Code Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
          <DialogHeader>
            <DialogTitle>ورود به دوره با کد دعوت</DialogTitle>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleJoinWithCode} className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              اگر توسط یکی از دوستان، اعضای خانواده یا مدیر مسجد کد ۶ رقمی دعوت دریافت کرده‌اید، آن را در کادر زیر وارد کنید:
            </p>
            <div>
              <Input
                type="text"
                required
                maxLength={10}
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="مثال: A7B9F2"
                className="w-full text-center tracking-widest text-lg font-mono uppercase px-4 py-3 rounded bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowJoinModal(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={joining} className="px-6 py-2.5">
                {joining ? "در حال بررسی..." : "ورود به محفل"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
      } catch {}
    }
    fetchStats();
    return () => { isMounted = false; };
  }, [session.id]);

  const totalParts = session.total_parts || 30;
  const progressPercent = Math.round((completedCount / totalParts) * 100);

  return (
    <Link
      href={`/khatm/${session.id}`}
      className="group flex flex-col justify-between rounded border border-border bg-card p-6 shadow-soft hover:shadow-md hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 left-0 h-1 bg-primary/0 group-hover:bg-primary/70 transition-colors" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="secondary" className="text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            <span>{session.target_type === "hezb" ? "۶۰ حزب" : "۳۰ جزء"}</span>
          </Badge>

          <div className="flex items-center gap-2">
            {session.is_private ? (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3" />
                <span>خصوصی</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Globe className="w-3 h-3" />
                <span>عمومی</span>
              </Badge>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold font-rokh-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
          {session.title}
        </h3>

        {session.intention && (
          <p className="text-xs text-quranic-saffron-dark font-medium line-clamp-1 mb-2">
            ✨ نیت: {session.intention}
          </p>
        )}

        {session.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {session.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-foreground">
              {completedCount.toLocaleString("fa-IR")} از {totalParts.toLocaleString("fa-IR")} سهم تکمیل شده
            </span>
            <span className="text-primary font-bold">{progressPercent.toLocaleString("fa-IR")}٪</span>
          </div>
          <div className="w-full h-2 rounded bg-muted overflow-hidden flex">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            <div className="bg-primary/40 h-full transition-all duration-500" style={{ width: `${Math.round((reservedCount / totalParts) * 100)}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {session.salawat_count > 0 && (
              <span className="inline-flex items-center gap-1 text-primary">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{session.salawat_count.toLocaleString("fa-IR")} صلوات</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:-translate-x-1 transition-transform">
            <span>مشاهده و انتخاب سهم</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
