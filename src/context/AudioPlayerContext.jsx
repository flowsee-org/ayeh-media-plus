import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(null);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const trackRef = useRef(null);

  // Initialize single global Audio instance
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (typeof trackRef.current?.onEnded === "function") {
        trackRef.current.onEnded();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      setSleepTimeRemaining(null);
      return;
    }

    let remainingSeconds = sleepTimerMinutes * 60;
    setSleepTimeRemaining(remainingSeconds);

    sleepTimerRef.current = setInterval(() => {
      remainingSeconds -= 1;
      setSleepTimeRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        clearInterval(sleepTimerRef.current);
        setSleepTimerMinutes(null);
        setSleepTimeRemaining(null);
      }
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerMinutes]);

  const playTrack = useCallback(
    (newTrack) => {
      if (!audioRef.current || !newTrack?.audioUrl) return;

      const audio = audioRef.current;
      const isSameTrack = track?.id === newTrack.id && track?.audioUrl === newTrack.audioUrl;

      if (isSameTrack) {
        if (newTrack.onEnded) {
          trackRef.current = { ...track, onEnded: newTrack.onEnded };
          setTrack((prev) => ({ ...prev, onEnded: newTrack.onEnded }));
        }
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        return;
      }

      setTrack(newTrack);
      trackRef.current = newTrack;
      setCurrentTime(0);
      setDuration(0);

      audio.src = newTrack.audioUrl;
      audio.playbackRate = playbackRate;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    },
    [track, playbackRate]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !track) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [track]);

  const seek = useCallback((seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || 0));
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  const seekRelative = useCallback((deltaSeconds) => {
    if (!audioRef.current) return;
    const next = audioRef.current.currentTime + deltaSeconds;
    audioRef.current.currentTime = Math.max(0, Math.min(next, audioRef.current.duration || 0));
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRateState(rate);
  }, []);

  const setSleepTimer = useCallback((minutes) => {
    setSleepTimerMinutes(minutes);
  }, []);

  const jumpChapter = useCallback(
    (seconds) => {
      seek(seconds);
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    },
    [seek]
  );

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setTrack(null);
    setIsPlaying(false);
    setIsExpanded(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        track,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        sleepTimerMinutes,
        sleepTimeRemaining,
        isExpanded,
        playTrack,
        togglePlay,
        seek,
        seekRelative,
        setPlaybackRate,
        setSleepTimer,
        jumpChapter,
        setIsExpanded,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return ctx;
}
