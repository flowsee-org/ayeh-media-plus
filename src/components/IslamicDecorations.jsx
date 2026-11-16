import React, { useId } from "react";

// ── Eight-pointed Islamic star (Khatam) ──
export function IslamicStar({ size = 24, className = "", strokeWidth = 1 }) {
 return (
 <svg width={size} height={size} viewBox="0 0 44 44" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" />
 <circle cx="22" cy="16" r="4" />
 </svg>
 );
}

// ── Arabesque corner ornament ──
export function CornerOrnament({ className = "", size = 60 }) {
 return (
 <svg width={size} height={size} viewBox="0 0 60 60" className={className} fill="none" stroke="currentColor" strokeWidth="1">
 <path d="M2 2 L2 20 Q2 30 12 30 Q22 30 22 20 Q22 10 32 10 L50 10" />
 <path d="M2 2 L20 2 Q30 2 30 12 Q30 22 20 22 Q10 22 10 32 L10 50" opacity="0.5" />
 <circle cx="12" cy="12" r="3" />
 <path d="M15 15 Q25 15 25 25" opacity="0.3" />
 </svg>
 );
}

// ── Repeating Islamic border (horizontal) ──
export function IslamicBorder({ className = "" }) {
 return (
 <div className={`flex items-center justify-center gap-1 ${className}`} dir="ltr">
 <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
 {[...Array(3)].map((_, i) => (
 <svg key={i} width="16" height="16" viewBox="0 0 16 16" className="text-accent/40 shrink-0">
 <path d="M8 1 L10 3 L13 3 L11 5 L14 7 L11 9 L13 11 L10 11 L8 14 L6 11 L3 11 L5 9 L2 7 L5 5 L3 3 L6 3 Z" fill="none" stroke="currentColor" strokeWidth="0.7" />
 </svg>
 ))}
 <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
 </div>
 );
}

// ── Manuscript-style decorative frame ──
export function ManuscriptFrame({ children, className = "" }) {
 return (
 <div className={`relative ${className}`}>
 {/* Corner ornaments */}
 <CornerOrnament className="absolute top-0 right-0 text-accent/20" size={40} />
 <CornerOrnament className="absolute top-0 left-0 text-accent/20 rotate-90" size={40} />
 <CornerOrnament className="absolute bottom-0 left-0 text-accent/20 rotate-180" size={40} />
 <CornerOrnament className="absolute bottom-0 right-0 text-accent/20 -rotate-90" size={40} />
 {/* Content */}
 <div className="relative">{children}</div>
 </div>
 );
}

// ── Verse end marker (star with number) ──
export function VerseMarker({ number, size = 40 }) {
 return (
 <div className="relative shrink-0" style={{ width: size, height: size }}>
 <svg width={size} height={size} viewBox="0 0 44 44" className="text-accent/25">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="1" />
 <circle cx="22" cy="16" r="3.5" fill="currentColor" opacity="0.15" />
 </svg>
 <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-accent" style={{ fontSize: size * 0.28 }}>
 {number}
 </span>
 </div>
 );
}

