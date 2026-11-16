'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { usePermissions } from "@/lib/usePermissions";
import { PERMISSIONS } from "@/lib/rbac";
import {
 Radio, Send, Users, VideoOff, Hand, Check, X, MicOff, Sparkles,
 BookOpen, ChevronRight, ChevronLeft, Pin, PinOff, Search, Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAyah } from "@/lib/quranApi";
import { getSurahByNumber } from "@/lib/surahData";
import LivePinnedVerseOverlay from "@/components/live/LivePinnedVerseOverlay";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

export default function GoLive() {
 const navigate = useNavigate();
 const [user, setUser] = useState(null);
 const { can } = usePermissions();
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [verseKey, setVerseKey] = useState("");
 const [phase, setPhase] = useState("setup"); // setup | live
 const [error, setError] = useState("");
 const [stream, setStream] = useState(null);
 const [viewerCount, setViewerCount] = useState(0);
 const [chat, setChat] = useState([]);
 const [chatInput, setChatInput] = useState("");
 const [sessionId, setSessionId] = useState(null);
 const [raisedHands, setRaisedHands] = useState([]);
 const [activeSpeaker, setActiveSpeaker] = useState(null);
 const [showHandQueue, setShowHandQueue] = useState(false);

 // Synchronized Quran Verse state
 const [pinnedVerse, setPinnedVerse] = useState(null);
 const [verseSearch, setVerseSearch] = useState("");
 const [previewVerse, setPreviewVerse] = useState(null);
 const [loadingVerse, setLoadingVerse] = useState(false);

 const videoRef = useRef(null);
 const coHostVideoRef = useRef(null);
 const connRef = useRef(null);
 const subRef = useRef(null);
 const pcsRef = useRef(new Map()); // viewerId -> RTCPeerConnection

 useEffect(() => {
 api.auth.me().then(setUser).catch(() => {});
 }, []);

 const loadVerse = useCallback(async (vKey) => {
 if (!vKey || !vKey.includes(":")) return;
 const parts = vKey.trim().split(":").map(Number);
 if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
 const [surahNum, ayahNum] = parts;
 setLoadingVerse(true);
 try {
 const [ayahData, surahMeta] = await Promise.all([
 getAyah(surahNum, ayahNum).catch(() => null),
 Promise.resolve(getSurahByNumber(surahNum)),
 ]);
 if (ayahData) {
 setPreviewVerse({
 verseKey: `${surahNum}:${ayahNum}`,
 surahNum,
 ayahNum,
 surahName: surahMeta?.persianName || ayahData.surahName || `سوره ${surahNum}`,
 arabic: ayahData.arabic,
 translation: ayahData.translation,
 });
 }
 } catch {}
 setLoadingVerse(false);
 }, []);

 const stepAyah = (delta) => {
 if (!previewVerse) return;
 const nextAyah = previewVerse.ayahNum + delta;
 if (nextAyah < 1) return;
 const nextKey = `${previewVerse.surahNum}:${nextAyah}`;
 setVerseSearch(nextKey);
 loadVerse(nextKey);
 };

 const pinCurrentVerse = () => {
 if (!previewVerse || !connRef.current) return;
 connRef.current.send({
 type: "pin_verse",
 verse: previewVerse,
 });
 setPinnedVerse(previewVerse);
 toast.success(`آیه ${previewVerse.verseKey} برای همه بینندگان پین شد`);
 };

 const unpinCurrentVerse = () => {
 if (!connRef.current) return;
 connRef.current.send({
 type: "unpin_verse",
 });
 setPinnedVerse(null);
 toast("پین آیه برداشته شد");
 };

 const createPeerConnection = useCallback((viewerId, mediaStream, conn, isCoHost = false) => {
 const pc = new RTCPeerConnection({
 iceServers: [
 { urls: "stun:stun.l.google.com:19302" },
 { urls: "stun:stun1.l.google.com:19302" },
 ],
 });

 // Add local broadcaster tracks
 mediaStream.getTracks().forEach((track) => {
 pc.addTrack(track, mediaStream);
 });

 // If viewer is co-host or sending back media, receive their track
 pc.ontrack = (e) => {
 if (coHostVideoRef.current && e.streams[0]) {
 coHostVideoRef.current.srcObject = e.streams[0];
 }
 };

 pc.onicecandidate = (e) => {
 if (e.candidate) {
 conn.send({ type: "ice", target: viewerId, candidate: e.candidate });
 }
 };

 if (isCoHost) {
 pc.addTransceiver("video", { direction: "sendrecv" });
 pc.addTransceiver("audio", { direction: "sendrecv" });
 }

 pc.createOffer().then((offer) => {
 pc.setLocalDescription(offer);
 conn.send({ type: "offer", target: viewerId, sdp: offer });
 });

 pcsRef.current.set(viewerId, pc);
 }, []);

 const startLive = async () => {
  if (!user) return;
  if (!can(PERMISSIONS.LIVE_STREAM)) {
    toast.error('اشتراک زنده فقط برای مدیر، العالم و استاد مجاز است.');
    return;
  }
  setError("");
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
 setStream(mediaStream);

 // Create LiveSession record
 const session = await api.entities.LiveSession.create({
 scholar_id: user.id,
 scholar_name: user.full_name || user.email,
 scholar_avatar: user.avatar_config || "",
 title: title.trim() || "جلسه تفسیری زنده",
 description: description.trim(),
 room_id: `live-${user.id}-${Date.now()}`,
 status: "live",
 verse_key: verseKey.trim() || undefined,
 });
 setSessionId(session.id);

 // Connect to LiveRoom actor via socket
 const conn = api.actors.LiveRoom(session.room_id).connect({ id: `scholar-${user.id}` });
 connRef.current = conn;

 conn.send({ type: "claim_broadcaster" });

 // If initial verse was specified in setup, pre-load it
 if (verseKey.trim()) {
 setVerseSearch(verseKey.trim());
 loadVerse(verseKey.trim());
 }

 // Announce stream to network
 api.socket?.emit("scholar:start_broadcast", {
 sessionId: session.id,
 scholarId: user.id,
 scholarName: user.full_name,
 title: session.title,
 });

 const sub = conn.subscribe((msg) => {
 if (msg.type === "viewer_joined") {
 createPeerConnection(msg.viewerId, mediaStream, conn, false);
 }
 if (msg.type === "answer" && msg.from) {
 const pc = pcsRef.current.get(msg.from);
 if (pc) pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).catch(() => {});
 }
 if (msg.type === "ice" && msg.from) {
 const pc = pcsRef.current.get(msg.from);
 if (pc && msg.candidate) pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
 }
 if (msg.type === "presence") {
 setViewerCount(msg.viewerCount || 0);
 }
 if (msg.type === "chat") {
 setChat((prev) => [...prev, msg.message]);
 }
 if (msg.type === "hand_raised_list") {
 setRaisedHands(msg.list || []);
 }
 if (msg.type === "active_speaker_changed") {
 setActiveSpeaker(msg.speaker || null);
 }
 if (msg.type === "pinned_verse_changed") {
 setPinnedVerse(msg.verse || null);
 }
 });
 subRef.current = sub;

 setPhase("live");
 setTimeout(() => {
 if (videoRef.current) videoRef.current.srcObject = mediaStream;
 }, 100);
 } catch (err) {
 setError(err.message || "امکان دسترسی به دوربین و میکروفون فراهم نشد.");
 }
 };

 const acceptSpeaker = (speaker) => {
 if (!connRef.current) return;
 connRef.current.send({
 type: "accept_speaker",
 targetConnId: speaker.connId,
 });
 setShowHandQueue(false);
 toast.success(`گفتگو با ${speaker.name} پذیرفته شد`);
 };

 const rejectSpeaker = (speaker) => {
 if (!connRef.current) return;
 connRef.current.send({
 type: "lower_hand",
 targetConnId: speaker.connId,
 });
 toast("درخواست گفتگو رد شد");
 };

 const kickActiveSpeaker = () => {
 if (!connRef.current) return;
 connRef.current.send({ type: "kick_speaker" });
 setActiveSpeaker(null);
 if (coHostVideoRef.current) coHostVideoRef.current.srcObject = null;
 toast("ارتباط مهمان به پایان رسید");
 };

 const sendChat = () => {
 if (!chatInput.trim() || !connRef.current) return;
 connRef.current.send({ type: "chat", author: user?.full_name || "استاد", text: chatInput.trim() });
 setChatInput("");
 };

 const endLive = async () => {
 pcsRef.current.forEach((pc) => pc.close());
 pcsRef.current.clear();
 if (stream) stream.getTracks().forEach((t) => t.stop());
 if (subRef.current) subRef.current();
 if (connRef.current) connRef.current.close();
 if (sessionId) {
 await api.entities.LiveSession.update(sessionId, { status: "ended" }).catch(() => {});
 }
 navigate("/talks");
 };

 useEffect(() => {
 return () => {
 pcsRef.current.forEach((pc) => pc.close());
 if (stream) stream.getTracks().forEach((t) => t.stop());
 if (subRef.current) subRef.current.unsubscribe();
 if (connRef.current) connRef.current.close();
 };
 }, []);

 if (phase === "setup") {
 return (
 <div className="mx-auto max-w-lg px-4 py-8 animate-fade-in font-doran">
 <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft">
 <div className="flex items-center gap-3 mb-6">
 <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
 <Radio className="h-5 w-5" />
 </div>
 <div>
 <h1 className="font-rokh-bold font-bold text-xl text-foreground">استودیوی پخش زنده</h1>
 <p className="font-doran text-xs text-muted-foreground mt-0.5">
 برگزاری جلسه تفسیری و پاسخ زنده به پرسش‌های مخاطبان
 </p>
 </div>
 </div>

 {error && <p className="text-sm text-destructive mb-4 text-center">{error}</p>}

 <div className="space-y-4">
 <div>
 <label className="text-sm font-bold mb-1.5 block font-ui">عنوان جلسه</label>
 <input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="مثلاً: تدبّر در آیات نورانی سوره کهف"
 className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none font-doran"
 />
 </div>
 <div>
 <label className="text-sm font-bold mb-1.5 block font-ui">توضیحات و محورهای بحث</label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="موضوعات، مفاهیم و محورهای تفسیری مورد گفتگو…"
 rows={3}
 className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm resize-none focus:border-primary focus:outline-none font-doran leading-relaxed"
 />
 </div>
 <div>
 <label className="text-sm font-bold mb-1.5 block font-ui">
 کلید آیه مورد تدبّر (مثلاً 18:1 یا 2:255)
 </label>
 <input
 value={verseKey}
 onChange={(e) => setVerseKey(e.target.value)}
 placeholder="مثلاً 18:1"
 className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none font-ui"
 />
 </div>
 <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-center gap-2">
 <Sparkles className="h-4 w-4 text-primary shrink-0" />
 <span>
 با شروع پخش زنده، می‌توانید هر آیه‌ای را همراه با ترجمه روی تصویر پین کنید و بین آیات جابه‌جا شوید.
 </span>
 </div>
 <button
 onClick={startLive}
 disabled={!user}
 className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:opacity-90 disabled:opacity-50 transition-all font-ui"
 >
 <Radio className="h-4 w-4" /> شروع پخش زنده
 </button>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="mx-auto max-w-4xl px-4 py-4 animate-fade-in font-doran">
 <div className="rounded-3xl overflow-hidden border border-border shadow-soft bg-black">
 {/* Main Video Stream Container — Split Screen when Co-Host is active */}
 <div
 className={`relative bg-neutral-950 p-2 ${
 activeSpeaker
 ? "grid grid-cols-1 sm:grid-cols-2 gap-2 aspect-[16/9] sm:aspect-[21/9]"
 : "aspect-video"
 }`}
 >
 {/* Broadcaster Video */}
 <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
 <video
 ref={videoRef}
 autoPlay
 playsInline
 muted
 className="w-full h-full object-cover"
 />

 {/* Pinned Quran Verse Overlay (Broadcaster preview) */}
 <LivePinnedVerseOverlay pinnedVerse={pinnedVerse} />

 <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white font-bold font-ui">
 استاد: {user?.full_name || "مفسر"}
 </div>
 <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 shadow-sm font-ui">
 <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
 <span className="text-xs font-bold text-white">زنده</span>
 </div>
 <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 font-ui">
 <Users className="h-3.5 w-3.5 text-white" />
 <span className="text-xs font-bold text-white">{fa(viewerCount)}</span>
 </div>
 </div>

 {/* Co-Host Video (Split Screen) */}
 {activeSpeaker && (
 <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 border border-primary/30 flex items-center justify-center animate-scale-in">
 <video
 ref={coHostVideoRef}
 autoPlay
 playsInline
 className="w-full h-full object-cover"
 />
 <div className="absolute bottom-3 right-3 rounded-full bg-primary/80 backdrop-blur-sm px-3 py-1 text-xs text-primary-foreground font-bold flex items-center gap-1.5 font-ui">
 <span>مهمان برنامه: {activeSpeaker.name}</span>
 </div>
 <button
 onClick={kickActiveSpeaker}
 className="absolute top-3 left-3 rounded-full bg-destructive/90 hover:bg-destructive text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-colors font-ui"
 title="قطع ارتباط با مهمان"
 >
 <MicOff className="h-3 w-3" /> پایان گفتگو
 </button>
 </div>
 )}
 </div>

 {/* Controls & Chat Panel */}
 <div className="bg-card p-4 sm:p-6 border-t border-border">
 <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
 <div>
 <h2 className="font-rokh-bold font-bold text-lg text-foreground">
 {title || "جلسه تفسیری زنده"}
 </h2>
 {description && (
 <p className="font-doran text-xs text-muted-foreground mt-0.5">{description}</p>
 )}
 </div>

 {/* Hand Raise Queue Button */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => setShowHandQueue(!showHandQueue)}
 className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all font-ui ${
 raisedHands.length > 0
 ? "bg-accent/15 border-accent text-accent animate-pulse"
 : "bg-secondary border-border text-muted-foreground hover:text-foreground"
 }`}
 >
 <Hand className="h-4 w-4" />
 <span>درخواست‌های گفتگو ({fa(raisedHands.length)})</span>
 </button>

 <button
 onClick={endLive}
 className="inline-flex items-center gap-1.5 rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold hover:opacity-90 transition-opacity font-ui"
 >
 <VideoOff className="h-4 w-4" /> پایان پخش زنده
 </button>
 </div>
 </div>

 {/* ═══════ Live Quran Verse Controller (Scholar Tool) ═══════ */}
 <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
 <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
 <div className="flex items-center gap-2">
 <BookOpen className="h-4 w-4 text-amber-500" />
 <span className="font-rokh-bold font-bold text-sm text-foreground">
 محور تدبّر جلسه (پین همگام آیه برای همه مخاطبان)
 </span>
 {pinnedVerse && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold font-ui">
 <Pin className="h-2.5 w-2.5" /> در حال نمایش: {pinnedVerse.verseKey}
 </span>
 )}
 </div>

 {pinnedVerse && (
 <button
 type="button"
 onClick={unpinCurrentVerse}
 className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive hover:underline font-ui"
 >
 <PinOff className="h-3 w-3" />
 <span>برداشتن پین آیه</span>
 </button>
 )}
 </div>

 {/* Input & Step Navigation Controls */}
 <div className="flex items-center gap-2 mb-3">
 <div className="relative flex-1">
 <input
 type="text"
 value={verseSearch}
 onChange={(e) => setVerseSearch(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && loadVerse(verseSearch)}
 placeholder="شماره سوره و آیه (مثلاً 2:255 یا 18:1)..."
 className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-ui focus:border-amber-500 focus:outline-none"
 />
 </div>

 <button
 type="button"
 onClick={() => loadVerse(verseSearch)}
 disabled={loadingVerse}
 className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold font-ui transition-colors disabled:opacity-50"
 >
 {loadingVerse ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Search className="h-3.5 w-3.5" />
 )}
 <span>فراخوانی آیه</span>
 </button>

 {/* Prev Ayah Step Button */}
 <button
 type="button"
 onClick={() => stepAyah(-1)}
 disabled={!previewVerse || previewVerse.ayahNum <= 1 || loadingVerse}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 transition-colors"
 title="آیه قبلی"
 >
 <ChevronRight className="h-4 w-4" />
 </button>

 {/* Next Ayah Step Button */}
 <button
 type="button"
 onClick={() => stepAyah(1)}
 disabled={!previewVerse || loadingVerse}
 className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 transition-colors"
 title="آیه بعدی"
 >
 <ChevronLeft className="h-4 w-4" />
 </button>
 </div>

 {/* Ayah Preview & Pin Broadcast Button */}
 {previewVerse && (
 <div className="rounded-xl border border-border/80 bg-card p-3 animate-fade-in">
 <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 mb-2">
 <span className="text-xs font-bold text-accent font-rokh-bold">
 سوره {previewVerse.surahName} • آیه {fa(previewVerse.ayahNum)}
 </span>

 <button
 type="button"
 onClick={pinCurrentVerse}
 className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold font-ui shadow-xs transition-all ${
 pinnedVerse?.verseKey === previewVerse.verseKey
 ? "bg-emerald-600 text-white"
 : "bg-amber-500 text-amber-950 hover:bg-amber-400"
 }`}
 >
 <Pin className="h-3 w-3" />
 <span>
 {pinnedVerse?.verseKey === previewVerse.verseKey
 ? "پین شده برای بینندگان ✓"
 : "پین این آیه برای همه بینندگان"}
 </span>
 </button>
 </div>

 <div className=" text-sm text-foreground text-center font-bold my-1" dir="rtl">
 {previewVerse.arabic}
 </div>
 <p className="font-doran text-xs text-muted-foreground text-center line-clamp-2">
 «{previewVerse.translation}»
 </p>
 </div>
 )}
 </div>

 {/* Floating Queue Modal / Drawer for Raised Hands */}
 {showHandQueue && (
 <div className="rounded-2xl border border-accent/25 bg-secondary/50 p-4 mb-4 animate-scale-in">
 <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
 <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
 <Hand className="h-4 w-4 text-accent" /> لیست انتظار پرسش و پاسخ صوتی/تصویری
 </span>
 <button
 onClick={() => setShowHandQueue(false)}
 className="text-muted-foreground hover:text-foreground"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {raisedHands.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-4">
 در حال حاضر بیننده‌ای دست بلند نکرده است.
 </p>
 ) : (
 <div className="space-y-2 max-h-48 overflow-y-auto">
 {raisedHands.map((speaker) => (
 <div
 key={speaker.connId}
 className="flex items-center justify-between gap-3 bg-card p-2.5 rounded-xl border border-border"
 >
 <div className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
 {speaker.name?.[0]}
 </div>
 <span className="text-xs font-bold text-foreground">{speaker.name}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <button
 onClick={() => acceptSpeaker(speaker)}
 className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 font-ui"
 >
 <Check className="h-3 w-3" /> پذیرش دوطرفه
 </button>
 <button
 onClick={() => rejectSpeaker(speaker)}
 className="inline-flex items-center px-2 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-destructive text-xs"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Chat box */}
 <div className="rounded-2xl border border-border bg-secondary/30 max-h-48 overflow-y-auto p-3 mb-3 space-y-2">
 {chat.length === 0 ? (
 <p className="text-xs text-muted-foreground text-center py-4">هنوز پیامی ارسال نشده است</p>
 ) : (
 chat.map((m, i) => (
 <div key={i} className="text-xs">
 <span className={`font-bold ${m.system ? "text-amber-500 font-rokh-bold" : "text-primary"}`}>
 {m.author}:{" "}
 </span>
 <span className={m.system ? "text-amber-600 dark:text-amber-400 font-medium" : "text-foreground/90"}>
 {m.text}
 </span>
 </div>
 ))
 )}
 </div>

 <div className="flex items-center gap-2">
 <input
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && sendChat()}
 placeholder="ارسال پیام یا پاسخ در جلسه زنده…"
 className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs focus:border-primary focus:outline-none font-doran"
 />
 <button
 onClick={sendChat}
 className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 font-ui"
 >
 <Send className="h-3.5 w-3.5" /> ارسال
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
