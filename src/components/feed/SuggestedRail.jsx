import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { BookOpen, Compass, Users, ArrowLeft } from "lucide-react";

/** Instagram-style right rail: suggestions, scholars and a daily verse. */
export default function SuggestedRail() {
  const [collections, setCollections] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    api.entities.Collection
      .list({ sort: "-created_date", limit: 4 })
      .then((r) => setCollections(r.items || []))
      .catch(() => {});
    api.entities.Scholar
      .list({ sort: "name", limit: 5 })
      .then((r) => setScholars(r.items || []))
      .catch(() => {});
    api.entities.Verse
      .list({ sort: "-created_date", limit: 10 })
      .then((r) => setVerse((r.items || [])[0] || null))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {verse && (
        <Link
          to={`/verse/${String(verse.verse_key).replace(":", "/")}`}
          className="block rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-accent/30"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
              <BookOpen className="h-3.5 w-3.5" /> آیه امروز
            </span>
            <span className="text-xs text-muted-foreground">{verse.verse_key}</span>
          </div>
          <p className="font-arabic text-right text-xl leading-loose text-foreground/85" dir="rtl" lang="ar">
            {verse.arabic}
          </p>
          <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            «{verse.translation}»
          </p>
        </Link>
      )}

      {collections.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Compass className="h-3.5 w-3.5" /> مجموعه‌های پیشنهادی
            </span>
            <Link to="/collections" className="text-xs text-accent hover:underline">همه</Link>
          </div>
          <div className="space-y-1">
            {collections.map((c) => (
              <Link
                key={c.id}
                to={`/collections/${c.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: `${c.theme_color || "#c5a059"}1f`,
                    color: c.theme_color || "#c5a059",
                  }}
                >
                  {c.verse_count || 0}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.verse_count || 0} آیه
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {scholars.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> اساتید
            </span>
            <Link to="/scholars" className="text-xs text-accent hover:underline">همه</Link>
          </div>
          <div className="space-y-1">
            {scholars.map((s) => (
              <Link
                key={s.id}
                to={`/scholars/${s.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(s.name || "؟").charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.title || "استاد"}</span>
                </span>
                <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}