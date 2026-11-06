import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Sparkles,
  Video,
  ArrowLeft,
  ArrowUpRight,
  Flame,
  Palette,
} from "lucide-react";
import { PERSIAN_ART_IMAGES, OrsiLightBeams } from "@/lib/persianArtSystem";

const quickCards = [
  {
    to: "/quran",
    title: "مصحف شریف",
    desc: "متن کامل ۱۱۴ سوره و ۳۰ جزء به همراه تلاوت ترتیل اساتید",
    icon: BookOpen,
    badge: "مصحف و تلاوت",
    tagColor: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60",
  },
  {
    to: "/studio",
    title: "استودیوی کارت آیه",
    desc: "طراحی کارت‌های هنری و استوری‌های تذهیب با شاهکارهای معماری ایرانی",
    icon: Palette,
    badge: "هنر و رسانه",
    tagColor: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60",
  },
  {
    to: "/guide",
    title: "آیه‌ی راه",
    desc: "جستجوی هوشمند آیه متناسب با دغدغه، احساس و حال روحی شما",
    icon: Sparkles,
    badge: "دستیار تدبّر",
    tagColor: "text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/60 border-teal-200 dark:border-teal-900/60",
  },
  {
    to: "/talks",
    title: "گفتارهای اساتید",
    desc: "درس‌گفتارها و تحلیل‌های تفسیری علامه طباطبایی، دکتر شمالی و دیگر مفسران",
    icon: Video,
    badge: "چندرسانه‌ای",
    tagColor: "text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-950/60 border-yellow-200 dark:border-yellow-900/60",
  },
];

const trendingTopics = [
  { label: "صبر و آرامش", q: "صبر" },
  { label: "توکل و امید", q: "توکل" },
  { label: "شکرگزاری", q: "شکر" },
  { label: "احسان به والدین", q: "والدین" },
  { label: "هدایت در سختی", q: "هدایت" },
];

export default function Hero({ dailyVerse }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTopicClick = (q) => {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-border/70 pt-8 pb-14 sm:pb-24">
      {/* 1. Authentic Nasir al-Mulk Sanctuary Panoramic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={PERSIAN_ART_IMAGES.sanctuaryPanorama}
          alt="تالار شیشه‌های رنگی ارسی و فرش دستباف ایرانی"
          className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.08] dark:brightness-[0.28] scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Multilayered artistic Persian gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#031510]/85 via-background/80 to-background backdrop-blur-[2px]" />
        <div className="absolute inset-0 orsi-rainbow-sheen opacity-40 mix-blend-color-dodge pointer-events-none" />
      </div>

      {/* Atmospheric Orsi Light Beams */}
      <OrsiLightBeams className="opacity-45 z-0" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Sacred Bismillah */}
        <p
          className="font-arabic text-2xl sm:text-3xl text-amber-300/90 drop-shadow-md mb-3 tracking-wide"
          dir="rtl"
          lang="ar"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        {/* Platform badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-black/40 backdrop-blur-md text-amber-200 text-xs font-ui font-medium mb-5 shadow-lg shadow-black/20">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>سامانه چندرسانه‌ای و شبکه تدبّر در قرآن کریم</span>
        </div>

        {/* Main Display Headline (Kalameh) */}
        <h1 className="font-kalameh font-black tracking-tight text-3xl sm:text-5xl lg:text-6xl leading-[1.25] text-white drop-shadow-lg mb-4">
          روشنای حکمت و تدبّر در <span className="text-amber-400 drop-shadow-md">کتاب مبین</span>
        </h1>

        {/* Subtitle (Yekan Bakh) */}
        <p className="font-yekan max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/90 drop-shadow leading-relaxed mb-8">
          مرجع جامع تلاوت‌های فاخر، تفاسیر متقن اساتید و تأملات قرآنی در محیطی هنری، آراسته به معماری اصیل ایرانی-اسلامی.
        </p>

        {/* Professional Search Box (Peyda UI) */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-5">
          <div className="relative flex items-center rounded-2xl border border-amber-400/30 bg-card/90 dark:bg-black/60 shadow-2xl backdrop-blur-xl hover:border-amber-400/60 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 transition-all p-1.5 sm:p-2">
            <Search className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در متن آیات، ترجمه، موضوعات (مثل صبر، توکل، احسان)..."
              className="flex-1 bg-transparent text-sm sm:text-base font-ui text-foreground placeholder:text-muted-foreground/70 focus:outline-none px-1"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white font-ui font-bold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap active:scale-95"
            >
              جستجو در قرآن
            </button>
          </div>
        </form>

        {/* Trending Quick Topic Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <span className="inline-flex items-center gap-1 text-xs font-ui text-amber-200/90 ml-1">
            <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> موضوعات پرکاربرد:
          </span>
          {trendingTopics.map((t) => (
            <button
              key={t.q}
              onClick={() => handleTopicClick(t.q)}
              className="px-3 py-1 rounded-xl text-xs font-ui font-medium bg-black/40 hover:bg-black/60 text-white border border-amber-400/20 backdrop-blur-md transition-all hover:border-amber-400/50"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 4 Gateway Cards — Orsi Glass Surface */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right mb-10">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-card/90 dark:bg-card/75 border border-border/80 hover:border-amber-400/50 hover:shadow-2xl transition-all duration-300 backdrop-blur-lg hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-[11px] font-ui font-bold px-2.5 py-0.5 rounded-full border ${card.tagColor}`}>
                      {card.badge}
                    </span>
                    <div className="h-9 w-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <h3 className="font-kalameh font-bold text-lg text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="font-yekan text-xs text-muted-foreground leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs font-ui font-semibold text-primary">
                  <span>ورود به بخش</span>
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Daily Verse Card — Illuminated Persian Katibeh Card */}
        {dailyVerse && (
          <div className="max-w-3xl mx-auto rounded-3xl border border-amber-400/30 bg-card/95 dark:bg-black/60 p-6 sm:p-8 text-right shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Subtle corner light sheen */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 mb-4 border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-kalameh text-xs font-bold text-foreground">
                  آیه برگزیده و تدبّر امروز
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/studio?verse_key=${dailyVerse.verse_key || "24:35"}`}
                  className="inline-flex items-center gap-1 font-ui text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>طراحی کارت</span>
                </Link>
                <Link
                  to={dailyVerse.verse_key ? `/verse/${dailyVerse.verse_key.replace(":", "/")}` : "/quran"}
                  className="inline-flex items-center gap-1 font-ui text-xs font-medium text-primary hover:underline"
                >
                  <span>مشاهده تفسیر</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <p
              className="font-arabic text-xl sm:text-2xl text-foreground font-semibold leading-[2.4] mb-3 select-text"
              dir="rtl"
              lang="ar"
            >
              {dailyVerse.arabic || dailyVerse.arabic_text || dailyVerse.text}
            </p>

            {dailyVerse.translation && (
              <p className="font-yekan text-sm sm:text-base text-muted-foreground leading-loose">
                «{dailyVerse.translation}»
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
