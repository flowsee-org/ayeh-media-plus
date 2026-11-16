import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "@/lib/router-compat";
import { X, Send } from "lucide-react";

const STORY_DURATION = 5000; // 5s per story

export default function StoryViewer({ groups, startIndex, user, onClose, onView }) {
 const [groupIndex, setGroupIndex] = useState(startIndex);
 const [storyIndex, setStoryIndex] = useState(0);
 const [progress, setProgress] = useState(0);
 const [paused, setPaused] = useState(false);
 const [reply, setReply] = useState("");
 const [showReply, setShowReply] = useState(false);
 const rafRef = useRef(null);
 const startTimeRef = useRef(0);
 const elapsedRef = useRef(0);

 const currentGroup = groups[groupIndex];
 const currentStory = currentGroup?.stories[storyIndex];

 // Mark story as viewed when it's shown
 useEffect(() => {
 if (currentStory && user) {
 onView?.(currentStory.id);
 }
 }, [currentStory?.id]);

 // Progress timer
 useEffect(() => {
 if (!currentStory) return;

 startTimeRef.current = Date.now();
 elapsedRef.current = 0;
 setProgress(0);

 const tick = () => {
 if (paused) {
 startTimeRef.current = Date.now() - elapsedRef.current;
 rafRef.current = requestAnimationFrame(tick);
 return;
 }
 const elapsed = Date.now() - startTimeRef.current;
 elapsedRef.current = elapsed;
 const pct = Math.min(elapsed / STORY_DURATION, 1);
 setProgress(pct);

 if (pct >= 1) {
 next();
 return;
 }
 rafRef.current = requestAnimationFrame(tick);
 };

 rafRef.current = requestAnimationFrame(tick);
 return () => cancelAnimationFrame(rafRef.current);
 }, [currentStory?.id, paused]);

 const next = useCallback(() => {
 if (!currentGroup) return;
 if (storyIndex < currentGroup.stories.length - 1) {
 setStoryIndex(storyIndex + 1);
 } else if (groupIndex < groups.length - 1) {
 setGroupIndex(groupIndex + 1);
 setStoryIndex(0);
 } else {
 onClose();
 }
 }, [storyIndex, groupIndex, currentGroup, groups, onClose]);

 const prev = useCallback(() => {
 if (storyIndex > 0) {
 setStoryIndex(storyIndex - 1);
 } else if (groupIndex > 0) {
 const prevGroup = groups[groupIndex - 1];
 setGroupIndex(groupIndex - 1);
 setStoryIndex(prevGroup.stories.length - 1);
 }
 }, [storyIndex, groupIndex, groups]);

 // Keyboard navigation
 useEffect(() => {
 const onKey = (e) => {
 if (e.key === "Escape") onClose();
 if (e.key === "ArrowRight") prev(); // RTL: right = previous
 if (e.key === "ArrowLeft") next(); // RTL: left = next
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [prev, next, onClose]);

 if (!currentStory) return null;

 const timeAgo = (() => {
 const diff = Date.now() - new Date(currentStory.created_date).getTime();
 const h = Math.floor(diff / 3600000);
 if (h < 1) return "همین حالا";
 if (h < 24) return `${h.toLocaleString("fa-IR")} ساعت پیش`;
 return "دیروز";
 })();

 return (
 <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center select-none">
 {/* Background blur of the story */}
 <div className="absolute inset-0">
 {currentStory.media_type === "video" ? (
 <video
 src={currentStory.media_url}
 className="w-full h-full object-cover"
 autoPlay
 muted
 loop
 playsInline
 />
 ) : (
 <img
 src={currentStory.media_url}
 alt=""
 className="w-full h-full object-cover"
 />
 )}
 <div className="absolute inset-0 bg-black/40" />
 </div>

 {/* Story content */}
 <div
 className="relative w-full h-full max-w-md mx-auto flex flex-col"
 onPointerDown={() => setPaused(true)}
 onPointerUp={() => setPaused(false)}
 onPointerLeave={() => setPaused(false)}
 >
 {/* Progress bars */}
 <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
 {currentGroup.stories.map((_, i) => (
 <div
 key={i}
 className="flex-1 h-0.5 rounded bg-white/30 overflow-hidden"
 >
 <div
 className="h-full bg-white rounded"
 style={{
 width: i < storyIndex ? "100%" : i === storyIndex ? `${progress * 100}%` : "0%",
 }}
 />
 </div>
 ))}
 </div>

 {/* Header: author info + close */}
 <div className="absolute top-6 left-0 right-0 z-20 flex items-center gap-3 px-4">
 <div className="h-9 w-9 rounded bg-gradient-to-tr from-accent to-primary p-[2px]">
 <div className="h-full w-full rounded bg-background overflow-hidden flex items-center justify-center">
 {currentGroup.authorAvatar ? (
 <img src={currentGroup.authorAvatar} alt="" className="h-full w-full object-cover" />
 ) : (
 <span className="text-xs font-bold text-accent">
 {currentGroup.authorName?.charAt(0)}
 </span>
 )}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-sm font-medium text-white truncate">{currentGroup.authorName}</div>
 <div className="text-[11px] text-white/70">{timeAgo}</div>
 </div>
 <button
 onClick={onClose}
 className="h-9 w-9 rounded bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Caption / verse */}
 {(currentStory.caption || currentStory.verse_text) && (
 <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
 {currentStory.verse_text && (
 <div className="rounded bg-black/50 backdrop-blur-sm p-3 mb-2">
 <p className=" text-base text-white/95 text-center leading-[2.2]" dir="rtl">
 {currentStory.verse_text}
 </p>
 {currentStory.verse_key && (
 <Link
 to={`/verse/${currentStory.verse_key.replace(":", "/")}`}
 onClick={onClose}
 className="block text-center text-[11px] text-accent mt-1 hover:underline"
 >
 {currentStory.verse_key} — مشاهده تفسیر
 </Link>
 )}
 </div>
 )}
 {currentStory.caption && (
 <p className="text-sm text-white/90 text-center leading-relaxed">
 {currentStory.caption}
 </p>
 )}
 </div>
 )}

 {/* Reply bar */}
 {user && (
 <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
 {showReply ? (
 <div className="flex items-center gap-2 rounded bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2">
 <input
 value={reply}
 onChange={(e) => setReply(e.target.value)}
 placeholder={`پاسخ به ${currentGroup.authorName}...`}
 className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
 autoFocus
 />
 <button
 onClick={() => {
 setReply("");
 setShowReply(false);
 }}
 className="text-white/70 hover:text-white"
 >
 <Send className="h-4 w-4 rotate-180" />
 </button>
 </div>
 ) : (
 <button
 onClick={() => setShowReply(true)}
 className="w-full rounded bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 text-sm text-white/60 text-center hover:bg-white/15"
 >
 پاسخ به {currentGroup.authorName}...
 </button>
 )}
 </div>
 )}

 {/* Tap zones */}
 <button
 onClick={(e) => { e.stopPropagation(); prev(); }}
 className="absolute top-0 bottom-0 right-0 w-1/3 z-10"
 aria-label="قبلی"
 />
 <button
 onClick={(e) => { e.stopPropagation(); next(); }}
 className="absolute top-0 bottom-0 left-0 w-1/3 z-10"
 aria-label="بعدی"
 />
 </div>
 </div>
 );
}