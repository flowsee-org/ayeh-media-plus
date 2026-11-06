'use client';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, BookOpen, Loader2, Radio, ChevronLeft } from "lucide-react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FollowButton from "@/components/live/FollowButton";
import { parseAvatar } from "@/lib/avatars";

export default function Scholars() {
  const [scholars, setScholars] = useState([]);
  const [liveScholars, setLiveScholars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Scholar.list("-created_date", 50).catch(() => []),
      base44.entities.LiveSession.list("-created_date", 100).catch(() => []),
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      {/* Clean UI Kit Header with Persian architecture ambiance */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="/images/art/chehel_sotoun_gold_vault.webp"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.20] dark:brightness-[0.14] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-card/85 via-card/75 to-card/95 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-ui text-xs font-semibold mb-3">
            <Users className="h-3.5 w-3.5" /> اساتید و مفسران کلام‌الله
          </div>
          <h1 className="font-kalameh font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
            علما و مفسران قرآن کریم
          </h1>
          <p className="font-yekan text-muted-foreground text-sm max-w-lg mx-auto">
            سیری در آرا و تدبّرهای مفسران بزرگ جهان اسلام و اساتید معاصر
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : (
        <>
          {/* Live scholars on the platform */}
          {liveScholars.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <Radio className="h-5 w-5 text-red-500" /> اساتید پخش زنده
                </h2>
                <span className="text-xs text-muted-foreground">فقط دنبال‌کرده‌ها را می‌بینید</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveScholars.map((s) => {
                  const cfg = parseAvatar(s.avatar);
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-accent/15 bg-card/50 p-4 hover:border-accent/30 hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {cfg ? (
                          <CharacterAvatar config={cfg} size={52} />
                        ) : (
                          <div className="h-[52px] w-[52px] rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent shrink-0">
                            {s.name?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-semibold text-sm truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.sessions.toLocaleString("fa-IR")} جلسه
                            {s.live && (
                              <span className="inline-flex items-center gap-1 mr-2 text-red-600 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> زنده
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <FollowButton scholarId={s.id} scholarName={s.name} />
                        <Link
                          to={`/scholars/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mr-auto"
                        >
                          پروفایل <ChevronLeft className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Historical scholars */}
          <section>
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> مفسران و دانشمندان
            </h2>
            {scholars.length === 0 ? (
              <div className="rounded-xl border border-dashed border-accent/15 p-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">هنوز پروفایل عالمی ثبت نشده است.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {scholars.map((s, i) => (
                  <div key={s.id} className="group rounded-2xl border border-accent/10 bg-card/40 p-4 sm:p-6 hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate flex flex-col justify-between" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div>
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg shadow-soft shrink-0">
                          {s.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/scholars/${s.id}`} className="font-display font-semibold text-[15px] hover:text-accent transition-colors block">
                            {s.name}
                          </Link>
                          {s.name_arabic && <div className="font-arabic text-sm text-muted-foreground mt-0.5" dir="rtl">{s.name_arabic}</div>}
                          {s.title && <div className="text-xs text-muted-foreground mt-1">{s.title}{s.birth_year ? ` · ${s.birth_year}${s.death_year ? `–${s.death_year}` : ""}` : ""}</div>}
                        </div>
                      </div>
                      {s.bio && <p className="text-sm text-muted-foreground line-clamp-3 mt-4 leading-relaxed">{s.bio}</p>}
                      {s.specialization && <div className="mt-4 text-xs text-accent font-medium">{s.specialization}</div>}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      {s.books?.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" /> {s.books.length} اثر
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-2">
                        <FollowButton scholarId={s.id} scholarName={s.name} />
                        <Link
                          to={`/scholars/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                        >
                          پروفایل <ChevronLeft className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}