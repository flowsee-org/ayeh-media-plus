import { useState } from "react";
import { Loader2, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK = [
  "مشکل مالی و بدهی",
  "اضطراب و بی‌قراری درون",
  "غم، اندوه و دلتنگی",
  "ناامیدی و بن‌بست فکری",
  "تنهایی و غربت دل",
  "بیماری و رنج جسمی",
  "اختلاف خانوادگی و رنجش",
  "ترس از آینده و روزی",
];

export default function ProblemForm({ onSubmit, loading }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
  };

  return (
    <div className="rounded border border-border bg-card p-6 shadow-soft relative overflow-hidden">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-rokh-bold font-bold text-base sm:text-lg text-foreground">امروز چه دغدغه‌ای در دل دارید؟</h2>
            <p className="font-doran text-xs text-muted-foreground">هر چه در دلت است بنویس؛ کلام وحی برای همان احوال، راهگشا و آرامش‌بخش است.</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          dir="rtl"
          placeholder="مثلاً: نگران آینده و روزی‌ام هستم، فشارهای کاری سنگینی می‌کند و دنبال آرامش قلبی‌ام…"
          className="w-full resize-none rounded border border-border bg-background p-3.5 text-sm sm:text-base font-ui leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
        />

        <div className="mt-3.5 mb-5 flex flex-wrap items-center gap-1.5 font-ui">
          <span className="text-[11px] font-semibold text-muted-foreground ml-1">موضوعات پرتکرار:</span>
          {QUICK.map((q) => (
            <Button
              key={q}
              onClick={() => setText(q)}
              className={`rounded border px-3 py-1 text-xs transition-colors ${
                text === q
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {q}
            </Button>
          ))}
        </div>

        <Button
          onClick={submit}
          disabled={!text.trim() || loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded bg-primary text-primary-foreground font-ui font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>در حال استخراج آیات راهگشا با هوش مصنوعی...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>یافتن آیه‌ی راه و پیام‌های تسکین‌بخش</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
