import React from "react";

/**
 * مجموعه‌ای از المان‌های اصیل هنر اسلامی-ایرانی (تذهیب، شمسه، لچک، ترنج، کتیبه و گره‌چینی)
 * الهام‌گرفته از شاهکارهای تذهیب عصر صفوی، قاجار و کاشی‌کاری‌های مسجد شیخ لطف‌الله اصفهان.
 */

// ── شمسه زرین و فیروزه‌ای تذهیب ایرانی (Persian Shamseh Medallion) ──
export function PersianShamseh({ size = 48, className = "", color = "currentColor" }) {
 return (
 <svg
 width={size}
 height={size}
 viewBox="0 0 100 100"
 className={className}
 fill="none"
 stroke={color}
 strokeWidth="1.2"
 aria-hidden="true"
 >
 {/* اشعه‌های بیرونی شمسه */}
 <g strokeWidth="0.8" opacity="0.6">
 <path d="M50 0 L54 18 L50 22 L46 18 Z" fill="currentColor" fillOpacity="0.15" />
 <path d="M100 50 L82 54 L78 50 L82 46 Z" fill="currentColor" fillOpacity="0.15" />
 <path d="M50 100 L46 82 L50 78 L54 82 Z" fill="currentColor" fillOpacity="0.15" />
 <path d="M0 50 L18 46 L22 50 L18 54 Z" fill="currentColor" fillOpacity="0.15" />
 {/* قطرهای مورب */}
 <path d="M15 15 L32 26 L29 30 L25 28 Z" fill="currentColor" fillOpacity="0.12" />
 <path d="M85 15 L74 32 L70 29 L72 25 Z" fill="currentColor" fillOpacity="0.12" />
 <path d="M85 85 L68 74 L71 70 L75 72 Z" fill="currentColor" fillOpacity="0.12" />
 <path d="M15 85 L26 68 L30 71 L28 75 Z" fill="currentColor" fillOpacity="0.12" />
 </g>

 {/* ۱۶ لنگه ترنج شمسه */}
 <circle cx="50" cy="50" r="32" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
 <path
 d="M50 12 L59 23 L74 18 L76 34 L91 42 L83 56 L91 70 L76 78 L74 94 L59 89 L50 100 L41 89 L26 94 L24 78 L9 70 L17 56 L9 42 L24 34 L26 18 L41 23 Z"
 strokeWidth="1.2"
 fill="currentColor"
 fillOpacity="0.08"
 />

 {/* ستاره ۸‌پر میانی خاتم */}
 <path
 d="M50 28 L56 38 L68 36 L64 47 L72 54 L61 58 L63 70 L52 66 L50 76 L48 66 L37 70 L39 58 L28 54 L36 47 L32 36 L44 38 Z"
 strokeWidth="1.1"
 />

 {/* ترنج مرکزی (فیروزه تذهیب) */}
 <circle cx="50" cy="50" r="12" fill="currentColor" fillOpacity="0.2" strokeWidth="1.2" />
 <circle cx="50" cy="50" r="6" fill="currentColor" fillOpacity="0.4" />
 <circle cx="50" cy="50" r="2" fill="currentColor" />
 </svg>
 );
}

