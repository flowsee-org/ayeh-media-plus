import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Pencil, Search } from "lucide-react";
import { EmptyState, Field, Modal, inputCls } from "./shared";

const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);

const FIELDS = [
  { key: "tadabbur", label: "تدبّر", rows: 3 },
  { key: "classical_tafsir", label: "تفسیر کلاسیک", rows: 3 },
  { key: "modern_tafsir", label: "تفسیر نوین", rows: 3 },
  { key: "historical_context", label: "زمینه تاریخی", rows: 2 },
  { key: "asbab_al_nuzul", label: "اسباب نزول", rows: 2 },
  { key: "grammar_breakdown", label: "تجزیه گرامری", rows: 2 },
  { key: "life_lessons", label: "درس‌های زندگی (هر خط یک مورد)", rows: 3, list: true },
  { key: "practical_applications", label: "کاربردهای عملی (هر خط یک مورد)", rows: 3, list: true },
  { key: "questions_to_reflect", label: "پرسش‌های تدبّر (هر خط یک مورد)", rows: 3, list: true },
];

/* Small chips showing which tafsir fields are filled */
const STATUS_FIELDS = ["tadabbur", "classical_tafsir", "modern_tafsir", "historical_context", "asbab_al_nuzul"];
const STATUS_LABELS = { tadabbur: "تدبّر", classical_tafsir: "کلاسیک", modern_tafsir: "نوین", historical_context: "تاریخی", asbab_al_nuzul: "اسباب" };

export default function TafsirAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  const reload = () => {
    setLoading(true);
    api.entities.Verse.list("-created_date", 200)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const filtered = q.trim()
    ? items.filter((v) =>
        [v.verse_key, v.surah_name_english, v.surah_name_arabic, v.translation]
          .some((f) => String(f || "").toLowerCase().includes(q.trim().toLowerCase()))
      )
    : items;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی آیه (کلید، نام سوره یا ترجمه)…"
          className={`${inputCls} pr-10`}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/20 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">{v.surah_number}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                  {v.verse_key}
                  <span className="text-xs font-normal text-muted-foreground">{v.surah_name_english}</span>
                </div>
                {/* filled / empty tafsir chips */}
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {STATUS_FIELDS.map((f) => (
                    <span key={f} className={`text-xs px-1.5 py-0.5 rounded-full border ${v[f] ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-muted/40 text-muted-foreground/50 border-border/40"}`}>
                      {STATUS_LABELS[f]}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => setEditing(v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium shadow-soft shrink-0">
                <Pencil className="h-3.5 w-3.5" /> تفسیر
              </button>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState text="آیه‌ای یافت نشد." />}
        </div>
      )}

      {editing && (
        <TafsirForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function TafsirForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const f = {};
    FIELDS.forEach(({ key, list }) => {
      f[key] = list ? (initial[key] || []).join("\n") : (initial[key] || "");
    });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload = {};
      FIELDS.forEach(({ key, list }) => {
        payload[key] = list ? lines(form[key]) : form[key];
      });
      await api.entities.Verse.update(initial.id, payload);
      onSaved();
    } catch (e) {
      setErr(e.message || "خطا در ذخیره");
    }
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title={`تفسیر آیه ${initial.verse_key || ""}`}>
      {FIELDS.map(({ key, label, rows }) => (
        <Field key={key} label={label}>
          <textarea value={form[key]} onChange={set(key)} rows={rows} className={inputCls} dir="rtl" />
        </Field>
      ))}
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors">انصراف</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-full text-sm bg-accent text-accent-foreground shadow-soft disabled:opacity-50">
          {saving ? "در حال ذخیره…" : "ذخیره تفسیر"}
        </button>
      </div>
    </Modal>
  );
}