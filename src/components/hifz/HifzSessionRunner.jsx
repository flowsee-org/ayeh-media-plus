'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Sliders,
  X,
  FastForward,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RECITERS } from '@/lib/quranApi';
import { useHifzAudioLoop } from '@/lib/useHifzAudioLoop';
import { recordVerseReview } from '@/lib/hifzService';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const STAGES = {
  FULL: 'FULL',       // Stage 1: Full visible text
  CUES: 'CUES',       // Stage 2: Cue words (first word/letters)
  MASKED: 'MASKED',   // Stage 3: Fully masked (tap to reveal words)
};

export default function HifzSessionRunner({
  verses = [],
  initialIndex = 0,
  onClose,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [stage, setStage] = useState(STAGES.FULL);
  const [revealedWords, setRevealedWords] = useState(new Set());
  const [reciterId, setReciterId] = useState('ar.parhizgar');
  const [repeatCount, setRepeatCount] = useState(3);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [hasRecitationGap, setHasRecitationGap] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isGrading, setIsGrading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const currentVerse = verses[currentIndex] || null;

  // Split verse arabic into words
  const arabicWords = useMemo(() => {
    if (!currentVerse?.arabic) return [];
    return currentVerse.arabic.trim().split(/\s+/);
  }, [currentVerse?.arabic]);

  // Reset revealed words when switching verse or stage
  useEffect(() => {
    setRevealedWords(new Set());
    setRecordedAudioUrl(null);
  }, [currentIndex, stage]);

  const {
    isPlaying,
    isInGap,
    currentLoop,
    play,
    pause,
    togglePlay,
    restartLoop,
  } = useHifzAudioLoop({
    surahNumber: currentVerse?.surah_number || currentVerse?.surah,
    verseNumber: currentVerse?.verse_number || currentVerse?.numberInSurah,
    reciterId,
    repeatCount,
    playbackRate,
    hasRecitationGap,
    onCycleComplete: () => {
      toast.success(`دوره استماع آیه تکمیل شد ✨`);
    },
  });

  // Tap word to toggle reveal in masked mode
  const toggleWordReveal = (index) => {
    setRevealedWords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Mic recording using browser MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      toast.error('دسترسی به میکروفون امکان‌پذیر نشد');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGrade = async (gradeValue) => {
    if (!currentVerse || isGrading) return;
    setIsGrading(true);
    pause();

    try {
      await recordVerseReview({
        surah_number: currentVerse.surah_number || currentVerse.surah,
        verse_number: currentVerse.verse_number || currentVerse.numberInSurah,
        grade: gradeValue,
        loop_count: repeatCount,
      });

      if (gradeValue >= 4) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#f59e0b', '#3b82f6'],
        });
      }

      if (currentIndex < verses.length - 1) {
        setCurrentIndex((i) => i + 1);
        setStage(STAGES.FULL);
      } else {
        toast.success('تمامی آیات جلسه با موفقیت مرور و ارزیابی شدند! تقبل‌الله');
        if (onComplete) onComplete();
        if (onClose) onClose();
      }
    } catch (err) {
      toast.error('خطا در ثبت نمره ارزیابی');
    } finally {
      setIsGrading(false);
    }
  };

  if (!currentVerse) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="border-b border-border/40 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-rokh-bold text-lg font-bold text-foreground">
              تمرین متمرکز حفظ: آیه {currentVerse.surah_number || currentVerse.surah}:{currentVerse.verse_number || currentVerse.numberInSurah}
            </h2>
            <div className="text-xs text-muted-foreground font-ui">
              آیه {currentIndex + 1} از {verses.length} مقطع انتخابی
            </div>
          </div>
        </div>

        {/* Stage Switcher Pills */}
        <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded border border-border/60">
          <button
            onClick={() => setStage(STAGES.FULL)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              stage === STAGES.FULL
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ۱. متن کامل
          </button>
          <button
            onClick={() => setStage(STAGES.CUES)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              stage === STAGES.CUES
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ۲. نشانه‌ها
          </button>
          <button
            onClick={() => setStage(STAGES.MASKED)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              stage === STAGES.MASKED
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ۳. پوشش کامل
          </button>
        </div>
      </div>

      {/* Center Stage: Verse Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-4xl mx-auto w-full text-center">
        {/* Islamic Decorative Frame */}
        <div className="relative w-full rounded border border-amber-500/20 bg-card/60 p-8 sm:p-14 shadow-2xl backdrop-blur-md">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent/10 border border-accent/25 text-accent text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {stage === STAGES.FULL && 'مرحله ۱: قرائت همراه با متن کامل و ترتیل'}
              {stage === STAGES.CUES && 'مرحله ۲: فراخوانی ذهنی با تکیه بر کلمات کلیدی'}
              {stage === STAGES.MASKED && 'مرحله ۳: تلاوت کامل از حفظ (برای دیدن کلمات کلیک کنید)'}
            </span>
          </div>

          {/* Ayah Arabic Text */}
          <div
            className="text-2xl sm:text-4xl leading-[2.6] sm:leading-[2.8] text-foreground font-tajrid select-none flex flex-wrap justify-center gap-x-3 gap-y-2"
            dir="rtl"
            lang="ar"
          >
            {arabicWords.map((word, idx) => {
              const isRevealed = revealedWords.has(idx);

              if (stage === STAGES.FULL) {
                return <span key={idx} className="transition-all">{word}</span>;
              }

              if (stage === STAGES.CUES) {
                // Show only first word or every 3rd word, mask others unless revealed
                const isCue = idx === 0 || idx % 3 === 0;
                if (isCue || isRevealed) {
                  return (
                    <span
                      key={idx}
                      onClick={() => toggleWordReveal(idx)}
                      className={`cursor-pointer transition-all ${isRevealed ? 'text-emerald-500 font-bold' : ''}`}
                    >
                      {word}
                    </span>
                  );
                }
                return (
                  <span
                    key={idx}
                    onClick={() => toggleWordReveal(idx)}
                    className="cursor-pointer px-2 py-0.5 rounded bg-muted/60 text-transparent hover:bg-muted select-none border border-border/40"
                    title="لمس برای مشاهده"
                  >
                    •••••
                  </span>
                );
              }

              // MASKED stage: all masked unless tapped
              if (isRevealed) {
                return (
                  <span
                    key={idx}
                    onClick={() => toggleWordReveal(idx)}
                    className="cursor-pointer text-emerald-500 font-bold transition-all animate-in fade-in"
                  >
                    {word}
                  </span>
                );
              }

              return (
                <span
                  key={idx}
                  onClick={() => toggleWordReveal(idx)}
                  className="cursor-pointer px-3 py-0.5 rounded bg-muted/70 text-transparent hover:bg-muted/90 select-none border border-border/50 transition-all hover:scale-105"
                  title="کلیک برای نمایش کلمه"
                >
                  ••••••
                </span>
              );
            })}
          </div>

          {/* Translation */}
          {stage === STAGES.FULL && currentVerse.translation && (
            <p className="font-doran text-sm sm:text-base text-muted-foreground mt-8 leading-relaxed max-w-2xl mx-auto border-t border-border/40 pt-4">
              «{currentVerse.translation}»
            </p>
          )}

          {/* Gap Notification Banner */}
          {isInGap && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold animate-pulse">
              <Mic className="w-4 h-4" />
              <span>نوبت شماست! اکنون آیه را با صدای بلند از حفظ تلاوت کنید...</span>
            </div>
          )}
        </div>

        {/* Recording Feedback if recorded */}
        {recordedAudioUrl && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded bg-card border border-border/60">
            <span className="text-xs text-muted-foreground">صوت ضبط شده شما:</span>
            <audio src={recordedAudioUrl} controls className="h-8 max-w-xs" />
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="border-t border-border/40 bg-card/90 p-4 sm:p-6 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Audio Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={restartLoop}
              title="شروع مجدد حلقه"
              className="rounded"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={togglePlay}
              className="px-6 py-2 rounded bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-90 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              <span>{isPlaying ? 'توقف تکرار' : 'پخش ترتیل آموزشی'}</span>
            </Button>

            <div className="text-xs font-ui px-2 py-1 rounded bg-muted/80 text-foreground font-semibold">
              دور {currentLoop} از {repeatCount}
            </div>

            {/* Mic Button */}
            {!isRecording ? (
              <Button
                variant="outline"
                size="icon"
                onClick={startRecording}
                title="ضبط صدای خودتان"
                className="rounded hover:border-red-500/50 hover:text-red-500"
              >
                <Mic className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="icon"
                onClick={stopRecording}
                title="توقف ضبط"
                className="rounded animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            )}
          </div>

          {/* Playback Settings Controls */}
          <div className="flex items-center gap-2 text-xs font-ui">
            <select
              value={reciterId}
              onChange={(e) => setReciterId(e.target.value)}
              className="bg-muted text-foreground px-2 py-1.5 rounded border border-border/60 text-xs"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.style})</option>
              ))}
            </select>

            <select
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              className="bg-muted text-foreground px-2 py-1.5 rounded border border-border/60 text-xs"
            >
              <option value={1}>۱ بار تکرار</option>
              <option value={3}>۳ بار تکرار</option>
              <option value={5}>۵ بار تکرار</option>
              <option value={10}>۱۰ بار تکرار</option>
            </select>

            <button
              onClick={() => setHasRecitationGap(!hasRecitationGap)}
              className={`px-2 py-1.5 rounded border text-xs font-semibold transition-all ${
                hasRecitationGap
                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}
              title="ایجاد فاصله زمانی صامت پس از هر بار خواندن برای تکرار همزمان شما"
            >
              گپ صوتی {hasRecitationGap ? '✓' : '✗'}
            </button>
          </div>

          {/* SM-2 Self-Grading Actions */}
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-center">
            <Button
              size="sm"
              variant="outline"
              disabled={isGrading}
              onClick={() => handleGrade(1)}
              className="text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 rounded"
            >
              تکرار مجدد (فراموشی)
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isGrading}
              onClick={() => handleGrade(3)}
              className="text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10 rounded"
            >
              خوب (با تامل)
            </Button>
            <Button
              size="sm"
              disabled={isGrading}
              onClick={() => handleGrade(5)}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
            >
              آسان و مسلط ✨
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