// ── لچک گوشه اسلیمی (Persian Arabesque Lachak) ──
export function PersianLachak({ position = "tr", size = 64, className = "" }) {
 const transforms = {
 tr: "",
 tl: "scale(-1, 1)",
 br: "scale(1, -1)",
 bl: "scale(-1, -1)",
 };

 const positions = {
 tr: "top-0 right-0",
 tl: "top-0 left-0",
 br: "bottom-0 right-0",
 bl: "bottom-0 left-0",
 };

 return (
 <svg
 width={size}
 height={size}
 viewBox="0 0 100 100"
 className={`absolute ${positions[position]} pointer-events-none text-accent/35 ${className}`}
 fill="none"
 stroke="currentColor"
 style={{ transform: transforms[position] }}
 aria-hidden="true"
 >
 {/* خطوط حاشیه بیرونی لچک */}
 <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" fill="currentColor" fillOpacity="0.1" stroke="none" />
 <path d="M0 0 L100 0 L100 4 L4 4 L4 100 L0 100 Z" fill="currentColor" fillOpacity="0.3" stroke="none" />

 {/* اسلیمی‌های ماری و دهان اژدری */}
 <path
 d="M90 10 C70 10 50 18 36 32 C22 46 14 66 14 86"
 strokeWidth="1.4"
 />
 <path
 d="M80 14 C65 14 52 24 40 36 C28 48 18 64 18 80"
 strokeWidth="0.8"
 strokeDasharray="2 2"
 opacity="0.7"
 />

 {/* گل شاه‌عباسی و بوته اسلیمی گوشه */}
 <path
 d="M36 32 C34 22 42 16 48 20 C54 24 48 34 38 34"
 strokeWidth="1"
 fill="currentColor"
 fillOpacity="0.15"
 />
 <path
 d="M32 36 C22 34 16 42 20 48 C24 54 34 48 34 38"
 strokeWidth="1"
 fill="currentColor"
 fillOpacity="0.15"
 />

 {/* گره ختایی */}
 <circle cx="26" cy="26" r="4" fill="currentColor" fillOpacity="0.3" strokeWidth="1" />
 <circle cx="26" cy="26" r="1.5" fill="currentColor" />
 </svg>
 );
}

// ── قاب کتیبه زرنگار اسلامی (Persian Katibeh Frame) ──
export function PersianKatibeh({ children, className = "", glow = true }) {
 return (
 <div
 className={`relative rounded-3xl border border-accent/30 bg-gradient-to-b from-card/95 via-accent/[0.04] to-card/95 backdrop-blur-xl p-6 sm:p-10 shadow-premium overflow-hidden ${
 glow ? "ring-1 ring-accent/20" : ""
 } ${className}`}
 >
 {/* ۴ لچک اسلیمی در چهار گوشه */}
 <PersianLachak position="tr" size={56} />
 <PersianLachak position="tl" size={56} />
 <PersianLachak position="br" size={56} />
 <PersianLachak position="bl" size={56} />

 {/* خطوط تذهیب حاشیه بالا و پایین */}
 <div className="absolute top-0 inset-x-12 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent pointer-events-none" />
 <div className="absolute bottom-0 inset-x-12 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent pointer-events-none" />

 {/* محتوای درون کتیبه */}
 <div className="relative z-10">{children}</div>
 </div>
 );
}

// ── جداکننده ترنج و تذهیب ایرانی (Persian Toranj Divider) ──
export function PersianToranjDivider({ className = "", label = "" }) {
 return (
 <div className={`flex items-center justify-center gap-3 my-6 sm:my-8 ${className}`} dir="ltr">
 <div className="h-px flex-1 max-w-[120px] sm:max-w-[180px] bg-gradient-to-l from-accent/50 via-accent/20 to-transparent" />
 <div className="flex items-center gap-2 text-accent">
 <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1">
 <path d="M10 2 L14 10 L10 18 L6 10 Z" fill="currentColor" fillOpacity="0.2" />
 </svg>
 <PersianShamseh size={28} className="text-accent hover:rotate-45 transition-transform duration-700" />
 <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1">
 <path d="M10 2 L14 10 L10 18 L6 10 Z" fill="currentColor" fillOpacity="0.2" />
 </svg>
 </div>
 <div className="h-px flex-1 max-w-[120px] sm:max-w-[180px] bg-gradient-to-r from-accent/50 via-accent/20 to-transparent" />
 {label && <span className="text-xs font-bold text-accent tracking-widest">{label}</span>}
 </div>
 );
}

// ── کتیبه بسم‌الله تذهیبی شاهانه (Illuminated Bismillah Banner) ──
export function PersianBismillahBanner({ className = "" }) {
 return (
 <div className={`relative py-4 px-6 text-center ${className}`}>
 <PersianToranjDivider />
 <div
 className=" text-3xl sm:text-5xl text-foreground/95 drop-shadow-sm font-bold tracking-wide select-none"
 dir="rtl"
 lang="ar"
 >
 بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
 </div>
 <div className="flex items-center justify-center gap-2 mt-3 text-accent/60 text-xs">
 <span>❖</span>
 <span className="font-display font-medium tracking-wider">به نام خداوند بخشاینده بخشایشگر</span>
 <span>❖</span>
 </div>
 </div>
 );
}
