'use client';
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { LayoutDashboard, BookOpen, ScrollText, MessageCircle, Users, FolderHeart, Compass, Shield, Loader2, Plus, Trash2, Pencil, Lock, X, Library } from "lucide-react";
import Dashboard from "@/components/admin/Dashboard";
import TafsirAdmin from "@/components/admin/TafsirAdmin";
import PostsAdmin from "@/components/admin/PostsAdmin";
import VerseForm from "@/components/admin/VerseForm";
import ErrorDoctor from "@/components/admin/ErrorDoctor";
import SelectInput from "@/components/admin/SelectInput";
import RoleGuard from "@/components/RoleGuard";
import { PERMISSIONS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const NAV = [
  { id: "dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { id: "errors", label: "پایش و دستیار خطاها", icon: Shield },
  { id: "verses", label: "آیات", icon: BookOpen },
  { id: "tafsir", label: "تفاسیر", icon: ScrollText },
  { id: "posts", label: "پست‌ها", icon: MessageCircle },
  { id: "scholars", label: "علما", icon: Users },
  { id: "collections", label: "مجموعه‌ها", icon: FolderHeart },
  { id: "topics", label: "موضوعات", icon: Compass },
];

const TITLES = {
  dashboard: ["نمای کلی", "آمار و وضعیت محتوای پلتفرم"],
  errors: ["پایش خطاها و دستیار هوشمند رفع اشکال", "ثبت مرکزی خطاهای بک‌اند و فرانت‌اند به همراه راهنمای فیکس"],
  verses: ["آیات", "افزودن، ویرایش و حذف آیات"],
  tafsir: ["تفاسیر", "ویرایش محتوای تفسیری و تدبّر آیات"],
  posts: ["پست‌های اجتماعی", "مدیریت پست‌های فید اجتماعی"],
  scholars: ["علما", "مدیریت پروفایل علما و مفسران"],
  collections: ["مجموعه‌ها", "مدیریت مجموعه‌های موضوعی"],
  topics: ["موضوعات", "مدیریت موضوعات قرآنی"],
};

export default function Admin() {
  const { user, isLoadingAuth, openAuthModal } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const title = TITLES[tab];

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <RoleGuard requiredPermission={PERMISSIONS.SYSTEM_CONFIG} fallback={
      <div className="mx-auto max-w-md py-24 px-4 text-center font-doran" dir="rtl">
        <div className="h-16 w-16 mx-auto mb-4 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold font-rokh-bold mb-2">دسترسی اختصاصی مدیریت</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed font-doran">
          برای مدیریت آیات، تفاسیر و دسترسی به پنل ادمین، لطفاً با حساب کاربری مدیر سامانه وارد شوید.
        </p>
        {user ? (
          <p className="text-xs text-muted-foreground mb-4 font-doran">نقش شما: {user.role || "کاربر"}</p>
        ) : null}
        <Button
          onClick={() => openAuthModal()}
          variant="primary"
          size="sm"
          className="shadow-md hover:shadow-lg transition-all"
        >
          ورود با حساب مدیر
        </Button>
      </div>
    }>
      <div className="page-shell animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="h-12 w-12 rounded bg-gradient-to-br from-accent/25 to-primary/15 text-accent flex items-center justify-center ring-1 ring-accent/20 shrink-0">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-rokh-bold font-extrabold text-3xl sm:text-4xl tracking-tight">پنل مدیریت</h1>
          <p className="text-muted-foreground text-sm mt-1 font-doran">مدیریت کامل محتوا — بدون نیاز به کدنویسی.</p>
        </div>
      </div>

      {/* Mobile pills */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar mb-6">
        <div className="flex gap-2 w-max">
          <Tabs defaultValue={tab} onValueChange={setTab}>
            <TabsList className="gap-2">
              {NAV.map((n) => (
                <TabsTrigger
                  key={n.id}
                  value={n.id}
                  variant="outline"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all shrink-0 border"
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded border border-border/40 bg-card/50 p-2 shadow-soft">
            <Tabs defaultValue={tab} onValueChange={setTab}>
              <TabsList className="flex-col gap-1">
                {NAV.map((n) => (
                  <TabsTrigger
                    key={n.id}
                    value={n.id}
                    variant="outline"
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded text-sm font-medium transition-all shrink-0 border ${tab === n.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/40"}`}
                  >
                    <n.icon className="h-4 w-4 shrink-0" /> {n.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </nav>
        </aside>

        {/* Content */}
        <section className="min-w-0">
          <div className="mb-5">
            <h2 className="font-rokh-bold font-bold text-xl sm:text-2xl">{title[0]}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-doran">{title[1]}</p>
          </div>

          {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
          {tab === "errors" && <ErrorDoctor />}
          {tab === "verses" && <VersesAdmin />}
          {tab === "tafsir" && <TafsirAdmin />}
          {tab === "posts" && <PostsAdmin />}
          {tab === "scholars" && <ScholarsAdmin />}
          {tab === "collections" && <CollectionsAdmin />}
          {tab === "topics" && <TopicsAdmin />}
        </section>
      </div>
    </div>
    </RoleGuard>
  );
}

function useList(loader) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    loader()
      .then(setItems)
      .catch((err) => {
        toast.error(err.message || 'خطا در بارگذاری داده‌ها');
      })
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);
  return { items, loading, reload, setItems };
}

function VersesAdmin() {
  const { items, loading, reload } = useList(() => api.entities.Verse.list("-created_date", 100));
  const [form, setForm] = useState(null); // null = بسته، {} = آیه جدید، آبجکت = ویرایش

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground font-doran">{items.length} آیه ثبت شده</p>
        <Button variant="secondary" size="sm" onClick={() => setForm({})}>
          <Plus className="h-4 w-4" /> آیه جدید
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((v) => (
            <Card key={v.id} className="rounded border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">{v.surah_number}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-doran">{v.surah_name_english} · {v.verse_key}</div>
                  <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{v.translation}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setForm(v)} title="ویرایش">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (!window.confirm("آیا از حذف این آیه مطمئن هستید؟")) return;
                      api.entities.Verse.delete(v.id).then(reload);
                    }}
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <EmptyState text="هنوز آیه‌ای ثبت نشده است." />}
        </div>
      )}

      {form !== null && (
        <VerseForm
          initial={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
    </div>
  );
}

function ScholarsAdmin() {
  const { items, loading, reload } = useList(() => api.entities.Scholar.list("-created_date", 100));
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground font-doran">{items.length} عالم</p>
        <Button variant="secondary" size="sm" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" /> عالم جدید
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card key={s.id} className="rounded border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center text-accent text-sm">{s.name ? s.name[0] : "?"}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-doran">{s.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{s.title} · {s.bio?.slice(0, 30) || ""}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (!window.confirm("آیا از حذف این عالم مطمئن هستید؟")) return;
                    api.entities.Scholar.delete(s.id).then(reload);
                  }}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {items.length === 0 && <EmptyState text="هنوز عالمی ثبت نشده است." />}
        </div>
      )}
      {show && <ScholarForm onClose={() => setShow(false)} onSaved={() => { setShow(false); reload(); }} />}
    </div>
  );
}

function ScholarForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", name_arabic: "", title: "", bio: "", specialization: "", books: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setSaving(true);
    try {
      await api.entities.Scholar.create({
        ...form,
        books: form.books.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "خطا در ذخیره عالم");
    }
    setSaving(false);
  };
  return (
    <Dialog open={onClose !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 sm:p-8 shadow-premium space-y-6">
        <DialogHeader>
          <DialogTitle>افزودن عالم</DialogTitle>
          <DialogDescription>افزودن استاد یا مفسّر جدید به سامانه</DialogDescription>
        </DialogHeader>
        <DialogClose>
          <X className="h-4 w-4" />
        </DialogClose>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>نام</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نام عربی</Label>
              <Input value={form.name_arabic} onChange={(e) => setForm({ ...form, name_arabic: e.target.value })} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>عنوان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>تخصص</Label>
              <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>زندگی‌نامه</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>آثار (با کاما)</Label>
            <Input value={form.books} onChange={(e) => setForm({ ...form, books: e.target.value })} />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={saving} className="px-4 py-2">
              {saving ? "…" : "ذخیره"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CollectionsAdmin() {
  const { items, loading, reload } = useList(() => api.entities.Collection.list("-created_date", 100));
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{items.length} مجموعه</p>
        <Button variant="secondary" size="sm" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" /> مجموعه جدید
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <Card key={c.id} className="rounded border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded flex items-center justify-center" style={{ backgroundColor: `${c.theme_color || "#10b981"}22`, color: c.theme_color || "#10b981" }}><FolderHeart className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-doran">{c.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{c.description}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (!window.confirm("آیا از حذف این مجموعه مطمئن هستید؟")) return;
                    api.entities.Collection.delete(c.id).then(reload);
                  }}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {items.length === 0 && <EmptyState text="هنوز مجموعه‌ای ثبت نشده است." />}
        </div>
      )}
      {show && <CollectionForm onClose={() => setShow(false)} onSaved={() => { setShow(false); reload(); }} />}
    </div>
  );
}

function CollectionForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", description: "", theme_color: "#c5a059", cover_pattern: "stars", verse_keys: "", related_topics: "", reading_time: 15, is_featured: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setSaving(true);
    try {
      const keys = form.verse_keys.split(",").map((s) => s.trim()).filter(Boolean);
      const topics = form.related_topics.split(",").map((s) => s.trim()).filter(Boolean);
      await api.entities.Collection.create({
        name: form.name,
        description: form.description,
        theme_color: form.theme_color,
        cover_pattern: form.cover_pattern,
        verse_keys: keys,
        verse_count: keys.length,
        related_topics: topics,
        reading_time: Number(form.reading_time) || 15,
        is_featured: form.is_featured,
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "خطا در ذخیره مجموعه");
    }
    setSaving(false);
  };
  return (
    <Dialog open={onClose !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 sm:p-8 shadow-premium space-y-6">
        <DialogHeader>
          <DialogTitle>افزودن مجموعه</DialogTitle>
          <DialogDescription>ایجاد مجموعه موضوعی آیات</DialogDescription>
        </DialogHeader>
        <DialogClose>
          <X className="h-4 w-4" />
        </DialogClose>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>نام</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>توضیح</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>رنگ</Label>
              <Input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10 w-full rounded border border-border/60 bg-card/50" />
            </div>
            <div className="space-y-2">
              <Label>الگوی جلد</Label>
              <SelectInput
                value={form.cover_pattern}
                onChange={(v) => setForm({ ...form, cover_pattern: v })}
                options={[
                  { value: "stars", label: "ستاره" },
                  { value: "geometric", label: "هندسی" },
                  { value: "arabesque", label: "اسلیمی" },
                  { value: "mosque", label: "مسجد" },
                ]}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>کلید آیات (با کاما)</Label>
              <Input value={form.verse_keys} onChange={(e) => setForm({ ...form, verse_keys: e.target.value })} placeholder="1:1,2:255" />
            </div>
            <div className="space-y-2">
              <Label>موضوعات مرتبط (با کاما)</Label>
              <Input value={form.related_topics} onChange={(e) => setForm({ ...form, related_topics: e.target.value })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>زمان مطالعه (دقیقه)</Label>
              <Input type="number" value={form.reading_time} onChange={(e) => setForm({ ...form, reading_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Checkbox
                checked={form.is_featured}
                onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
              />
              <Label className="mt-1">نمایش در مجموعه‌های ویژه</Label>
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={saving} className="px-4 py-2">
              {saving ? "…" : "ذخیره"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopicsAdmin() {
  const { items, loading, reload } = useList(() => api.entities.Topic.list("-created_date", 100));
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground font-doran">{items.length} موضوع</p>
        <Button variant="secondary" size="sm" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" /> موضوع جدید
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Card key={t.id} className="rounded border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded flex items-center justify-center" style={{ backgroundColor: `${t.theme_color || "#0B6E4F"}22`, color: t.theme_color || "#0B6E4F" }}><Compass className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-doran">{t.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{t.description} · {(t.verse_keys || []).length} آیه</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (!window.confirm("آیا از حذف این موضوع مطمئن هستید؟")) return;
                    api.entities.Topic.delete(t.id).then(reload);
                  }}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <Card className="rounded border border-dashed border-border/60 p-12 text-center">
              <CardContent>
                <Library className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">هنوز موضوعی ثبت نشده است.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {show && <TopicForm onClose={() => setShow(false)} onSaved={() => { setShow(false); reload(); }} />}
    </div>
  );
}

function TopicForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", name_arabic: "", description: "", category: "ethics", theme_color: "#c5a059", verse_keys: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setSaving(true);
    try {
      const keys = form.verse_keys.split(",").map((s) => s.trim()).filter(Boolean);
      await api.entities.Topic.create({ ...form, verse_keys: keys, verse_count: keys.length });
      onSaved();
    } catch (e) {
      setErr(e.message || "خطا در ذخیره موضوع");
    }
    setSaving(false);
  };
  return (
    <Dialog open={onClose !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 sm:p-8 shadow-premium space-y-6">
        <DialogHeader>
          <DialogTitle>افزودن موضوع</DialogTitle>
          <DialogDescription>ایجاد موضوع قرآنی جدید</DialogDescription>
        </DialogHeader>
        <DialogClose>
          <X className="h-4 w-4" />
        </DialogClose>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>نام</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>نام عربی</Label>
              <Input value={form.name_arabic} onChange={(e) => setForm({ ...form, name_arabic: e.target.value })} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>دسته</Label>
              <SelectInput
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={[
                  { value: "beliefs", label: "عقاید" },
                  { value: "worship", label: "عبادات" },
                  { value: "ethics", label: "اخلاق" },
                  { value: "family", label: "خانواده" },
                  { value: "social", label: "حقوق اجتماعی" },
                  { value: "economic", label: "اقتصاد" },
                  { value: "governance", label: "مدیریت و رهبری" },
                  { value: "prophets", label: "انبیا" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>رنگ</Label>
              <Input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10 w-full rounded border border-border/50 bg-card/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>توضیح</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>کلید آیات (با کاما، مثلاً 1:1,2:255)</Label>
            <Input value={form.verse_keys} onChange={(e) => setForm({ ...form, verse_keys: e.target.value })} />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={saving} className="px-4 py-2">
              {saving ? "…" : "ذخیره"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}