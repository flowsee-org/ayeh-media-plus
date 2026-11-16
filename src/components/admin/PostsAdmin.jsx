import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { EmptyState, Field, Modal, inputCls } from "./shared";
import SelectInput from "./SelectInput";

const csv = (s) => String(s || "").split(/[،,]/).map((x) => x.trim()).filter(Boolean);

const TYPES = [
  { id: "reflection", label: "تدبّر" },
  { id: "verse_share", label: "اشتراک آیه" },
  { id: "image", label: "تصویر" },
  { id: "video", label: "ویدیو" },
  { id: "question", label: "پرسش" },
];

export default function PostsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = closed, {} = new, post object = edit

  const reload = () => {
    setLoading(true);
    api.entities.Post.list("-created_date", 100)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{(items.length || 0).toLocaleString("fa-IR")} پست</p>
        <button onClick={() => setForm({})} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent text-accent-foreground text-sm shadow-soft">
          <Plus className="h-4 w-4" /> پست جدید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="h-9 w-9 rounded bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center text-accent text-sm shrink-0">
                {p.author_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{p.author_name} · {TYPES.find((t) => t.id === p.type)?.label || p.type}</div>
                <p className="text-xs text-muted-foreground line-clamp-1">{p.content}</p>
              </div>
              <button onClick={() => setForm(p)} className="h-11 w-11 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 flex items-center justify-center transition shrink-0" title="ویرایش">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={async () => { await api.entities.Post.delete(p.id); reload(); }} className="h-11 w-11 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition shrink-0" title="حذف">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <EmptyState text="هنوز پستی ثبت نشده است." />}
        </div>
      )}

      {form !== null && (
        <PostForm
          initial={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); reload(); }}
        />
      )}
    </div>
  );
}

function PostForm({ initial, onClose, onSaved }) {
  const p = initial || {};
  const [form, setForm] = useState({
    author_name: p.author_name ?? "",
    author_id: p.author_id ?? "",
    author_avatar: p.author_avatar ?? "",
    type: p.type || "reflection",
    content: p.content ?? "",
    verse_key: p.verse_key ?? "",
    verse_arabic: p.verse_arabic ?? "",
    verse_text: p.verse_text ?? "",
    image_url: p.image_url ?? "",
    video_url: p.video_url ?? "",
    video_title: p.video_title ?? "",
    tags: (p.tags || []).join("، "),
    likes_count: p.likes_count ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        author_name: form.author_name,
        author_id: form.author_id || `seed_${Date.now()}`,
        type: form.type,
        content: form.content,
        tags: csv(form.tags),
        likes_count: Number(form.likes_count) || 0,
      };
      ["author_avatar", "verse_key", "verse_arabic", "verse_text", "image_url", "video_url", "video_title"].forEach((k) => {
        if (form[k]) payload[k] = form[k];
      });
      if (initial?.id) {
        await api.entities.Post.update(initial.id, payload);
      } else {
        await api.entities.Post.create(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.message || "خطا در ذخیره");
    }
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title={initial?.id ? "ویرایش پست" : "پست جدید"}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="نام نویسنده"><input value={form.author_name} onChange={set("author_name")} className={inputCls} /></Field>
        <Field label="نوع پست">
          <SelectInput value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={TYPES.map((t) => ({ value: t.id, label: t.label }))} />
        </Field>
      </div>
      <Field label="متن پست"><textarea value={form.content} onChange={set("content")} rows={4} className={inputCls} dir="rtl" /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="آیه مرتبط (مثلاً 2:255)"><input value={form.verse_key} onChange={set("verse_key")} className={inputCls} /></Field>
        <Field label="برچسب‌ها (با کاما)"><input value={form.tags} onChange={set("tags")} className={inputCls} /></Field>
      </div>
      <Field label="متن عربی آیه"><textarea value={form.verse_arabic} onChange={set("verse_arabic")} rows={2} className={inputCls} dir="rtl" /></Field>
      <Field label="ترجمه آیه"><input value={form.verse_text} onChange={set("verse_text")} className={inputCls} /></Field>
      <Field label="لینک تصویر"><input value={form.image_url} onChange={set("image_url")} className={inputCls} dir="ltr" placeholder="https://…" /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="لینک ویدیو (mp4)"><input value={form.video_url} onChange={set("video_url")} className={inputCls} dir="ltr" placeholder="https://…" /></Field>
        <Field label="عنوان ویدیو"><input value={form.video_title} onChange={set("video_title")} className={inputCls} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="لینک آواتار نویسنده"><input value={form.author_avatar} onChange={set("author_avatar")} className={inputCls} dir="ltr" placeholder="https://…" /></Field>
        <Field label="تعداد لایک اولیه"><input type="number" value={form.likes_count} onChange={set("likes_count")} className={inputCls} /></Field>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors">انصراف</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded text-sm bg-accent text-accent-foreground shadow-soft disabled:opacity-50">
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
      </div>
    </Modal>
  );
}