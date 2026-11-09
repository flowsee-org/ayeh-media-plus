'use client';
import { useEffect, useState } from "react";
import api from "@/lib/api";
import CompetitionCard from "@/components/community/CompetitionCard";
import Leaderboard from "@/components/community/Leaderboard";
import FeaturedPrize from "@/components/community/FeaturedPrize";
import { Trophy, Loader2, Award } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "active", label: "در حال برگزاری" },
  { id: "voting", label: "رأی‌گیری" },
  { id: "upcoming", label: "به‌زودی" },
  { id: "completed", label: "پایان‌یافته" },
];

export default function Competitions() {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    api.entities.Competition.list("-created_date", 50)
      .then(setComps)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === "all" ? comps : comps.filter((c) => c.status === filter);
  const featured = comps.find((c) => c.status === "active") || comps.find((c) => c.status === "voting");

  return (
    <PullToRefresh onRefresh={load}>
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in font-ui">
      {/* Clean UI Kit Header */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary border border-border text-foreground text-xs font-bold mb-3">
          <Trophy className="h-3.5 w-3.5 text-accent" /> مسابقات و پویش‌های قرآنی
        </div>
        <h1 className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
          مسابقات، تلاوت و جوایز نفیس
        </h1>
        <p className="font-doran text-muted-foreground text-sm max-w-lg mx-auto">
          در پویش‌های تعاملی تلاوت، تدبّر، خوشنویسی و بازآفرینی هنری شرکت کنید و از جوایز معنوی و نفیس بهره‌مند شوید
        </p>
      </div>

      <FeaturedPrize comp={featured} />

      <Leaderboard />

      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.id ? "bg-accent text-accent-foreground shadow-soft" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => <CompetitionCard key={c.id} comp={c} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">مسابقه‌ای در این دسته موجود نیست.</p>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}