// ── Surah header banner ──
export function SurahHeader({ name, number, metadata, className = "" }) {
 return (
 <div className={`relative overflow-hidden rounded border border-accent/15 bg-card/60 p-8 sm:p-12 text-center shadow-premium ${className}`}>
 {/* Background pattern */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
 <defs>
 <pattern id="surah-hdr-pat" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
 <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.04">
 <path d="M20 2 L25 7 L33 7 L29 13 L37 16 L29 19 L33 25 L25 25 L20 30 L15 25 L7 25 L11 19 L3 16 L11 13 L7 7 L15 7 Z" />
 <circle cx="20" cy="16" r="3" />
 </g>
 </pattern>
 </defs>
 <rect width="100%" height="100%" fill="url(#surah-hdr-pat)" />
 </svg>
 {/* Decorative top border */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
 {/* Content */}
 <div className="relative">
 {number && <div className="text-xs tracking-[0.25em] text-muted-foreground mb-2">سوره {number}</div>}
 {name && <div className="text-6xl sm:text-7xl text-primary/80 mb-3" dir="rtl">{name}</div>}
 {metadata}
 </div>
 {/* Decorative bottom border */}
 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
 </div>
 );
}

// ── Bismillah calligraphic header ──
export function BismillahHeader({ className = "" }) {
 return (
 <div className={`flex flex-col items-center gap-3 ${className}`}>
 <div className="flex items-center gap-3 w-full">
 <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/30" />
 <svg width="20" height="20" viewBox="0 0 44 44" className="text-accent/40 shrink-0">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="1" />
 </svg>
 <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/30" />
 </div>
 <div className="text-3xl sm:text-4xl text-accent/60" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
 </div>
 );
}

// ── Section ornament with central star ──
export function SectionOrnament({ className = "" }) {
 return (
 <div className={`flex items-center justify-center gap-4 ${className}`} dir="ltr">
 <div className="h-px w-20 sm:w-32 bg-gradient-to-l from-transparent via-accent/20 to-accent/30" />
 <div className="flex items-center gap-2">
 <svg width="14" height="14" viewBox="0 0 44 44" className="text-accent/30">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
 </svg>
 <svg width="24" height="24" viewBox="0 0 44 44" className="text-accent/40">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="1" />
 <circle cx="22" cy="16" r="4" fill="currentColor" opacity="0.15" />
 </svg>
 <svg width="14" height="14" viewBox="0 0 44 44" className="text-accent/30">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
 </svg>
 </div>
 <div className="h-px w-20 sm:w-32 bg-gradient-to-r from-transparent via-accent/20 to-accent/30" />
 </div>
 );
}

// ── Islamic number badge (for juz/surah numbers) ──
export function IslamicNumberBadge({ number, className = "", size = 44 }) {
 return (
 <div className={`relative ${className}`} style={{ width: size, height: size }}>
 <svg width={size} height={size} viewBox="0 0 44 44" className="text-accent/30">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="1" />
 </svg>
 <span className="absolute inset-0 flex items-center justify-center font-bold text-accent" style={{ fontSize: size * 0.3 }}>
 {number}
 </span>
 </div>
 );
}

// ── Collection cover background (SVG pattern with color theme) ──
export function CollectionCover({ color = "#c5a059", pattern = "stars", className = "" }) {
 const uid = useId().replace(/:/g, "");
 const patterns = {
 stars: "M20 2 L25 7 L33 7 L29 13 L37 16 L29 19 L33 25 L25 25 L20 30 L15 25 L7 25 L11 19 L3 16 L11 13 L7 7 L15 7 Z",
 geometric: "M20 2 L38 12 L38 28 L20 38 L2 28 L2 12 Z M20 8 L33 15 L33 25 L20 32 L7 25 L7 15 Z",
 arabesque: "M20 5 Q30 5 30 15 Q30 25 20 25 Q10 25 10 15 Q10 5 20 5 M10 15 Q5 15 5 20 M30 15 Q35 15 35 20",
 mosque: "M20 8 Q14 8 14 16 Q14 22 20 22 Q26 22 26 16 Q26 8 20 8 M10 24 Q6 24 6 32 L6 38 L34 38 L34 32 Q34 24 30 24",
 };
 const path = patterns[pattern] || patterns.stars;

 return (
 <div className={`absolute inset-0 overflow-hidden ${className}`}>
 {/* Gradient background */}
 <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}30)` }} />
 {/* SVG pattern overlay */}
 <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
 <defs>
 <pattern id={`col-pat-${uid}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
 <path d={path} fill="none" stroke={color} strokeWidth="0.8" opacity="0.15" />
 </pattern>
 </defs>
 <rect width="100%" height="100%" fill={`url(#col-pat-${uid})`} />
 </svg>
 {/* Central star ornament */}
 <div className="absolute inset-0 flex items-center justify-center">
 <svg width="80" height="80" viewBox="0 0 44 44" style={{ color }} opacity="0.12">
 <path d="M22 2 L27 7 L34 7 L30 13 L37 16 L30 19 L34 25 L27 25 L22 30 L17 25 L10 25 L14 19 L7 16 L14 13 L10 7 L17 7 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
 <circle cx="22" cy="16" r="6" fill="currentColor" opacity="0.1" />
 </svg>
 </div>
 {/* Subtle radial glow */}
 <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${color}10, transparent 70%)` }} />
 </div>
 );
}

// ── Decorative background panel ──
export function IslamicPanel({ children, className = "", pattern = true }) {
 return (
 <div className={`relative overflow-hidden rounded border border-border/40 bg-card/40 ${className}`}>
 {pattern && (
 <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
 <defs>
 <pattern id="panel-pat" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
 <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.03">
 <path d="M30 2 L37 9 L49 9 L43 16 L53 22 L43 28 L49 34 L37 34 L30 42 L23 34 L11 34 L17 28 L7 22 L17 16 L11 9 L23 9 Z" />
 <circle cx="30" cy="22" r="5" />
 </g>
 </pattern>
 </defs>
 <rect width="100%" height="100%" fill="url(#panel-pat)" />
 </svg>
 )}
 <div className="relative">{children}</div>
 </div>
 );
}