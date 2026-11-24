'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Room, RoomEvent, Track, createLocalTracks } from "livekit-client";
import api from "@/lib/api";
import { Loader2, Users, Send, Radio, Lock, Hand, Mic, Video, VideoOff, MicOff, Volume2, VolumeX, Settings, ChevronDown, ChevronRight, MoreHorizontal, Heart, Flag, Share2, Download, List, Grid, X, MessageSquare, Bell, Eye, Fullscreen, SkipForward, SkipBack, Play, Pause, BookOpen } from "lucide-react";
import BackButton from "@/components/BackButton";
import FollowButton from "@/components/live/FollowButton";
import CharacterAvatar from "@/components/CharacterAvatar";
import { parseAvatar } from "@/lib/avatars";
import { toast } from "react-hot-toast";
import LivePinnedVerseOverlay from "@/components/live/LivePinnedVerseOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function LiveView() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(null);
  const [ended, setEnded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [pinnedVerse, setPinnedVerse] = useState(null);
  const [showViewerList, setShowViewerList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState("auto");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);

  const videoRef = useRef(null);
  const coHostVideoRef = useRef(null);
  const localCoHostVideoRef = useRef(null);
  const connRef = useRef(null);
  const subRef = useRef(null);
  const livekitRoomRef = useRef(null);

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
        setNotFound(true);
        return;
      }

      let allowed = false;
      if (me?.id) {
        allowed = me.id === s.scholar_id;
        if (!allowed) {
          const res = await api.entities.Follow
            .filter({ follower_id: me.id, followed_id: s.scholar_id })
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

  const connectToRoom = async (sess, me) => {
    let connId = sessionStorage.getItem("liveConnId");
    if (!connId) {
      connId = crypto.randomUUID();
      sessionStorage.setItem("liveConnId", connId);
    }

    // 1. Connect to LiveKit SFU for high-performance audio/video
    try {
      const tokenRes = await api.live.getToken(sess.room_id, connId);
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      livekitRoomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        // Broadcaster / co-host video streams
        const isScholar = participant.identity.includes(sess.scholar_id) || participant.identity.startsWith("scholar-");
        if (track.kind === Track.Kind.Video) {
          if (isScholar && videoRef.current) {
            track.attach(videoRef.current);
          } else if (coHostVideoRef.current) {
            track.attach(coHostVideoRef.current);
          }
        } else if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      await room.connect(tokenRes.url, tokenRes.token);
    } catch (lkErr) {
      console.warn("LiveKit viewer connect error (continuing with room state):", lkErr);
    }

    // 2. Connect to Socket.io for chat, pinned verse overlays, & hand-raising
    const conn = api.actors.LiveRoom(sess.room_id).connect({ id: connId });
    connRef.current = conn;

    const sub = conn.subscribe((msg) => {
      if (msg.type === "room_state") {
        setChat(msg.chat || []);
        setViewerCount(msg.viewerCount || 0);
        setActiveSpeaker(msg.activeSpeaker || null);
        setPinnedVerse(msg.pinnedVerse || null);
        setViewers(msg.viewers || []);
        setRaisedHands(msg.raisedHands || []);
        if (!msg.hasBroadcaster) {
          setEnded(true);
        }
      }
      if (msg.type === "broadcaster_offline") {
        setEnded(true);
      }
      if (msg.type === "presence") {
        setViewerCount(msg.viewerCount);
        setViewers(msg.viewers || []);
      }
      if (msg.type === "chat") {
        setChat((prev) => [...prev, msg.message].slice(-200));
      }
      if (msg.type === "active_speaker_changed") {
        setActiveSpeaker(msg.speaker || null);
      }
      if (msg.type === "pinned_verse_changed") {
        setPinnedVerse(msg.verse || null);
      }
      if (msg.type === "speaker_accepted") {
        handleSpeakerAccepted(conn, connId, sess.room_id);
      }
      if (msg.type === "speaker_kicked") {
        handleSpeakerKicked();
      }
      if (msg.type === "viewer_list") {
        setViewers(msg.viewers || []);
      }
      if (msg.type === "hand_raised") {
        setRaisedHands((prev) => [...prev.filter(h => h.id !== msg.hand.id), msg.hand]);
      }
      if (msg.type === "hand_lowered") {
        setRaisedHands((prev) => prev.filter(h => h.id !== msg.id));
      }
    });
    subRef.current = sub;

    setTimeout(() => {
      conn.send({
        type: "viewer_join",
        name: me?.full_name || "بیننده",
        avatar: me?.avatar_config,
      });
      conn.send({ type: "get_viewers" });
      setLoading(false);
    }, 500);
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

  const handleSpeakerAccepted = async (conn, connId, roomId) => {
    try {
      const localTracks = await createLocalTracks({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      const mediaStream = new MediaStream(localTracks.map((t) => t.mediaStreamTrack));
      setLocalStream(mediaStream);
      setIsSpeaking(true);
      setHandRaised(false);
      if (localCoHostVideoRef.current) {
        localCoHostVideoRef.current.srcObject = mediaStream;
      }
      toast.success("استاد درخواست شما را پذیرفت؛ شما هم‌اکنون روی خط زنده هستید!");

      // If in LiveKit room, publish local tracks as accepted co-host
      if (livekitRoomRef.current) {
        for (const track of localTracks) {
          await livekitRoomRef.current.localParticipant.publishTrack(track);
        }
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

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!isFullscreen) {
      container?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (subRef.current) subRef.current();
      if (connRef.current) connRef.current.close();
    };
  }, [localStream]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/95">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-sm text-white/60 font-doran">در حال اتصال به جلسه زنده...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card variant="default" className="w-full max-w-md p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="font-rokh-bold font-bold text-lg text-foreground">جلسه یافت نشد</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4 font-doran">
            جلسه زنده با این شناسه وجود ندارد یا به پایان رسیده است.
          </p>
          <Link href="/live" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-ui font-medium">
            <ChevronRight className="h-4 w-4" /> بازگشت به جلسات زنده
          </Link>
        </Card>
      </div>
    );
  }

  if (access === "follow") {
    const cfg = parseAvatar(session?.scholar_avatar);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card variant="quranic" className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            {cfg ? (
              <CharacterAvatar config={cfg} size={80} />
            ) : (
              <div className="h-20 w-20 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {session?.scholar_name?.[0]}
              </div>
            )}
          </div>
          <h2 className="font-rokh-bold font-bold text-xl">{session?.scholar_name || "استاد"}</h2>
          <Badge variant="outline" className="mb-4">
            <Lock className="h-3.5 w-3.5 ml-1.5" />
            این جلسه فقط برای دنبال‌کنندگان استاد باز است
          </Badge>
          <div className="flex items-center justify-center gap-2 mt-6">
            <FollowButton scholarId={session?.scholar_id} scholarName={session?.scholar_name} />
            <Link
              href={`/scholars/${session?.scholar_id}`}
              className="px-4 py-2 rounded text-xs font-bold border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              پروفایل استاد
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card variant="default" className="w-full max-w-md p-8 text-center">
          <Radio className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="font-rokh-bold font-bold text-lg text-foreground">جلسه زنده تمام شده</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4 font-doran">این جلسه به پایان رسیده است. آرشیو گفتارهای پیشین استاد در بخش گفتارها و پروفایل در دسترس است.</p>
          {session?.scholar_id && (
            <Link href={`/scholars/${session.scholar_id}`} className="text-xs font-bold text-primary hover:underline inline-block mt-2">
              دیدن آرشیو جلسات استاد ←
            </Link>
          )}
        </Card>
      </div>
    );
  }

  const isHost = user?.id === session?.scholar_id;
  const isCoHost = activeSpeaker?.id === user?.id || isSpeaking;

  return (
    <div className="min-h-screen bg-black/95 text-white font-ui">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent border-b border-white/10 px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(session?.scholar_id ? `/scholars/${session.scholar_id}` : "/scholars")} className="text-white hover:text-accent">
              <ChevronDown className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-rokh-bold font-bold text-sm truncate max-w-[200px]">{session?.title || "جلسه زنده"}</p>
              <p className="text-xs text-white/60 font-doran">{session?.scholar_name || "استاد"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="accent" className="flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded bg-white" />
              زنده
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {viewerCount.toLocaleString("fa-IR")}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-accent">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={toggleFullscreen}>
                  <Fullscreen className="h-3.5 w-3.5 ml-1.5" />
                  {isFullscreen ? "خروج از تمام‌نمایش" : "تمام‌نمایش"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Video className="h-3.5 w-3.5 ml-1.5" />
                  کیفیت ویدیو: {videoQuality}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleMute}>
                  <VolumeX className="h-3.5 w-3.5 ml-1.5" />
                  {isMuted ? "لغو میوت" : "میوت"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isHost && (
                  <>
                    <DropdownMenuItem>
                      <Mic className="h-3.5 w-3.5 ml-1.5" />
                      مدیریت مهمانان
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <List className="h-3.5 w-3.5 ml-1.5" />
                      لیست درخواست‌ها
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Radio className="h-3.5 w-3.5 ml-1.5" />
                      پایان جلسه
                    </DropdownMenuItem>
                  </>
                )}
                {!isHost && (
                  <>
                    <DropdownMenuItem onClick={toggleHandRaise}>
                      <Hand className="h-3.5 w-3.5 ml-1.5" />
                      {handRaised ? "لغو درخواست گفتگو" : "درخواست گفتگو"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Flag className="h-3.5 w-3.5 ml-1.5" />
                      گزارش جلسه
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-[1fr_380px] gap-4 h-[calc(100vh-80px)]">
            <div className="lg:col-span-1 relative h-full min-h-0">
              <div className="relative w-full h-full min-h-0 rounded overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                  style={{ height: "calc(100vh - 120px)" }}
                />
                
                <LivePinnedVerseOverlay pinnedVerse={pinnedVerse} />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" className="flex items-center gap-1.5 animate-pulse">
                      <span className="h-2 w-2 rounded bg-white" />
                      زنده
                    </Badge>
                    <span className="text-xs font-medium bg-black/50 px-2 py-1 rounded">HD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {viewerCount.toLocaleString("fa-IR")}
                    </Badge>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className={isMuted ? "text-accent" : "text-white/80 hover:text-white"}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleVideo}
                        className={localStream?.getVideoTracks()[0]?.enabled === false ? "text-accent" : "text-white/80 hover:text-white"}
                      >
                        {localStream?.getVideoTracks()[0]?.enabled === false ? <VideoOff className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {viewerCount.toLocaleString("fa-IR")}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-white/80 hover:text-white"
                      >
                        {isFullscreen ? <X className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {(activeSpeaker || isSpeaking) && (
                  <div className="absolute bottom-4 right-4 w-64 h-36 sm:w-80 sm:h-45 rounded overflow-hidden bg-neutral-900 border border-primary/30 animate-scale-in z-20">
                    <video
                      ref={isSpeaking ? localCoHostVideoRef : coHostVideoRef}
                      autoPlay
                      playsInline
                      muted={isSpeaking}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 rounded bg-primary/80 backdrop-blur-sm px-3 py-1 text-xs text-primary-foreground font-bold flex items-center gap-1.5">
                      <Mic className="h-3 w-3 animate-pulse" />
                      <span>{isSpeaking ? "شما (روی آنتن زنده)" : `مهمان: ${activeSpeaker?.name || "مهمان"}`}</span>
                    </div>
                    {isSpeaking && (
                      <Button
                        onClick={handleSpeakerKicked}
                        className="absolute top-2 left-2 rounded bg-destructive/90 text-white px-2 py-1 text-xs font-bold flex items-center gap-1"
                      >
                        <VideoOff className="h-3 w-3" /> خروج
                      </Button>
                    )}
                  </div>
                )}

                <LivePinnedVerseOverlay pinnedVerse={pinnedVerse} />

                {isHost && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 bg-black/50 text-white border-white/20">
                          <MoreHorizontal className="h-4 w-4" />
                          کنترل جلسه
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => connRef.current?.send({ type: "end_session" })} className="text-destructive">
                          <Radio className="h-3.5 w-3.5 ml-1.5" />
                          پایان جلسه
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mic className="h-3.5 w-3.5 ml-1.5" />
                          دعوت به گفتگو
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <List className="h-3.5 w-3.5 ml-1.5" />
                          لیست درخواست‌ها
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <BookOpen className="h-3.5 w-3.5 ml-1.5" />
                          سنجاق آیه
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Video className="h-3.5 w-3.5 ml-1.5" />
                          تغییر کیفیت: {videoQuality}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {raisedHands.length > 0 && !isHost && (
                  <div className="absolute top-4 left-4 animate-pulse">
                    <Badge variant="accent" className="flex items-center gap-1.5">
                      <Hand className="h-3.5 w-3.5" />
                      {raisedHands.length} نفر در انتظار
                    </Badge>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1 lg:self-stretch flex flex-col min-h-0">
                <Card className="h-full flex flex-col border-border/20 bg-card/90 backdrop-blur-sm">
                  <Tabs value="chat" className="border-b border-border/50 px-4">
                    <TabsList className="grid w-full gap-1 bg-transparent p-0">
                      <TabsTrigger value="chat" className="py-3">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" />
                          چت زنده
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="viewers" className="py-3">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          بینندگان ({viewerCount})
                        </span>
                      </TabsTrigger>
                      {raisedHands.length > 0 && (
                        <TabsTrigger value="hands" className="py-3">
                          <span className="flex items-center gap-1.5 text-accent">
                            <Hand className="h-4 w-4 animate-pulse" />
                            درخواست‌ها ({raisedHands.length})
                          </span>
                        </TabsTrigger>
                      )}
                    </TabsList>
                    <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 p-0">
                    <ScrollArea className="flex-1 p-4 space-y-3">
                      {chat.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-white/40 py-12">
                          <MessageSquare className="h-10 w-10 mb-3" />
                          <p className="text-sm">هنوز پیامی ارسال نشده</p>
                          <p className="text-xs mt-1">اولین نفر باشید که پیام می‌دهد</p>
                        </div>
                      ) : (
                        <>
                          {chat.map((m, i) => (
                            <div key={i} className="flex gap-3 animate-fade-in">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs font-bold text-accent bg-accent/10">
                                  {m.author?.[0] || "؟"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white truncate">{m.author}</span>
                                  {m.system && <Badge variant="accent" className="text-[10px]">سیستم</Badge>}
                                </div>
                                <p className="text-sm text-white/80 leading-relaxed">{m.text}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </ScrollArea>

                    {user ? (
                      <div className="border-t border-border/50 p-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                            placeholder="پیام یا پرسش‌تان را بنویسید... (Enter برای ارسال)"
                            className="flex-1 bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                          />
                          <Button onClick={sendChat} variant="primary" size="sm" className="gap-1.5">
                            <Send className="h-4 w-4" />
                            ارسال
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-border/50 p-4 text-center">
                        <p className="text-xs text-white/50">
                          برای ارسال پیام، <Link href="/login" className="text-accent hover:underline font-medium">وارد شوید</Link>.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="viewers" className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-2">
                      {viewers.length === 0 ? (
                        <p className="text-center text-white/40 py-8">هیچ بیننده‌ای متصل نیست</p>
                      ) : (
                        viewers.map((v, i) => (
                          <div key={v.id || i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-sm font-bold text-accent bg-accent/10">
                                {v.name?.[0] || v.id?.toString()[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{v.name || "بیننده ناشناس"}</p>
                              <p className="text-xs text-white/50">{v.status || "مشاهده"}</p>
                            </div>
                            {v.is_host && <Badge variant="accent" className="text-[10px]">استاد</Badge>}
                            {v.is_speaker && <Badge variant="secondary" className="text-[10px]">گوینده</Badge>}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="hands" className="p-4">
                    <div className="space-y-2">
                      {raisedHands.map((h, i) => (
                        <div key={h.id || i} className="flex items-center gap-3 p-3 rounded bg-accent/5 border border-accent/20 animate-pulse">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-base font-bold text-accent bg-accent/10">
                              {h.name?.[0] || "؟"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-white">{h.name}</p>
                            <p className="text-xs text-white/60">در انتظار پاسخ استاد</p>
                          </div>
                          {isHost && (
                            <div className="flex gap-2">
                              <Button variant="accent" size="sm" onClick={() => connRef.current?.send({ type: "accept_speaker", target: h.id })}>
                                <Mic className="h-3.5 w-3.5 ml-1" />
                                قبول
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => connRef.current?.send({ type: "reject_speaker", target: h.id })}>
                                <X className="h-3.5 w-3.5 ml-1" />
                                رد
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatViews(count) {
  if (!count) return "0";
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}