'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Loader2, Users, Send, Radio, Lock, Hand, Mic, VideoOff } from "lucide-react";
import BackButton from "@/components/BackButton";
import FollowButton from "@/components/live/FollowButton";
import CharacterAvatar from "@/components/CharacterAvatar";
import { parseAvatar } from "@/lib/avatars";
import { toast } from "react-hot-toast";
import LivePinnedVerseOverlay from "@/components/live/LivePinnedVerseOverlay";

export default function LiveView() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(null); // 'ok' | 'follow'
  const [ended, setEnded] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [pinnedVerse, setPinnedVerse] = useState(null);

  const videoRef = useRef(null);
  const coHostVideoRef = useRef(null);
  const localCoHostVideoRef = useRef(null);
  const connRef = useRef(null);
  const subRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const me = await api.auth.me().catch(() => null);
      if (cancelled) return;
      setUser(me);

      const s = await api.entities.LiveSession.get(id).catch(() => null);
      if (cancelled) return;
      setSession(s);
      if (!s) {
        setLoading(false);
        return;
      }

      // Followers-only: a viewer can watch only scholars they follow
      let allowed = false;
      if (me?.id) {
        allowed = me.id === s.scholar_id;
        if (!allowed) {
          const res = await api.entities.Follow
            .filter({ follower_id: me.id, scholar_id: s.scholar_id })
            .catch(() => ({ items: [] }));
          allowed = (res.items || []).length > 0;
        }
      }
      if (cancelled) return;
      setAccess(allowed ? "ok" : "follow");

      if (!allowed) {
        setLoading(false);
        return;
      }

      if (s.status === "ended") {
        setEnded(true);
        setLoading(false);
        return;
      }

      connectToRoom(s, me);
    })();

    return () => { cancelled = true; };
  }, [id]);

  const connectToRoom = (sess, me) => {
    let connId = sessionStorage.getItem("liveConnId");
    if (!connId) {
      connId = crypto.randomUUID();
      sessionStorage.setItem("liveConnId", connId);
    }

    const conn = api.actors.LiveRoom(sess.room_id).connect({ id: connId });
    connRef.current = conn;

    const sub = conn.subscribe((msg) => {
      if (msg.type === "room_state") {
        setChat(msg.chat || []);
        setViewerCount(msg.viewerCount || 0);
        setActiveSpeaker(msg.activeSpeaker || null);
        setPinnedVerse(msg.pinnedVerse || null);
        if (!msg.hasBroadcaster) {
          setEnded(true);
        }
      }
      if (msg.type === "broadcaster_offline") {
        setEnded(true);
      }
      if (msg.type === "presence") {
        setViewerCount(msg.viewerCount);
      }
      if (msg.type === "offer") {
        handleOffer(msg, conn);
      }
      if (msg.type === "ice" && pcRef.current) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
      }
      if (msg.type === "chat") {
        setChat((prev) => [...prev, msg.message].slice(-100));
      }
      if (msg.type === "active_speaker_changed") {
        setActiveSpeaker(msg.speaker || null);
      }
      if (msg.type === "pinned_verse_changed") {
        setPinnedVerse(msg.verse || null);
      }
      if (msg.type === "speaker_accepted") {
        handleSpeakerAccepted(conn);
      }
      if (msg.type === "speaker_kicked") {
        handleSpeakerKicked();
      }
    });
    subRef.current = sub;

    // Join as viewer once connected
    setTimeout(() => {
      conn.send({
        type: "viewer_join",
        name: me?.full_name || "بیننده",
      });
      setLoading(false);
    }, 500);
  };

  const handleOffer = (msg, conn) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.ontrack = (e) => {
      if (videoRef.current) {
        videoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        conn.send({ type: "ice", target: msg.from, candidate: e.candidate });
      }
    };

    pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(() => {
      return pc.createAnswer();
    }).then((answer) => {
      pc.setLocalDescription(answer);
      conn.send({ type: "answer", target: msg.from, sdp: answer });
    }).catch(() => {});

    pcRef.current = pc;
  };

  const toggleHandRaise = () => {
    if (!connRef.current || !user) {
      toast.error("برای درخواست گفتگو ابتدا وارد حساب خود شوید");
      return;
    }
    if (handRaised) {
      connRef.current.send({ type: "lower_hand" });
      setHandRaised(false);
      toast("درخواست گفتگو لغو شد");
    } else {
      connRef.current.send({
        type: "raise_hand",
        name: user.full_name || user.email || "بیننده",
        avatar: user.avatar_config || "",
      });
      setHandRaised(true);
      toast.success("درخواست گفتگو ارسال شد؛ منتظر تایید استاد باشید ✋");
    }
  };

  const handleSpeakerAccepted = async (conn) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      setLocalStream(mediaStream);
      setIsSpeaking(true);
      setHandRaised(false);
      if (localCoHostVideoRef.current) {
        localCoHostVideoRef.current.srcObject = mediaStream;
      }
      toast.success("استاد درخواست شما را پذیرفت؛ شما هم‌اکنون روی خط زنده هستید!");

      // Add local media tracks to existing peer connection if available
      if (pcRef.current) {
        mediaStream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, mediaStream);
        });
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        conn.send({ type: "offer", target: session.scholar_id, sdp: offer });
      }
    } catch {
      toast.error("دسترسی به دوربین یا میکروفون امکان‌پذیر نشد");
    }
  };

  const handleSpeakerKicked = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setIsSpeaking(false);
    toast("گفتگوی شما با استاد به پایان رسید");
  };

  const sendChat = () => {
    if (!chatInput.trim() || !connRef.current) return;
    connRef.current.send({ type: "chat", author: user?.full_name || "بیننده", text: chatInput.trim() });
    setChatInput("");
  };

  useEffect(() => {
    return () => {
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
      if (subRef.current) subRef.current();
      if (connRef.current) connRef.current.close();
    };
  }, [localStream]);

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  }

  // Followers-only gate
  if (access === "follow") {
    const cfg = parseAvatar(session?.scholar_avatar);
    return (
      <div className="mx-auto max-w-md px-4 py-16 animate-fade-in font-ui">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="flex justify-center mb-4">
            {cfg ? (
              <CharacterAvatar config={cfg} size={80} />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {session?.scholar_name?.[0]}
              </div>
            )}
          </div>
          <h2 className="font-kalameh font-bold text-xl">{session?.scholar_name || "استاد"}</h2>
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5 font-yekan">
            <Lock className="h-3.5 w-3.5 text-primary" /> تماشای پخش زنده فقط برای دنبال‌کنندگان استاد است
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <FollowButton scholarId={session?.scholar_id} scholarName={session?.scholar_name} />
            <Link
              to={`/scholars/${session?.scholar_id}`}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              پروفایل استاد
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="mx-auto max-w-md py-24 text-center font-ui animate-fade-in">
        <Radio className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h2 className="font-kalameh font-bold text-lg text-foreground">جلسه زنده به پایان رسیده است</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4 font-yekan">آرشیو گفتارهای پیشین استاد در بخش گفتارها و پروفایل در دسترس است.</p>
        {session?.scholar_id && (
          <Link to={`/scholars/${session.scholar_id}`} className="text-xs font-bold text-primary hover:underline">
            مشاهده آرشیو جلسات استاد ←
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 animate-fade-in font-ui">
      <BackButton to={session?.scholar_id ? `/scholars/${session.scholar_id}` : "/scholars"} label="بازگشت" className="mb-4" />
      <div className="rounded-3xl overflow-hidden border border-border shadow-soft bg-black">
        {/* Stream Video — Split Screen when Co-Host / Active Speaker is present */}
        <div className={`relative bg-neutral-950 p-2 ${activeSpeaker || isSpeaking ? "grid grid-cols-1 sm:grid-cols-2 gap-2 aspect-[16/9] sm:aspect-[21/9]" : "aspect-video"}`}>
          {/* Broadcaster Video */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Pinned Quran Verse Floating Overlay */}
            <LivePinnedVerseOverlay pinnedVerse={pinnedVerse} />

            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold text-white">زنده</span>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1">
              <Users className="h-3.5 w-3.5 text-white" />
              <span className="text-xs text-white">{viewerCount.toLocaleString("fa-IR")}</span>
            </div>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white font-bold">
              استاد: {session?.scholar_name || "مفسر"}
            </div>
          </div>

          {/* Active Co-Host Video (Split Screen) */}
          {(activeSpeaker || isSpeaking) && (
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 border border-primary/30 flex items-center justify-center animate-scale-in">
              <video
                ref={isSpeaking ? localCoHostVideoRef : coHostVideoRef}
                autoPlay
                playsInline
                muted={isSpeaking}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 rounded-full bg-primary/80 backdrop-blur-sm px-3 py-1 text-xs text-primary-foreground font-bold flex items-center gap-1.5">
                <Mic className="h-3 w-3 animate-pulse" />
                <span>{isSpeaking ? "شما (روی آنتن زنده)" : `مهمان برنامه: ${activeSpeaker?.name || "مهمان"}`}</span>
              </div>
              {isSpeaking && (
                <button
                  onClick={handleSpeakerKicked}
                  className="absolute top-3 left-3 rounded-full bg-destructive/90 text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1"
                >
                  <VideoOff className="h-3 w-3" /> خروج از گفتگو
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info & Chat Box */}
        <div className="bg-card p-4 sm:p-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-kalameh font-bold text-lg text-foreground">{session?.title}</h2>
              {session?.description && <p className="font-yekan text-xs text-muted-foreground mt-0.5">{session.description}</p>}
            </div>

            <div className="flex items-center gap-2">
              {/* Hand Raise Button for Viewers */}
              {user && !isSpeaking && (
                <button
                  onClick={toggleHandRaise}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    handRaised
                      ? "bg-accent text-accent-foreground border-accent shadow-soft animate-pulse"
                      : "bg-secondary border-border text-foreground hover:bg-secondary/70"
                  }`}
                  title="درخواست صحبت و پرسش زنده از استاد"
                >
                  <Hand className="h-4 w-4" />
                  <span>{handRaised ? "دست شما بلند است (منتظر استاد)" : "درخواست گفتگو (دست بلند کردن)"}</span>
                </button>
              )}

              {session?.scholar_id && (
                <FollowButton scholarId={session.scholar_id} scholarName={session.scholar_name} />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 max-h-48 overflow-y-auto p-3 mb-3 space-y-2">
            {chat.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">هنوز پیامی ارسال نشده است</p>
            ) : (
              chat.map((m, i) => (
                <div key={i} className="text-xs">
                  <span className={`font-bold ${m.system ? "text-amber-500 font-kalameh" : "text-primary"}`}>
                    {m.author}:{" "}
                  </span>
                  <span className={m.system ? "text-amber-600 dark:text-amber-400 font-medium" : "text-foreground/90"}>
                    {m.text}
                  </span>
                </div>
              ))
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="ارسال پیام یا پرسش در جلسه زنده…"
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs focus:border-primary focus:outline-none"
              />
              <button
                onClick={sendChat}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1"
              >
                <Send className="h-3.5 w-3.5" /> ارسال
              </button>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-muted-foreground">
              برای ارسال پیام در چت زنده یا درخواست گفتگو، <Link to="/login" className="text-primary font-bold hover:underline">وارد حساب شوید</Link>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
