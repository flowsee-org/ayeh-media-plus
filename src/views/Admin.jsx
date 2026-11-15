'use client';
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, BookOpen, ScrollText, MessageCircle, Users, FolderHeart, Compass, Shield, Loader2, Plus, Trash2, Pencil, Lock } from "lucide-react";
import Dashboard from "@/components/admin/Dashboard";
import TafsirAdmin from "@/components/admin/TafsirAdmin";
import PostsAdmin from "@/components/admin/PostsAdmin";
import VerseForm from "@/components/admin/VerseForm";
import ErrorDoctor from "@/components/admin/ErrorDoctor";
import { Field, Modal, EmptyState, inputCls } from "@/components/admin/shared";
import SelectInput from "@/components/admin/SelectInput";
import RoleGuard from "@/components/RoleGuard";
import { PERMISSIONS } from "@/lib/rbac";

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
        <div className="h-16 w-16 mx-auto mb-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold font-rokh-bold mb-2">دسترسی اختصاصی مدیریت</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed font-doran">
          برای مدیریت آیات، تفاسیر و دسترسی به پنل ادمین، لطفاً با حساب کاربری مدیر سامانه وارد شوید.
        </p>
        {user ? (
          <p className="text-xs text-muted-foreground mb-4 font-doran">نقش شما: {user.role || "کاربر"}</p>
        ) : null}
        <button
          onClick={() => openAuthModal()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          ورود با حساب مدیر
        </button>
      </div>
    }>
      <div className="page-shell animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent/25 to-primary/15 text-accent flex items-center justify-center ring-1 ring-accent/20 shrink-0">
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
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${tab === n.id ? "bg-accent text-accent-foreground shadow-soft" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded-2xl border border-border/40 bg-card/50 p-2 shadow-soft">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === n.id ? "bg-accent text-accent-foreground shadow-soft" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
              >
                <n.icon className="h-4 w-4 shrink-0" /> {n.label}
              </button>
            ))}
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
    loader().then(setItems).catch(() => {}).finally(() => setLoading(false));
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
        <button onClick={() => setForm({})} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm shadow-soft">
          <Plus className="h-4 w-4" /> آیه جدید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">{v.surah_number}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-doran">{v.surah_name_english} · {v.verse_key}</div>
                <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{v.translation}</p>
              </div>
              <button onClick={() => setForm(v)} className="h-11 w-11 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 flex items-center justify-center transition" title="ویرایش">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={async () => { await api.entities.Verse.delete(v.id); reload(); }} className="h-11 w-11 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition" title="حذف">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm shadow-soft">
          <Plus className="h-4 w-4" /> عالم جدید
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center text-accent text-sm">{s.name ? s.name[0] : "?"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-doran">{s.name}</div>
                <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{s.title} · {s.bio?.slice(0, 30) || ""}</p>
              </div>
              <button onClick={async () => { await api.entities.Scholar.delete(s.id); reload(); }} className="h-11 w-11 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
  const submit = async () => {
    setSaving(true);
    try {
      await api.entities.Scholar.create({
        ...form,
        books: form.books.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onSaved();
    } catch {}
    setSaving(false);
  };
  return (
    <Modal onClose={onClose} title="افزودن عالم">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="نام"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
        <Field label="نام عربی"><input value={form.name_arabic} onChange={(e) => setForm({ ...form, name_arabic: e.target.value })} className={inputCls} dir="rtl" /></Field>
        <Field label="عنوان"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
        <Field label="تخصص"><input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputCls} /></Field>
      </div>
      <Field label="زندگی‌نامه"><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={inputCls} /></Field>
      <Field label="آثار (با کاما)"><input value={form.books} onChange={(e) => setForm({ ...form, books: e.target.value })} className={inputCls} /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors">انصراف</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground shadow-soft">{saving ? "…" : "ذخیره"}</button>
      </div>
    </Modal>
  );
}

function CollectionsAdmin() {
  const { items, loading, reload } = useList(() => api.entities.Collection.list("-created_date", 100));
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{items.length} مجموعه</p>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm shadow-soft">
          <Plus className="h-4 w-4" /> مجموعه جدید
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.theme_color || "#10b981"}22`, color: c.theme_color || "#10b981" }}><FolderHeart className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-doran">{c.name}</div>
                <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{c.description}</p>
              </div>
              <button onClick={async () => { await api.entities.Collection.delete(c.id); reload(); }} className="h-11 w-11 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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
    } catch {}
    setSaving(false);
  };
  return (
    <Modal onClose={onClose} title="افزودن مجموعه">
      <Field label="نام"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
      <Field label="توضیح"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="رنگ"><input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10 w-full rounded-lg border border-border/60 bg-card/50" /></Field>
        <Field label="الگوی جلد">
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
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="کلید آیات (با کاما)"><input value={form.verse_keys} onChange={(e) => setForm({ ...form, verse_keys: e.target.value })} className={inputCls} placeholder="1:1,2:255" /></Field>
        <Field label="موضوعات مرتبط (با کاما)"><input value={form.related_topics} onChange={(e) => setForm({ ...form, related_topics: e.target.value })} className={inputCls} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="زمان مطالعه (دقیقه)"><input type="number" value={form.reading_time} onChange={(e) => setForm({ ...form, reading_time: e.target.value })} className={inputCls} /></Field>
        <Field label="مجموعه ویژه">
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm">نمایش در مجموعه‌های ویژه</span>
          </label>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors">انصراف</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground shadow-soft">{saving ? "…" : "ذخیره"}</button>
      </div>
    </Modal>
  );
}

function TopicsAdmin() {
  const { items, loading, reload } = useList(() => api.entities.Topic.list("-created_date", 100));
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground font-doran">{items.length} موضوع</p>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm shadow-soft">
          <Plus className="h-4 w-4" /> موضوع جدید
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.theme_color || "#0B6E4F"}22`, color: t.theme_color || "#0B6E4F" }}><Compass className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-doran">{t.name}</div>
                <p className="text-xs text-muted-foreground line-clamp-1 font-doran">{t.description} · {(t.verse_keys || []).length} آیه</p>
              </div>
              <button onClick={async () => { await api.entities.Topic.delete(t.id); reload(); }} className="h-11 w-11 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <EmptyState text="هنوز موضوعی ثبت نشده است." />}
        </div>
      )}
      {show && <TopicForm onClose={() => setShow(false)} onSaved={() => { setShow(false); reload(); }} />}
    </div>
  );
}

function TopicForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", name_arabic: "", description: "", category: "ethics", theme_color: "#c5a059", verse_keys: "" });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const keys = form.verse_keys.split(",").map((s) => s.trim()).filter(Boolean);
      await api.entities.Topic.create({ ...form, verse_keys: keys, verse_count: keys.length });
      onSaved();
    } catch {}
    setSaving(false);
  };
  return (
    <Modal onClose={onClose} title="افزودن موضوع">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="نام"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
        <Field label="نام عربی"><input value={form.name_arabic} onChange={(e) => setForm({ ...form, name_arabic: e.target.value })} className={inputCls} dir="rtl" /></Field>
        <Field label="دسته">
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
        </Field>
        <Field label="رنگ"><input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10 w-full rounded-lg border border-border/50 bg-card/50" /></Field>
      </div>
      <Field label="توضیح"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} /></Field>
      <Field label="کلید آیات (با کاما، مثلاً 1:1,2:255)"><input value={form.verse_keys} onChange={(e) => setForm({ ...form, verse_keys: e.target.value })} className={inputCls} /></Field>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors">انصراف</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground shadow-soft">{saving ? "…" : "ذخیره"}</button>
      </div>
    </Modal>
  );
}