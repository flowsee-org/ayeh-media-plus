'use client';

import Link from 'next/link';
import { Play, Clock, BookOpen, Mic, Volume2, Award } from 'lucide-react';
import { fa } from '@/lib/utils';

/**
 * Quran Recitation Card
 * For surah recitations, qari performances, and audio/video recitations.
 */

export default function RecitationCard({
 item,
 className = '',
 variant = 'default',
}) {
 const id = item.id || item.video_id || '';
 const title = item.title || item.name || 'تلاوت قرآنی';
 const surahName = item.surah_name || item.surahName || '';
 const surahNameArabic = item.surah_name_arabic || item.surahNameArabic || '';
 const qariName = item.reciter_name || item.qariName || item.scholar_name || '';
 const qariId = item.reciter_id || item.scholar_id || item.qari_id || '';
 const qariStyle = item.recitation_style || item.style || '';
 const duration = item.duration || '';
 const views = item.views_count || item.views || 0;
 const imageUrl = item.thumbnail_url || item.image_url || item.cover_image || null;
 const verseKey = item.verse_key || item.verseKey || '';
 const verseArabic = item.verse_arabic || item.verseArabic || '';
 const isAudio = item.media_type === 'audio' || item.type === 'audio';
 const category = item.category || 'recitation';

 // Route to watch page for video/audio content, verse page for static verses
 const href = verseKey ? `/watch/${id}` : `/watch/${id}`;

 return (
 <Link
 href={href}
 className={`group relative block rounded border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-quranic-turquoise/50 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
 >
 <div className="h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/20 to-quranic-turquoise/20 flex items-center justify-center relative">
 {imageUrl ? (
 <img
 src={imageUrl}
 alt={title}
 className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
 loading="lazy"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <div className="relative flex items-center justify-center">
 <div className="absolute inset-0 bg-black/30" />
 <div className="relative z-10 h-16 w-16 rounded bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
 {isAudio ? (
 <Volume2 className="h-8 w-8 ml-1" />
 ) : (
 <Play className="h-8 w-8 ml-1" />
 )}
 </div>
 </div>
 </div>
 )}

 {/* Play overlay */}
 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
 <div className="h-16 w-16 rounded bg-quranic-emerald/95 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-quranic-glow transform group-hover:scale-110 transition-transform">
 {isAudio ? (
 <Volume2 className="h-8 w-8 ml-1" />
 ) : (
 <Play className="h-8 w-8 ml-1" />
 )}
 </div>
 </div>

 {/* Top badges */}
 <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 justify-between">
 <div className="flex flex-wrap gap-1.5">
 {isAudio && (
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-quranic-turquoise/90 text-white text-[10px] font-bold backdrop-blur-sm border border-quranic-turquoise/30">
 <Mic className="h-3 w-3" aria-hidden="true" />
 <span>صوتی</span>
 </span>
 )}
 {verseKey && (
 <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-quranic-saffron/90 text-quranic-ink text-[10px] font-bold backdrop-blur-sm border border-quranic-saffron/30">
 <BookOpen className="h-3 w-3" aria-hidden="true" />
 <span>{verseKey}</span>
 </span>
 )}
 </div>
 </div>

 {/* Duration - bottom right */}
 {duration && (
 <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm border border-white/20">
 <Clock className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
 <span>{duration}</span>
 </div>
 )}

 {/* Views - bottom left */}
 {views > 0 && (
 <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
 <Award className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
 <span>{fa(views)}</span>
 </div>
 )}
 </div>

 <div className="p-4 flex-1 flex flex-col">
 {/* Surah info */}
 <div className="mb-3">
 {surahNameArabic && (
 <div className=" text-lg text-quranic-emerald/70 mb-1 text-center" dir="rtl" lang="ar">
 {surahNameArabic}
 </div>
 )}
 {surahName && (
 <div className="text-xs text-quranic-turquoise/80 font-medium tracking-tight text-center">
 {surahName}
 </div>
 )}
 </div>

 {/* Title */}
 <h3 className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors mb-2 text-center">
 {title}
 </h3>

 {/* Qari info */}
 {qariName && (
 <div className="mt-2 flex items-center justify-center gap-2 text-xs font-ui">
 <div className="h-6 w-6 rounded bg-quranic-turquoise/15 flex items-center justify-center text-quranic-turquoise text-[10px] font-bold border border-quranic-turquoise/30">
 {qariName.charAt(0)}
 </div>
 {qariId ? (
 <Link
 href={`/profile/${qariId}`}
 className="text-quranic-turquoise hover:underline"
 onClick={(e) => e.preventDefault()}
 >
 {qariName}
 </Link>
 ) : (
 <span className="text-foreground/70">{qariName}</span>
 )}
 {qariStyle && (
 <span className="text-[10px] text-muted-foreground/60">· {qariStyle}</span>
 )}
 </div>
 )}

 <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between font-ui text-[11px] text-muted-foreground">
 <div className="flex items-center gap-1">
 <Award className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
 <span>{fa(views)}</span>
 </div>
 <div className="flex items-center gap-1 text-xs font-medium text-quranic-emerald">
 <span>{isAudio ? 'پخش صوت' : 'مشاهده ویدیو'}</span>
 {isAudio ? (
 <Volume2 className="h-3 w-3 ml-0.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
 ) : (
 <Play className="h-3 w-3 ml-0.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
 )}
 </div>
 </div>
 </div>
 </Link>
 );
}