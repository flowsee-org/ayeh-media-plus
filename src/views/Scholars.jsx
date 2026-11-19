'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Users, Loader2, Radio, ChevronLeft } from "lucide-react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FollowButton from "@/components/live/FollowButton";
import ScholarCard from "@/components/ui/scholar-card";
import EmptyState from "@/components/ui/empty-state";
import { parseAvatar } from "@/lib/avatars";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Scholars() {
  const [scholars, setScholars] = useState([]);
  const [liveScholars, setLiveScholars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.entities.Scholar.list("-created_date", 50).catch(() => []),
      api.entities.LiveSession.list("-created_date", 100).catch(() => []),
    ]).then(([historical, sessions]) => {
      setScholars(historical);
      const map = new Map();
      (sessions || []).forEach((s) => {
        if (!s.scholar_id) return;
        if (!map.has(s.scholar_id)) {
          map.set(s.scholar_id, {
            id: s.scholar_id,
            name: s.scholar_name,
            avatar: s.scholar_avatar,
            live: s.status === "live",
            sessions: 0,
          });
        }
        const entry = map.get(s.scholar_id);
        entry.sessions += 1;
        if (s.status === "live") entry.live = true;
      });
      setLiveScholars([...map.values()]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page-shell animate-fade-in font-doran space-y-8">
      <Card className="rounded border border-border bg-card p-6 sm:p-10 text-center shadow-soft">
        <CardContent className="p-0 pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary border border-border text-foreground font-ui text-xs font-semibold mb-3">
            <Users className="h-3.5 w-3.5 text-primary" /> اساتید و مفسران کلام‌الله
          </div>
          <h1 className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
            علما و مفسران قرآن کریم
          </h1>
          <p className="font-editorial text-muted-foreground text-sm max-w-lg mx-auto">
            سیری در آرا و تدبّرهای مفسران بزرگ جهان اسلام و اساتید معاصر
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {liveScholars.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-rokh-bold font-bold text-lg flex items-center gap-2">
                  <Radio className="h-5 w-5 text-red-500" /> اساتید پخش زنده
                </h2>
                <span className="text-xs text-muted-foreground">فقط دنبال‌کرده‌ها را می‌بینید</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveScholars.map((s) => {
                  const cfg = parseAvatar(s.avatar);
                  return (
                    <Card
                      key={s.id}
                      className="rounded border border-border bg-card p-4 hover:border-primary/30 hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {cfg ? (
                          <CharacterAvatar config={cfg} size={52} />
                        ) : (
                          <div className="h-[52px] w-[52px] rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                            {s.name?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-rokh-bold font-semibold text-sm truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.sessions.toLocaleString("fa-IR")} جلسه
                            {s.live && (
                              <Badge variant="destructive" size="sm" className="ml-2 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded bg-red-500 animate-pulse" />
                                زنده
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <FollowButton scholarId={s.id} scholarName={s.name} />
                        <Link
                          href={`/scholars/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mr-auto"
                        >
                          پروفایل <ChevronLeft className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-rokh-bold font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> مفسران و دانشمندان
            </h2>
            {scholars.length === 0 ? (
              <EmptyState
                type="general"
                icon={Users}
                title="هنوز پروفایل عالمی ثبت نشده است"
                subtitle="به‌زودی پروفایل اساتید و مفسران در این بخش نمایش داده می‌شود."
                showAction={false}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {scholars.map((s) => (
                  <ScholarCard key={s.id} item={s} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
