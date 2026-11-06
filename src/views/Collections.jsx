'use client';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { CollectionCover, SectionOrnament } from "@/components/IslamicDecorations";
import { Bookmark, Share2, Clock, BookOpen, Loader2, FolderHeart } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("saved-collections") || "[]"));

  const toggleSave = (id) => {
    const isSaved = saved.includes(id);
    const updated = isSaved ? saved.filter(s => s !== id) : [...saved, id];
    setSaved(updated);
    localStorage.setItem("saved-collections", JSON.stringify(updated));
    toast.success(!isSaved ? "مجموعه به نشان‌شده‌ها اضافه شد" : "مجموعه از نشان‌شده‌ها حذف شد");
  };

  const loadCollections = () => {
    base44.entities.Collection.list("-created_date", 100)
      .then(setCollections)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const featured = collections.filter(c => c.is_featured);
  const regular = collections.filter(c => !c.is_featured);

  return (
    <PullToRefresh onRefresh={loadCollections}>
    <div className="animate-fade-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ── Clean UI Kit Header ── */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary border border-border text-foreground font-ui text-xs font-semibold mb-3">
          <FolderHeart className="h-3.5 w-3.5 text-primary" /> مجموعه‌های برگزیده و موضوعی
        </div>
        <h1 className="font-kalameh font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
          مجموعه‌های مطالعاتی قرآن
        </h1>
        <p className="font-yekan text-muted-foreground text-sm max-w-lg mx-auto">
          سفرهای موضوعی در آیات قرآن کریم — هر مجموعه، مسیری هدفمند برای تدبّر و تأمّل
        </p>
      </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : collections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-accent/15 p-12 text-center">
            <FolderHeart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">هنوز مجموعه‌ای وجود ندارد.</p>
          </div>
        ) : (
          <>
            {/* Featured Collections */}
            {featured.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <Bookmark className="h-4 w-4" />
                  </div>
                  <h2 className="font-display font-bold text-xl">مجموعه‌های ویژه</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((c, i) => (
                    <CollectionCard key={c.id} collection={c} saved={saved.includes(c.id)} onToggleSave={() => toggleSave(c.id)} delay={i * 0.06} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All Collections */}
            <div>
              {featured.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h2 className="font-display font-bold text-xl">همه مجموعه‌ها</h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {regular.map((c, i) => (
                  <CollectionCard key={c.id} collection={c} saved={saved.includes(c.id)} onToggleSave={() => toggleSave(c.id)} delay={i * 0.04} />
                ))}
              </div>
            </div>

            <SectionOrnament className="mt-12" />
          </>
        )}
      </div>
    </PullToRefresh>
  );
}

function CollectionCard({ collection, saved, onToggleSave, delay = 0, featured = false }) {
  const color = collection.theme_color || "#0B6E4F";
  const pattern = collection.cover_pattern || "stars";

  return (
    <Link
      to={`/collections/${collection.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-accent/20 bg-card/85 backdrop-blur-md overflow-hidden hover:border-accent/40 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Cover */}
      <div className={`relative ${featured ? "h-36" : "h-28"} overflow-hidden`}>
        <CollectionCover color={color} pattern={pattern} />
        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleSave(); }}
          className={`absolute top-3 right-3 h-11 w-11 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
            saved ? "bg-accent/90 text-accent-foreground" : "bg-card/60 text-muted-foreground hover:text-accent"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
        {/* Share button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = `${window.location.origin}/collections/${collection.id}`;
            const text = `${collection.name}\n${collection.description || ""}\n${url}`;
            if (navigator.share) {
              try {
                await navigator.share({ title: collection.name, text, url });
                return;
              } catch {}
            }
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
              } else {
                const ta = document.createElement("textarea");
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
              }
              toast.success("پیوند مجموعه در حافظه رونوشت شد");
            } catch {
              toast.error("امکان اشتراک‌گذاری فراهم نشد");
            }
          }}
          className="absolute top-3 left-3 h-11 w-11 rounded-full bg-card/60 text-muted-foreground hover:text-accent flex items-center justify-center backdrop-blur-sm transition-all"
          title="اشتراک‌گذاری مجموعه"
        >
          <Share2 className="h-4 w-4" />
        </button>
        {/* Verse count badge */}
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/60 text-xs font-medium backdrop-blur-sm">
          <BookOpen className="h-3 w-3" style={{ color }} />
          {collection.verse_count || collection.verse_keys?.length || 0} آیه
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-[15px] leading-snug">{collection.name}</h3>
          {collection.reading_time ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {collection.reading_time} دقیقه
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{collection.description}</p>

        {/* Related topics */}
        {collection.related_topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {collection.related_topics.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${color}15`, color }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}