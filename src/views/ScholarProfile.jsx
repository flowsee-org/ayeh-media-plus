'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import CharacterAvatar from "@/components/CharacterAvatar";
import FollowButton from "@/components/live/FollowButton";
import BackButton from "@/components/BackButton";
import { parseAvatar } from "@/lib/avatars";
import { Radio, Video, Loader2, CalendarDays, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const faDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
};

export default function ScholarProfile() {
  const { id } = useParams();
  const [scholar, setScholar] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const current = await api.auth.me().catch(() => null);

      const [res, scholarEntity] = await Promise.all([
        api.entities.LiveSession
          .filter({ scholar_id: id }, { sort: "-created_date", limit: 100 })
          .catch(() => ({ items: [] })),
        api.entities.Scholar.get(id).catch(() => null),
      ]);
      setSessions(res.items || []);
      setScholar(scholarEntity);

      if (current?.id && current.id !== id) {
        const f = await api.entities.Follow
          .filter({ follower_id: current.id, followed_id: id })
          .catch(() => ({ items: [] }));
        setFollowed((f.items || []).length > 0);
      } else {
        setFollowed(!!current?.id);
      }
      setLoading(false);
    })();
  }, [id]);

  const latest = sessions[0];
  const live = sessions.find((s) => s.status === "live");
  const past = sessions.filter((s) => s.status === "ended");
  const name = scholar?.name || latest?.scholar_name || "استاد مفسر";
  const avatarCfg = parseAvatar(scholar?.avatar_url || latest?.scholar_avatar);

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 animate-fade-in">
      <BackButton to="/scholars" label="علما" className="mb-4" />

      {/* Identity card */}
      <Card className="rounded border border-accent/15 bg-card shadow-premium">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {avatarCfg ? (
              <CharacterAvatar config={avatarCfg} size={72} />
            ) : (
              <div className="h-[72px] w-[72px] rounded bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-2xl text-accent shrink-0">
                {name?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">{name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {sessions.length.toLocaleString("fa-IR")} جلسه منتشرشده
              </p>
              {live && (
                <Badge variant="destructive" size="sm" className="mt-2 inline-flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded bg-red-500 animate-pulse" />
                  در حال پخش زنده
                </Badge>
              )}
            </div>
            <FollowButton scholarId={id} scholarName={name} onChange={setFollowed} />
          </div>

          {live && (
            <Card className="mt-5 rounded border border-red-500/25 bg-red-500/[0.06] hover:bg-red-500/10 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="h-10 w-10 rounded bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{live.title}</div>
                  <div className="text-xs text-muted-foreground">همین حالا وارد پخش زنده شوید</div>
                </div>
                <Link
                  href={`/live/${live.id}`}
                  className="ml-auto text-xs font-bold text-red-600 hover:underline"
                >
                  وارد جلسه →
                </Link>
              </CardContent>
            </Card>
          )}

          {scholar?.title && (
            <div className="mt-4 text-xs text-accent font-medium">{scholar.title}</div>
          )}
          {scholar?.bio && (
            <CardDescription className="mt-3 text-sm text-foreground/80 leading-relaxed">
              {scholar.bio}
            </CardDescription>
          )}
          {scholar?.specialization && (
            <div className="mt-2 text-xs text-muted-foreground">تخصص: {scholar.specialization}</div>
          )}
          {scholar?.books?.length > 0 && (
            <Card className="mt-4 rounded border border-border/50">
              <CardHeader className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-accent" />
                <CardTitle className="text-xs font-bold">آثار و تألیفات ({scholar.books.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {scholar.books.map((b, i) => (
                    <Badge key={i} variant="secondary" size="sm">
                      {b}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Archive */}
      <div className="mt-8">
        <h2 className="font-rokh-bold font-bold text-lg mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-accent" /> آرشیو جلسات
        </h2>

        {!followed ? (
          <Card className="rounded border border-dashed border-accent/20 bg-accent/[0.03] p-10 text-center">
            <CardContent>
              <CalendarDays className="h-7 w-7 text-accent/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                آرشیو جلسات فقط برای دنبال‌کنندگان این استاد در دسترس است.
              </p>
              <FollowButton scholarId={id} scholarName={name} onChange={setFollowed} />
            </CardContent>
          </Card>
        ) : past.length === 0 ? (
          <Card className="rounded border border-dashed border-border/60 p-10 text-center">
            <CardContent>
              <Video className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">هنوز جلسه‌ای در آرشیو نیست.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {past.map((s) => (
              <Card
                key={s.id}
                className="rounded border border-accent/10 bg-card/40 p-4 flex items-start gap-3"
              >
                <span className="h-10 w-10 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{s.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground/80">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {faDate(s.created_date)}
                    </span>
                    {s.verse_key && (
                      <Link href={`/verse/${s.verse_key.replace(":", "/")}`} className="inline-flex items-center gap-1 hover:text-accent">
                        <BookOpen className="h-3 w-3" /> آیه {s.verse_key}
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
