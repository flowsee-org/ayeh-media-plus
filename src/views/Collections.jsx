'use client';
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { SectionOrnament } from "@/components/IslamicDecorations";
import { Bookmark, Share2, BookOpen, Loader2, FolderHeart } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import { scopedKey } from "@/lib/storageScope";
import CollectionCard from "@/components/ui/collection-card";
import EmptyState from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(scopedKey("saved-collections"));
      if (stored) setSaved(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleSave = (id) => {
    const isSaved = saved.includes(id);
    const updated = isSaved ? saved.filter((s) => s !== id) : [...saved, id];
    setSaved(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(scopedKey("saved-collections"), JSON.stringify(updated));
    }
    toast.success(!isSaved ? "مجموعه به نشان‌شده‌ها اضافه شد" : "مجموعه از نشان‌شده‌ها حذف شد");
  };

  const shareCollection = async (collection) => {
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
  };

  const loadCollections = () => {
    api.entities.Collection.list("-created_date", 100)
      .then(setCollections)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCollections();
  }, []);

  return (
    <PullToRefresh onRefresh={loadCollections}>
      <div className="animate-fade-in page-shell font-doran space-y-8">
        <Card className="rounded border border-border bg-card p-6 sm:p-10 text-center shadow-soft">
          <CardContent className="p-0 pt-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-secondary border border-border text-foreground font-ui text-xs font-semibold mb-3">
              <FolderHeart className="h-3.5 w-3.5 text-primary" /> مجموعه‌های برگزیده و موضوعی
            </div>
            <h1 className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
              مجموعه‌های مطالعاتی قرآن
            </h1>
            <p className="font-editorial text-muted-foreground text-sm max-w-lg mx-auto">
              سفرهای موضوعی در آیات قرآن کریم — هر مجموعه، مسیری هدفمند برای تدبّر و تأمّل
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : collections.length === 0 ? (
          <EmptyState
            type="general"
            icon={FolderHeart}
            title="هنوز مجموعه‌ای وجود ندارد"
            subtitle="به‌زودی مجموعه‌های مطالعاتی در این بخش قرار می‌گیرند."
            showAction={false}
          />
        ) : (
          <>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h2 className="font-rokh-bold font-bold text-xl">همه مجموعه‌ها</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {collections.map((c) => {
                  const isSaved = saved.includes(c.id);
                  return (
                    <div key={c.id} className="relative group/card">
                      <CollectionCard item={c} />
                      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            shareCollection(c);
                          }}
                          className="h-10 w-10 rounded bg-card/80 text-muted-foreground hover:text-primary backdrop-blur-sm border border-border/60"
                          title="اشتراک‌گذاری مجموعه"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={isSaved ? "primary" : "ghost"}
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSave(c.id);
                          }}
                          className={`h-10 w-10 rounded flex items-center justify-center backdrop-blur-sm border transition-all ${
                            isSaved
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card/80 text-muted-foreground hover:text-primary border-border/60"
                          }`}
                          title="نشان‌گذاری مجموعه"
                        >
                          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <SectionOrnament className="mt-4" />
          </>
        )}
      </div>
    </PullToRefresh>
  );
}
