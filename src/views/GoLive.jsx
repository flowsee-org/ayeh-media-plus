'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, createLocalTracks, Track } from "livekit-client";
import api from "@/lib/api";
import { usePermissions } from "@/lib/usePermissions";
import { PERMISSIONS } from "@/lib/rbac";
import {
  Radio, Send, Users, VideoOff, Hand, Check, X, MicOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

export default function GoLive() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { can } = usePermissions();
  const [title, setTitle] = useState("");
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

  const videoRef = useRef(null);
  const coHostVideoRef = useRef(null);
  const connRef = useRef(null);
  const subRef = useRef(null);
  const livekitRoomRef = useRef(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const startLive = async () => {
    if (!user) return;
    if (!can(PERMISSIONS.LIVE_STREAM)) {
      toast.error('اشتراک زنده فقط برای مدیر، العالم و استاد مجاز است.');
      return;
    }
    setError("");
    try {
      // 1. Create local media tracks for broadcaster
      const localTracks = await createLocalTracks({
        audio: true,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const mediaStream = new MediaStream(localTracks.map((t) => t.mediaStreamTrack));
      setStream(mediaStream);

      // 2. Create LiveSession record — title only
      const session = await api.entities.LiveSession.create({
        scholar_id: user.id,
        scholar_name: user.full_name || user.email,
        scholar_avatar: user.avatar_config || "",
        title: title.trim() || "جلسه تفسیری زنده",
        room_id: `live-${user.id}-${Date.now()}`,
        status: "live",
      });
      setSessionId(session.id);

      // 3. Connect to LiveKit SFU room
      try {
        const tokenRes = await api.live.getToken(session.room_id, `scholar-${user.id}`);
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        livekitRoomRef.current = room;

        // Handle co-host tracks arriving from LiveKit SFU
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video && coHostVideoRef.current) {
            track.attach(coHostVideoRef.current);
          } else if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach();
            document.body.appendChild(audioElement);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });

        await room.connect(tokenRes.url, tokenRes.token);

        // Publish broadcaster camera and mic tracks to SFU
        for (const track of localTracks) {
          await room.localParticipant.publishTrack(track);
        }
      } catch (lkErr) {
        console.warn("LiveKit connection warning (falling back to local preview):", lkErr);
      }

      // 4. Connect to LiveRoom actor via socket for chat, presence, & hand moderation
      const conn = api.actors.LiveRoom(session.room_id).connect({ id: `scholar-${user.id}` });
      connRef.current = conn;

      conn.send({ type: "claim_broadcaster" });

      // Announce stream to network
      api.socket?.emit("scholar:start_broadcast", {
        sessionId: session.id,
        scholarId: user.id,
        scholarName: user.full_name,
        title: session.title,
      });

      const sub = conn.subscribe((msg) => {
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
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
      livekitRoomRef.current = null;
    }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (subRef.current) subRef.current();
    if (connRef.current) connRef.current.close();
    if (sessionId) {
      await api.entities.LiveSession.update(sessionId, { status: "ended" }).catch(() => {});
    }
    router.push("/talks");
  };

  useEffect(() => {
    return () => {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
      }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (subRef.current) subRef.current();
      if (connRef.current) connRef.current.close();
    };
  }, []);

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 animate-fade-in font-doran">
        <Card className="rounded border border-border bg-card p-6 sm:p-8 shadow-soft">
        <CardContent className="p-0 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
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
            <div className="space-y-2">
              <Label className="text-sm font-bold font-ui">عنوان جلسه</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: تدبّر در آیات نورانی سوره کهف"
              />
            </div>
            <Button
              onClick={startLive}
              disabled={!user}
              variant="primary"
              size="sm"
              className="w-full shadow-soft hover:opacity-90 disabled:opacity-50 transition-all font-ui"
            >
              <Radio className="h-4 w-4 mr-1.5" />
              شروع پخش زنده
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 animate-fade-in font-doran">
      <div className="rounded overflow-hidden border border-border shadow-soft bg-black">
        {/* Main Video Stream Container — Split Screen when Co-Host is active */}
        <div
          className={`relative bg-neutral-950 p-2 ${
            activeSpeaker
              ? "grid grid-cols-1 sm:grid-cols-2 gap-2 aspect-[16/9] sm:aspect-[21/9]"
              : "aspect-video"
          }`}
        >
          {/* Broadcaster Video */}
          <div className="relative w-full h-full rounded overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-3 right-3 rounded bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white font-bold font-ui">
              استاد: {user?.full_name || "مفسر"}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-red-600 px-3 py-1 shadow-sm font-ui">
              <span className="h-2 w-2 rounded bg-white animate-pulse" />
              <span className="text-xs font-bold text-white">زنده</span>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded bg-black/60 backdrop-blur-sm px-3 py-1 font-ui">
              <Users className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-bold text-white">{fa(viewerCount)}</span>
            </div>
          </div>

          {/* Co-Host Video (Split Screen) */}
          {activeSpeaker && (
            <div className="relative w-full h-full rounded overflow-hidden bg-neutral-900 border border-primary/30 flex items-center justify-center animate-scale-in">
              <video
                ref={coHostVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 rounded bg-primary/80 backdrop-blur-sm px-3 py-1 text-xs text-primary-foreground font-bold flex items-center gap-1.5 font-ui">
                <span>مهمان برنامه: {activeSpeaker.name}</span>
              </div>
              <Button
                onClick={kickActiveSpeaker}
                className="absolute top-3 left-3 rounded bg-destructive/90 hover:bg-destructive text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-colors font-ui"
                title="قطع ارتباط با مهمان"
              >
                <MicOff className="h-3 w-3" /> پایان گفتگو
              </Button>
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
            </div>

            {/* Hand Raise Queue Button */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowHandQueue(!showHandQueue)}
                className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold border transition-all font-ui ${
                  raisedHands.length > 0
                    ? "bg-accent/15 border-accent text-accent animate-pulse"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Hand className="h-4 w-4" />
                <span>درخواست‌های گفتگو ({fa(raisedHands.length)})</span>
              </Button>

              <Button
                onClick={endLive}
                className="inline-flex items-center gap-1.5 rounded bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold hover:opacity-90 transition-opacity font-ui"
              >
                <VideoOff className="h-4 w-4" /> پایان پخش زنده
              </Button>
            </div>
          </div>

          {/* Floating Queue Modal / Drawer for Raised Hands */}
          {showHandQueue && (
            <div className="rounded border border-accent/25 bg-secondary/50 p-4 mb-4 animate-scale-in">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Hand className="h-4 w-4 text-accent" /> لیست انتظار پرسش و پاسخ صوتی/تصویری
                </span>
                <Button
                  onClick={() => setShowHandQueue(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
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
                      className="flex items-center justify-between gap-3 bg-card p-2.5 rounded border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {speaker.name?.[0]}
                        </div>
                        <span className="text-xs font-bold text-foreground">{speaker.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => acceptSpeaker(speaker)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 font-ui"
                        >
                          <Check className="h-3 w-3" /> پذیرش دوطرفه
                        </Button>
                        <Button
                          onClick={() => rejectSpeaker(speaker)}
                          className="inline-flex items-center px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-destructive text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat box */}
          <div className="rounded border border-border bg-secondary/30 max-h-48 overflow-y-auto p-3 mb-3 space-y-2">
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
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="ارسال پیام یا پاسخ در جلسه زنده…"
              className="flex-1 rounded border border-border bg-background px-3.5 py-2 text-xs focus:border-primary focus:outline-none font-doran"
            />
            <Button
              onClick={sendChat}
              className="h-9 px-4 rounded bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 font-ui"
            >
              <Send className="h-3.5 w-3.5" /> ارسال
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
