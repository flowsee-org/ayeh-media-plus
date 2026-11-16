// Premium Islamic decorative components for the Quran Tadabbur platform

/* ── Eight-pointed Islamic star (Khatam) ── */
export function IslamicStar({ className = "", size = 40, strokeWidth = 1 }) {
 return (
 <svg
 width={size}
 height={size}
 viewBox="0 0 100 100"
 className={className}
 fill="none"
 stroke="currentColor"
 strokeWidth={strokeWidth}
 >
 {/* Outer 8-pointed star */}
 <path d="M50 5 L61 18 L78 15 L72 32 L88 39 L72 50 L88 61 L72 68 L78 85 L61 82 L50 95 L39 82 L22 85 L28 68 L12 61 L28 50 L12 39 L28 32 L22 15 L39 18 Z" />
 {/* Inner circle */}
 <circle cx="50" cy="50" r="15" />
 {/* Inner 8-pointed star */}
 <path d="M50 38 L54 44 L61 42 L58 49 L65 52 L58 55 L61 62 L54 60 L50 66 L46 60 L39 62 L42 55 L35 52 L42 49 L39 42 L46 44 Z" />
 </svg>
 );
}

/* ── Arabesque corner decoration ── */
export function ArabesqueCorner({ className = "", position = "tr" }) {
 const positions = {
 tr: "top-0 right-0",
 tl: "top-0 left-0 rotate-90",
 br: "bottom-0 right-0 -rotate-90",
 bl: "bottom-0 left-0 rotate-180",
 };
 return (
 <svg
 width="60"
 height="60"
 viewBox="0 0 60 60"
 className={`absolute ${positions[position]} ${className}`}
 fill="none"
 stroke="currentColor"
 strokeWidth="0.8"
 >
 <path d="M0 0 L60 0 L60 60" />
 <path d="M55 5 Q35 5 35 25 Q35 45 55 45" />
 <path d="M50 10 Q40 10 40 22 Q40 34 50 34" />
 <circle cx="47" cy="19" r="2" fill="currentColor" stroke="none" />
 <path d="M5 55 L5 35 Q5 20 20 20" />
 </svg>
 );
}

/* ── Islamic decorative border frame ── */
export function IslamicBorder({ children, className = "" }) {
 return (
 <div className={`relative ${className}`}>
 <ArabesqueCorner className="text-accent/30" position="tr" />
 <ArabesqueCorner className="text-accent/30" position="tl" />
 <ArabesqueCorner className="text-accent/30" position="br" />
 <ArabesqueCorner className="text-accent/30" position="bl" />
 <div className="relative">{children}</div>
 </div>
 );
}

/* ── Mosque arch shape (for headers) ── */
export function MosqueArch({ className = "", height = 120 }) {
 return (
 <svg
 width="100%"
 height={height}
 viewBox="0 0 400 120"
 className={className}
 fill="none"
 preserveAspectRatio="none"
 >
 <path
 d="M0 120 L0 60 Q0 20 40 20 Q80 20 80 50 Q80 0 200 0 Q320 0 320 50 Q320 20 360 20 Q400 20 400 60 L400 120 Z"
 fill="currentColor"
 />
 </svg>
 );
}

/* ── Bismillah calligraphic decoration ── */
export function Bismillah({ className = "" }) {
 return (
 <div className={`flex flex-col items-center ${className}`}>
 <div className=" text-3xl text-accent/80" dir="rtl" lang="ar">
 بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
 </div>
 <div className="flex items-center gap-2 mt-2">
 <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
 <IslamicStar size={12} className="text-accent/50" />
 <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
 </div>
 </div>
 );
}

/* ── Section ornament (small divider with star) ── */
export function SectionOrnament({ className = "" }) {
 return (
 <div className={`flex items-center justify-center gap-3 ${className}`}>
 <div className="h-px w-16 bg-gradient-to-r from-transparent via-border to-border" />
 <IslamicStar size={14} className="text-accent/40" />
 <div className="h-px w-16 bg-gradient-to-l from-transparent via-border to-border" />
 </div>
 );
}

/* ── Decorative number badge (for verse numbers, juz numbers) ── */
export function IslamicNumberBadge({ number, size = 44, className = "" }) {
 return (
 <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
 <svg width={size} height={size} viewBox="0 0 44 44" className="text-accent/30 group-hover:text-accent/50 transition-colors">
 <path
 d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z"
 fill="none"
 stroke="currentColor"
 strokeWidth="1"
 />
 </svg>
 <span
 className="absolute inset-0 flex items-center justify-center font-bold text-accent"
 style={{ fontSize: size * 0.28 }}
 >
 {number}
 </span>
 </div>
 );
}