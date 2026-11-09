import { useEffect, useState, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { Video, PlayCircle, Clock, ArrowLeft, Loader2, BookOpen, Sparkles } from "lucide-react";

export default function TalksPreview() {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.Verse.list("-created_date", 100)
      .then(setVerses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const talks = useMemo(() => {
    const list = [];
    verses.forEach((v) => {
      (v.videos || []).forEach((vid, i) => {
        list.push({
          ...vid,
          id: `${v.id}-${i}`,
          verse_key: v.verse_key,
          surah_name: v.surah_name_english || v.surah_name_transliteration || "",
        });
      });
    });
    return list.slice(0, 3);
  }, [verses]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex items-end justify-between mb-8 pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-rokh-bold font-bold text-xl sm:text-2xl text-foreground">
              گفتارهای منتخب اساتید
            </h2>
            <p className="font-doran text-xs sm:text-sm text-muted-foreground mt-0.5">دروس و تدبّرهای علامه طباطبایی، دکتر شمالی و دیگر مفسران</p>
          </div>
        </div>
        <Link to="/talks" className="inline-flex items-center gap-1.5 font-ui text-xs sm:text-sm font-semibold text-primary hover:underline">
          همه گفتارها <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : talks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {talks.map((talk) => (
            <Link
              key={talk.id}
              to={`/verse/${talk.verse_key.replace(":", "/")}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-card-hover transition-all duration-200"
            >
              {/* Thumbnail with Persian Art Tone */}
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#063326] to-[#041a14] flex items-center justify-center border-b border-border/60">
                <div className="h-12 w-12 rounded-full bg-white/95 text-emerald-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-7 w-7" />
                </div>
                {talk.duration && (
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/75 text-white font-ui text-xs font-medium backdrop-blur-xs">
                    <Clock className="h-3 w-3 text-accent" />
                    {talk.duration}
                  </div>
                )}
                {talk.verse_key && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-card/90 text-foreground font-ui text-xs font-semibold border border-border">
                    <BookOpen className="h-3 w-3 text-primary" />
                    آیه {talk.verse_key}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-rokh-bold font-bold text-base leading-snug mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {talk.title || "گفتار قرآنی"}
                  </h3>
                  {talk.scholar && (
                    <div className="font-ui text-xs font-medium text-accent flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {talk.scholar}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between font-ui text-xs text-muted-foreground">
                  <span>مشاهده ویدیو و تحلیل آیه</span>
                  <ArrowLeft className="h-3.5 w-3.5 text-primary group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-card">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-doran text-sm text-muted-foreground mb-4">گفتارهای جدید اساتید به‌زودی بارگذاری خواهند شد.</p>
          <Link to="/quran" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-ui text-xs font-bold hover:opacity-90 transition-opacity">
            مرور مصحف شریف
          </Link>
        </div>
      )}
    </section>
  );
}
