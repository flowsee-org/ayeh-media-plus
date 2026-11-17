import { useState } from "react";
import api from "@/lib/api";
import { Field, Modal, inputCls } from "./shared";
import SelectInput from "./SelectInput";

const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const csv = (s) => String(s || "").split(/[،,]/).map((x) => x.trim()).filter(Boolean);

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="h-1.5 w-1.5 rounded bg-accent/60" />
      <span className="text-xs font-bold text-accent tracking-wide">{children}</span>
      <span className="flex-1 h-px bg-accent/10" />
    </div>
  );
}

/* Create / edit a verse with all its tafsir & tadabbur fields */
export default function VerseForm({ initial, onClose, onSaved }) {
  const v = initial || {};
  const [form, setForm] = useState({
    surah_number: v.surah_number ?? "",
    verse_number: v.verse_number ?? "",
    verse_key: v.verse_key ?? "",
    surah_name_english: v.surah_name_english ?? "",
    surah_name_arabic: v.surah_name_arabic ?? "",
    transliteration: v.transliteration ?? "",
    arabic: v.arabic ?? "",
    translation: v.translation ?? "",
    reciter: v.reciter ?? "",
    audio_url: v.audio_url ?? "",
    tadabbur: v.tadabbur ?? "",
    classical_tafsir: v.classical_tafsir ?? "",
    modern_tafsir: v.modern_tafsir ?? "",
    historical_context: v.historical_context ?? "",
    asbab_al_nuzul: v.asbab_al_nuzul ?? "",
    grammar_breakdown: v.grammar_breakdown ?? "",
    difficulty_level: v.difficulty_level || "intermediate",
    estimated_reading_time: v.estimated_reading_time ?? "",
    tags: (v.tags || []).join("، "),
    life_lessons: (v.life_lessons || []).join("\n"),
    practical_applications: (v.practical_applications || []).join("\n"),
    questions_to_reflect: (v.questions_to_reflect || []).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        surah_number: Number(form.surah_number) || 1,
        verse_number: Number(form.verse_number) || 1,
        verse_key: form.verse_key.trim() || `${form.surah_number}:${form.verse_number}`,
        surah_name_english: form.surah_name_english,
        surah_name_arabic: form.surah_name_arabic,
        transliteration: form.transliteration,
        arabic: form.arabic,
        translation: form.translation,
        reciter: form.reciter,
        audio_url: form.audio_url,
        tadabbur: form.tadabbur,
        classical_tafsir: form.classical_tafsir,
        modern_tafsir: form.modern_tafsir,
        historical_context: form.historical_context,
        asbab_al_nuzul: form.asbab_al_nuzul,
        grammar_breakdown: form.grammar_breakdown,
        difficulty_level: form.difficulty_level,
        tags: csv(form.tags),
        life_lessons: lines(form.life_lessons),
        practical_applications: lines(form.practical_applications),
        questions_to_reflect: lines(form.questions_to_reflect),
      };
      const t = Number(form.estimated_reading_time);
      if (t) payload.estimated_reading_time = t;
      if (initial?.id) {
        await api.entities.Verse.update(initial.id, payload);
      } else {
        await api.entities.Verse.create(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.message || "خطا در ذخیره");
    }
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title={initial?.id ? `ویرایش آیه ${initial.verse_key || ""}` : "افزودن آیه"}>
      <SectionTitle>اطلاعات آیه</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="شماره سوره"><input type="number" value={form.surah_number} onChange={set("surah_number")} className={inputCls} /></Field>
        <Field label="شماره آیه"><input type="number" value={form.verse_number} onChange={set("verse_number")} className={inputCls} /></Field>
        <Field label="کلید آیه (مثلاً 1:1)"><input value={form.verse_key} onChange={set("verse_key")} className={inputCls} placeholder="1:1" /></Field>
        <Field label="نام سوره (انگلیسی)"><input value={form.surah_name_english} onChange={set("surah_name_english")} className={inputCls} /></Field>
        <Field label="نام سوره (عربی)"><input value={form.surah_name_arabic} onChange={set("surah_name_arabic")} className={inputCls} dir="rtl" /></Field>
        <Field label="سطح">
          <SelectInput
            value={form.difficulty_level}
            onChange={(v) => setForm((f) => ({ ...f, difficulty_level: v }))}
            options={[
              { value: "beginner", label: "مقدماتی" },
              { value: "intermediate", label: "متوسط" },
              { value: "advanced", label: "پیشرفته" },
            ]}
          />
        </Field>
      </div>

      <SectionTitle>متن آیه</SectionTitle>
      <Field label="متن عربی"><textarea value={form.arabic} onChange={set("arabic")} rows={2} className={inputCls} dir="rtl" /></Field>
      <Field label="ترجمه فارسی"><textarea value={form.translation} onChange={set("translation")} rows={2} className={inputCls} dir="rtl" /></Field>
      <Field label="آوانویسی (لاتین)"><input value={form.transliteration} onChange={set("transliteration")} className={inputCls} dir="ltr" /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="قاری"><input value={form.reciter} onChange={set("reciter")} className={inputCls} /></Field>
        <Field label="لینک صوت"><input value={form.audio_url} onChange={set("audio_url")} className={inputCls} dir="ltr" placeholder="https://…" /></Field>
      </div>

      <SectionTitle>تفسیر و تدبّر</SectionTitle>
      <Field label="تدبّر"><textarea value={form.tadabbur} onChange={set("tadabbur")} rows={3} className={inputCls} dir="rtl" /></Field>
      <Field label="تفسیر کلاسیک"><textarea value={form.classical_tafsir} onChange={set("classical_tafsir")} rows={3} className={inputCls} dir="rtl" /></Field>
      <Field label="تفسیر نوین"><textarea value={form.modern_tafsir} onChange={set("modern_tafsir")} rows={3} className={inputCls} dir="rtl" /></Field>
      <Field label="زمینه تاریخی"><textarea value={form.historical_context} onChange={set("historical_context")} rows={2} className={inputCls} dir="rtl" /></Field>
      <Field label="اسباب نزول"><textarea value={form.asbab_al_nuzul} onChange={set("asbab_al_nuzul")} rows={2} className={inputCls} dir="rtl" /></Field>
      <Field label="تجزیه گرامری"><textarea value={form.grammar_breakdown} onChange={set("grammar_breakdown")} rows={2} className={inputCls} dir="rtl" /></Field>

      <SectionTitle>درس‌ها و جزئیات</SectionTitle>
      <Field label="درس‌های زندگی (هر خط یک مورد)"><textarea value={form.life_lessons} onChange={set("life_lessons")} rows={3} className={inputCls} /></Field>
      <Field label="کاربردهای عملی (هر خط یک مورد)"><textarea value={form.practical_applications} onChange={set("practical_applications")} rows={3} className={inputCls} /></Field>
      <Field label="پرسش‌های تدبّر (هر خط یک مورد)"><textarea value={form.questions_to_reflect} onChange={set("questions_to_reflect")} rows={3} className={inputCls} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="برچسب‌ها (با کاما)"><input value={form.tags} onChange={set("tags")} className={inputCls} /></Field>
        <Field label="زمان مطالعه (دقیقه)"><input type="number" value={form.estimated_reading_time} onChange={set("estimated_reading_time")} className={inputCls} /></Field>
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