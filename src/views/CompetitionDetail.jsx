'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { Image } from "@/components/ui/image";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { Avatar, COMPETITION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, timeAgo } from "@/components/community/shared";
import {
  ChevronRight, Loader2, Trophy, Award, Users, Calendar, Crown,
  ThumbsUp, Send, X, BookOpen, Mic, Play, Pause,
  RotateCcw, Upload, FileAudio, Check, AlertCircle,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useAudioPlayer } from "@/context/AudioPlayerContext";

const MEDAL_IMAGE = "/images/1397cc654_generated_image.png";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

export default function CompetitionDetail() {
  const { id } = useParams();
  const { user: authUser, openAuthModal } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const [comp, setComp] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);

  const user = authUser || localUser;

  useEffect(() => {
    if (!authUser) {
      base44.auth.me().then(setLocalUser).catch(() => {});
    }
    Promise.all([
      base44.entities.Competition.get(id).catch(() => null),
      base44.entities.CompetitionEntry.filter({ competition_id: id }, "-votes_count", 100).catch(() => []),
    ]).then(([c, e]) => {
      setComp(c);
      setEntries(e);
      setLoading(false);
    });
  }, [id, authUser]);

  const handleVote = async (entry) => {
    if (!user) {
      openAuthModal((loggedIn) => {
        setLocalUser(loggedIn);
      });
      return;
    }
    const votedBy = entry.voted_by || [];
    const hasVoted = votedBy.includes(user.id);
    const newVotedBy = hasVoted ? votedBy.filter((uid) => uid !== user.id) : [...votedBy, user.id];
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id
          ? { ...e, voted_by: newVotedBy, votes_count: newVotedBy.length }
          : e
      )
    );
    try {
      await base44.entities.CompetitionEntry.update(entry.id, {
        voted_by: newVotedBy,
        votes_count: newVotedBy.length,
      });
      toast.success(hasVoted ? "رأی شما پس گرفته شد" : "رأی شما با موفقیت ثبت شد");
    } catch {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
      toast.error("ثبت رأی ناموفق بود.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );

  if (!comp)
    return (
      <div className="mx-auto max-w-md py-24 text-center font-yekan">
        <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">مسابقه یافت نشد.</p>
        <Link
          to="/competitions"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline font-ui font-medium"
        >
          <ChevronRight className="h-4 w-4" /> بازگشت به مسابقات
        </Link>
      </div>
    );

  const status = comp.status || "active";
  const canSubmit = status === "active" && user;

  return (
    <div className="animate-fade-in font-yekan pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {comp.image_url ? (
          <div className="relative h-56 sm:h-64">
            <Image src={comp.image_url} className="w-full h-full" fittingType="fill" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-accent/15 to-primary/10" />
        )}
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pb-6 text-center -mt-24">
          <div className="inline-flex items-center gap-1.5 mb-3 px-3.5 py-1 rounded-full bg-card/90 backdrop-blur-md border border-accent/25 text-xs text-accent font-bold font-ui shadow-soft">
            <Trophy className="h-3.5 w-3.5 text-accent" />
            <span>{COMPETITION_TYPE_LABELS[comp.type] || "مسابقه قرآنی"}</span>
          </div>
          <h1 className="font-kalameh font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-3">
            {comp.title}
          </h1>
          <span
            className={`inline-block text-xs px-3 py-1 rounded-full font-bold font-ui ${STATUS_COLORS[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-xl mx-auto text-xs sm:text-sm font-yekan">
            {comp.description}
          </p>
          <div className="mt-5 flex justify-center">
            <BackButton to="/competitions" label="همه مسابقات" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        {/* Prize Showcase Card */}
        <div className="relative rounded-3xl overflow-hidden border border-accent/25 mb-8 shadow-soft bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/12 to-primary/6 pointer-events-none" />
          <div className="relative grid sm:grid-cols-[auto_1fr] gap-6 p-6 items-center">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden shrink-0 mx-auto sm:mx-0 shadow-soft ring-2 ring-accent/30">
              <Image src={MEDAL_IMAGE} className="w-full h-full" fittingType="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Trophy className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground font-bold font-ui">
                  جایزه ارزشمند مسابقه:
                </span>
              </div>
              <div className="font-kalameh font-bold text-xl sm:text-2xl text-accent mb-1.5">
                {comp.prize_title}
              </div>
              {comp.prize_description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {comp.prize_description}
                </p>
              )}
              {comp.prize_value && (
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold font-ui">
                  <Award className="h-3.5 w-3.5" /> ارزش: {comp.prize_value}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Competition Meta Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <MetaCard icon={Users} label="شرکت‌کنندگان" value={fa(comp.participants_count || 0)} />
          <MetaCard icon={Calendar} label="آغاز مسابقه" value={comp.start_date || "—"} />
          <MetaCard icon={Calendar} label="پایان مهلت" value={comp.end_date || "—"} />
        </div>

        {/* Competition Rules */}
        {comp.rules?.length > 0 && (
          <div className="mb-8 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <h3 className="font-kalameh font-bold text-base mb-3 flex items-center gap-2 text-foreground">
              <BookOpen className="h-4 w-4 text-accent" />
              <span>قوانین و شرایط شرکت در مسابقه</span>
            </h3>
            <div className="space-y-2">
              {comp.rules.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground"
                >
                  <span className="shrink-0 h-5 w-5 rounded-md bg-accent/10 text-accent flex items-center justify-center font-bold text-[11px] font-ui">
                    {fa(i + 1)}
                  </span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <OrnamentalDivider className="mb-8" />

        {/* Entries Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            <h3 className="font-kalameh font-bold text-lg sm:text-xl text-foreground">
              آثار ارسال‌شده ({fa(entries.length)})
            </h3>
          </div>
          {canSubmit ? (
            <button
              onClick={() => setShowSubmit(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold shadow-soft hover:shadow-glow transition-all hover:scale-105 active:scale-95 font-ui"
            >
              <Mic className="h-4 w-4" />
              <span>ثبت تلاوت / اثر</span>
            </button>
          ) : !user && status === "active" ? (
            <button
              onClick={() => openAuthModal(() => setShowSubmit(true))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs font-bold hover:bg-accent/25 transition-all font-ui"
            >
              <Send className="h-4 w-4" />
              <span>ورود و ثبت اثر</span>
            </button>
          ) : null}
        </div>

        {/* Entries List */}
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((e, i) => (
              <CompetitionEntryCard
                key={e.id}
                entry={e}
                rank={i + 1}
                currentUser={user}
                onVote={handleVote}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center">
            <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              هنوز اثری در این مسابقه ثبت نشده است. {canSubmit ? "اولین شرکت‌کننده شما باشید!" : ""}
            </p>
            {canSubmit && (
              <button
                onClick={() => setShowSubmit(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold shadow-soft font-ui"
              >
                <Mic className="h-4 w-4" />
                <span>ضبط و ارسال تلاوت</span>
              </button>
            )}
          </div>
        )}

        {/* Submission Modal */}
        {showSubmit && user && (
          <SubmitEntry
            comp={comp}
            user={user}
            onClose={() => setShowSubmit(false)}
            onSubmitted={() => {
              setShowSubmit(false);
              base44.entities.CompetitionEntry.filter(
                { competition_id: id },
                "-votes_count",
                100
              ).then(setEntries);
            }}
          />
        )}
      </div>
    </div>
  );
}

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3.5 text-center shadow-xs">
      <Icon className="h-4 w-4 text-accent mx-auto mb-1" />
      <div className="text-sm font-bold text-foreground font-ui">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

/**
 * Enhanced Entry Card supporting video or dedicated luxury Quranic audio player
 */
function CompetitionEntryCard({ entry, rank, currentUser, onVote }) {
  const hasVoted = (entry.voted_by || []).includes(currentUser?.id);
  const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  // Detect media type: audio vs video
  const mediaUrl = entry.media_url || "";
  const isVideo =
    entry.media_type === "video" ||
    mediaUrl.endsWith(".mp4") ||
    mediaUrl.endsWith(".mov") ||
    (mediaUrl.includes("video") && !mediaUrl.includes("audio"));

  const isAudio =
    Boolean(mediaUrl) &&
    (!isVideo ||
      entry.media_type === "audio" ||
      mediaUrl.endsWith(".webm") ||
      mediaUrl.endsWith(".mp3") ||
      mediaUrl.endsWith(".wav") ||
      mediaUrl.endsWith(".m4a") ||
      mediaUrl.endsWith(".ogg"));

  const isThisPlaying = isPlaying && currentTrack?.id === `comp-entry-${entry.id}`;

  const handleAudioPlay = (e) => {
    e.preventDefault();
    if (isThisPlaying) {
      togglePlay();
    } else {
      playTrack({
        id: `comp-entry-${entry.id}`,
        title: entry.title || "تلاوت مسابقه قرآنی",
        subtitle: `قاری: ${entry.author_name} ${entry.verse_key ? `• آیه ${entry.verse_key}` : ""}`,
        audioUrl: mediaUrl,
        type: "competition",
        verseKey: entry.verse_key,
        reciter: entry.author_name,
      });
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-card/95 p-4 sm:p-5 shadow-soft transition-all ${
        entry.is_winner
          ? "border-accent/50 shadow-glow ring-2 ring-accent/20"
          : "border-border/80 hover:border-primary/40"
      }`}
    >
      {/* Header: Author + Rank */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {entry.is_winner ? (
            <div className="h-10 w-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0 border border-accent/40 shadow-xs">
              <Crown className="h-5 w-5" />
            </div>
          ) : (
            <Avatar name={entry.author_name} size={40} className="ring-2 ring-border/50" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-kalameh text-foreground">
                {entry.author_name}
              </span>
              {entry.is_winner && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold font-ui">
                  رتبه برتر
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-ui">
              {timeAgo(entry.created_date)}
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-muted-foreground font-ui bg-secondary px-2.5 py-1 rounded-lg border border-border/50">
          رتبه {fa(rank)}
        </div>
      </div>

      {entry.title && (
        <h4 className="font-kalameh font-bold text-base text-foreground mb-2">
          {entry.title}
        </h4>
      )}

      {/* Media Player: Dedicated Audio vs Native Video */}
      {mediaUrl && (
        <div className="my-3">
          {isVideo && !isAudio ? (
            <div className="overflow-hidden rounded-xl bg-black/90 border border-border/60">
              <video
                src={mediaUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[380px] object-contain"
              />
            </div>
          ) : (
            /* Luxury Quranic Audio Player Card */
            <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-card via-primary/5 to-secondary/30 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleAudioPlay}
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-soft transform active:scale-90 shrink-0 ${
                    isThisPlaying
                      ? "bg-amber-500 text-amber-950 ring-4 ring-amber-500/20"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                  title={isThisPlaying ? "توقف تلاوت" : "پخش تلاوت اثر"}
                >
                  {isThisPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-kalameh text-foreground truncate">
                      صوت تلاوت مسابقه
                    </span>
                    {isThisPlaying && (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <span className="w-1 h-3 bg-amber-500 rounded-full animate-pulse" />
                        <span className="w-1 h-4 bg-amber-500 rounded-full animate-pulse delay-75" />
                        <span className="w-1 h-2 bg-amber-500 rounded-full animate-pulse delay-150" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-ui mt-0.5 truncate">
                    {entry.author_name} {entry.verse_key ? `· آیه ${entry.verse_key}` : ""}
                  </div>
                </div>
              </div>

              {entry.verse_key && (
                <Link
                  to={`/verse/${entry.verse_key.replace(":", "/")}`}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background/80 border border-border/80 text-[11px] font-bold text-accent font-ui hover:border-accent"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>آیه {entry.verse_key}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {entry.content && (
        <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line mb-3 font-yekan">
          {entry.content}
        </p>
      )}

      {/* Footer: Verse Link + Vote Button */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        {entry.verse_key ? (
          <Link
            to={`/verse/${entry.verse_key.replace(":", "/")}`}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-ui font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>مطالعه آیه {entry.verse_key}</span>
          </Link>
        ) : (
          <div />
        )}

        <button
          onClick={() => onVote(entry)}
          disabled={!currentUser}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold font-ui transition-all ${
            hasVoted
              ? "bg-accent text-accent-foreground shadow-soft scale-105"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/60"
          }`}
          title={hasVoted ? "پس گرفتن رأی" : "رأی دادن به این تلاوت"}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? "fill-current" : ""}`} />
          <span>{fa(entry.votes_count || 0)} رأی</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Dual-Mode Submission Modal: Live Microphone Recording OR File Upload
 */
function SubmitEntry({ comp, user, onClose, onSubmitted }) {
  const [tab, setTab] = useState("record"); // 'record' | 'upload'
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [verseKey, setVerseKey] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Format timer mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start live microphone recording
  const startRecording = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);

        // Package as file ready for upload
        const audioFile = new File([blob], `recitation-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFileToUpload(audioFile);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErr("دسترسی به میکروفون امکان‌پذیر نشد. لطفاً مجوز میکروفون مرورگر را بررسی فرمایید.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Discard & re-record
  const resetRecording = () => {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setFileToUpload(null);
    setRecordingSeconds(0);
    setErr(null);
  };

  // Handle uploaded file from disk
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileToUpload(f);
      setErr(null);
    }
  };

  const submit = async () => {
    if (!fileToUpload && !content.trim()) {
      setErr("لطفاً صوت تلاوت را ضبط یا فایلی انتخاب نمایید.");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      let media_url = null;
      let media_type = "audio";

      if (fileToUpload) {
        const up = await base44.integrations.Core.UploadFile({ file: fileToUpload });
        media_url = up.file_url;
        media_type = fileToUpload.type?.startsWith("video") ? "video" : "audio";
      }

      await base44.entities.CompetitionEntry.create({
        competition_id: comp.id,
        author_id: user.id,
        author_name: user.full_name || user.email,
        title: title.trim() || `تلاوت اثر ${user.full_name || ""}`,
        content: content.trim() || "تلاوت ارسال شده در مسابقه",
        verse_key: verseKey.trim() || undefined,
        media_url,
        media_type,
        votes_count: 0,
        voted_by: [],
      });

      // Update participant counter
      await base44.entities.Competition.update(comp.id, {
        participants_count: (comp.participants_count || 0) + 1,
      }).catch(() => {});

      toast.success("اثر شما با موفقیت ثبت شد!");
      onSubmitted();
    } catch (e) {
      setErr(e.message || "خطا در بارگذاری و ثبت اثر.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-2xl overflow-hidden font-yekan max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-kalameh font-bold text-base text-foreground">
                ثبت اثر در مسابقه
              </h3>
              <p className="text-[11px] text-muted-foreground">{comp.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex rounded-xl bg-secondary p-1 border border-border/60">
          <button
            type="button"
            onClick={() => {
              setTab("record");
              setErr(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-ui transition-all ${
              tab === "record"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-accent" />
            <span>ضبط زنده تلاوت</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("upload");
              setErr(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-ui transition-all ${
              tab === "upload"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-primary" />
            <span>بارگذاری فایل (صوتی/ویدیو)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {tab === "record" ? (
            /* Live Recording Section */
            <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 text-center">
              {!recordedUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? "bg-red-500 text-white ring-8 ring-red-500/25 animate-pulse"
                          : "bg-accent text-accent-foreground hover:scale-105 shadow-glow"
                      }`}
                    >
                      <Mic className="h-9 w-9" />
                    </button>
                  </div>

                  <div>
                    <div className="font-kalameh font-bold text-base text-foreground">
                      {isRecording ? "در حال ضبط تلاوت شما..." : "آماده ضبط تلاوت"}
                    </div>
                    <div className="font-mono text-lg font-bold text-accent mt-1">
                      {formatTime(recordingSeconds)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRecording
                        ? "پس از اتمام تلاوت، روی دکمه توقف کلیک کنید"
                        : "میکروفون را نزدیک نگاه دارید و تلاوت خود را با طمأنینه آغاز کنید"}
                    </p>
                  </div>
                </div>
              ) : (
                /* Recorded Audio Preview */
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Check className="h-3.5 w-3.5" />
                    <span>تلاوت شما با موفقیت ضبط شد ({formatTime(recordingSeconds)})</span>
                  </div>

                  <audio src={recordedUrl} controls className="w-full mt-2" />

                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs text-muted-foreground hover:text-foreground font-ui"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>ضبط مجدد</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload File Section */
            <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-5 text-center">
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="comp-file-upload"
              />
              <label
                htmlFor="comp-file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="h-12 w-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                  <FileAudio className="h-6 w-6" />
                </div>
                <div className="font-kalameh font-bold text-sm text-foreground">
                  {fileToUpload ? fileToUpload.name : "انتخاب فایل صوتی یا ویدیویی"}
                </div>
                <p className="text-xs text-muted-foreground">
                  پشتیبانی از فرمت‌های MP3، WAV، M4A، MP4 و WebM (حداکثر ۱۰۰ مگابایت)
                </p>
                {fileToUpload && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 font-ui mt-1">
                    <Check className="h-3.5 w-3.5" /> آماده بارگذاری
                  </span>
                )}
              </label>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 font-ui">
              عنوان اثر یا نام سوره:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تلاوت مجلسی سوره شمس"
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-xs font-yekan"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 font-ui">
              شماره یا مشخصات آیه شریفه:
            </label>
            <input
              type="text"
              value={verseKey}
              onChange={(e) => setVerseKey(e.target.value)}
              placeholder="مثال: 91:1 یا 2:255"
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-xs font-ui"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 font-ui">
              یادداشت یا نکته تدبّری پیرامون تلاوت:
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="توضیح کوتاهی درباره حس‌وحال، مقام تلاوت یا پیام آیه بنویسید..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-xs font-yekan leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold font-ui text-muted-foreground hover:text-foreground transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || isRecording}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold font-ui shadow-soft hover:shadow-glow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>در حال بارگذاری و ارسال...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>ارسال نهایی اثر</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
