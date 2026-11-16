'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Play, Clock, Trophy, Users, Mic } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from 'next/navigation';

export default function HeroSlider({ competitions, liveVideos }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [interval, setInterval] = useState(null);

  // Combine competitions and live videos as hero items
  const heroItems = [
    ...(competitions || []).slice(0, 3),
    ...(liveVideos || []).slice(0, 2),
  ];

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroItems.length);
    }, 5000);
    setInterval(id);
    return () => clearInterval(id);
  }, [heroItems.length]);

  const item = heroItems[activeIndex];
  if (!item) return null;

  const title = item.title || item.name || "مسابقه قرآنی";
  const description = item.description || item.content || "";
  const imageUrl = item.image_url || item.media_url || item.cover_image || null;
  const isLive = item.is_live || item.live || false;
  const isCompetition = item.is_competition || item.competition || false;
  const duration = item.duration || "";

  return (
    <section className="relative overflow-hidden rounded section-space-sm">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-quranic-mesh-dark opacity-70" />
      <div className="absolute inset-0 from-black/50 via-black/30 to-black/10" />

      {/* Animated hero content */}
      <AnimatePresence>
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 container-quranic px-4 sm:px-6 lg:px-8 h-64 md:h-80 lg:h-96 flex flex-col lg:flex-row"
        >
          {/* Left: Content */}
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-12">
            <div className="flex items-center gap-2 mb-4">
              {isLive && (
                <div className="h-2.5 w-2.5 rounded bg-quranic-saffron animate-[live-pulse_1.5s_infinite]" />
              )}
              <span className="font-rokh-bold font-bold text-xs sm:text-sm text-quranic-saffron tracking-wider uppercase">
                {isLive ? "مسابقه قرآنی زنده" : "آیینه پرور قرآنی"}
              </span>
              {item.competition_year || item.year && (
                <span className="px-2 py-0.5 rounded bg-quranic-emerald/20 text-quranic-emerald text-[10px] font-bold border border-quranic-emerald/30">
                  {item.competition_year || item.year}
                </span>
              )}
            </div>

            <h1 className="font-rokh-bold font-black text-xl sm:text-2xl lg:text-4xl text-white leading-tight mb-4">
              {title}
            </h1>

            <p className="font-doran text-sm sm:text-base text-emerald-100/90 mb-6 leading-relaxed max-w-xl">
              {description}
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              {item.date && (
                <span className="px-3 py-1.5 rounded bg-white/10 text-white text-xs font-medium border border-white/20 backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1.5" />
                  {item.date}
                </span>
              )}
              {item.venue && (
                <span className="px-3 py-1.5 rounded bg-white/10 text-white text-xs font-medium border border-white/20 backdrop-blur-sm">
                  <Users className="h-3 w-3 mr-1.5" />
                  {item.venue}
                </span>
              )}
              {isLive && (
                <span className="px-3 py-1.5 rounded bg-quranic-saffron text-quranic-ink text-xs font-bold">
                  <Mic className="h-3 w-3 mr-1.5" />
                  زنده
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (item.id) {
                    router.push(isCompetition ? `/competition/${item.id}` : `/watch/${item.id}`);
                  }
                }}
                className="flex-1 px-6 py-3 rounded bg-white text-quranic-ink font-rokh-bold font-bold text-sm hover:bg-quranic-saffron hover:text-quranic-ink transition-all shadow-live-glow"
              >
                مشاهده ویدیو
              </button>
              <Link
                href="/competitions"
                className="px-6 py-3 rounded border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                مشاهده همه مسابقات
              </Link>
            </div>
          </div>

          {/* Right: Live Thumbnail */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="relative h-full rounded overflow-hidden border-2 border-white/20 shadow-2xl group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-quranic-emerald/30 to-quranic-turquoise/20 flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="h-12 w-12 text-quranic-saffron/50 mx-auto mb-3" />
                    <span className="text-white/70 text-sm font-doran">تصاویر زنده</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm border border-white/20">
                <Clock className="h-3 w-3 text-quranic-saffron" />
                <span>زنده</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-20 w-20 rounded bg-quranic-saffron/95 backdrop-blur-md flex items-center justify-center text-quranic-ink shadow-xl transform group-hover:scale-110 transition-transform">
                  <Play className="h-10 w-10 ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {heroItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2.5 h-2.5 rounded transition-all ${
                  activeIndex === i
                    ? "bg-quranic-saffron shadow-saffron-glow"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
