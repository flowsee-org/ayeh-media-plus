'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioUrl } from '@/lib/quranApi';

export function useHifzAudioLoop({
  surahNumber,
  verseNumber,
  reciterId = 'ar.parhizgar',
  repeatCount = 3,
  playbackRate = 1.0,
  hasRecitationGap = false,
  onCycleComplete,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLoop, setCurrentLoop] = useState(1);
  const [isInGap, setIsInGap] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);
  const gapTimeoutRef = useRef(null);

  // Initialize or update audio instance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.playbackRate = playbackRate;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    const handleEnded = () => {
      if (hasRecitationGap) {
        setIsInGap(true);
        // Pause audio and wait for gap duration equal to audio length
        const gapDurationMs = (audio.duration || 3) * 1000;
        gapTimeoutRef.current = setTimeout(() => {
          setIsInGap(false);
          handleLoopAdvance();
        }, gapDurationMs);
      } else {
        handleLoopAdvance();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
    };
  }, [hasRecitationGap, playbackRate]);

  // Load new audio source when surah, verse, or reciter changes
  useEffect(() => {
    if (!surahNumber || !verseNumber) return;
    const url = getAudioUrl(surahNumber, verseNumber, reciterId);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      setCurrentLoop(1);
      setIsInGap(false);
      setIsPlaying(false);
    }
    if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
  }, [surahNumber, verseNumber, reciterId]);

  const handleLoopAdvance = useCallback(() => {
    setCurrentLoop((prev) => {
      if (prev < repeatCount) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
        return prev + 1;
      } else {
        setIsPlaying(false);
        if (onCycleComplete) onCycleComplete();
        return 1;
      }
    });
  }, [repeatCount, onCycleComplete]);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    if (isInGap) {
      setIsInGap(false);
      if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
    }
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [isInGap]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
    setIsPlaying(false);
    setIsInGap(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying || isInGap) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, isInGap, pause, play]);

  const restartLoop = useCallback(() => {
    pause();
    setCurrentLoop(1);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [pause]);

  return {
    isPlaying,
    isInGap,
    currentLoop,
    duration,
    currentTime,
    play,
    pause,
    togglePlay,
    restartLoop,
  };
}
