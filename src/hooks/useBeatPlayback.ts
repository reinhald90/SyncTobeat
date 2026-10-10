'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Beat } from '@/types';

type Options = {
  onBeat?: (index: number, beat: Beat) => void;
};

export function useBeatPlayback(beats: Beat[], options: Options = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastBeatIdxRef = useRef(-1);
  const { onBeat } = options;

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const d = audio.duration || 0;
    const target = Math.max(0, Math.min(t, d));
    audio.currentTime = target;
    setCurrentTime(target);
  }, []);

  // rAF loop: perbarui currentTime agar playhead & beat trigger presisi
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) setCurrentTime(audio.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Deteksi beat yang terlewat
  useEffect(() => {
    const t = currentTime;
    if (beats.length === 0) {
      lastBeatIdxRef.current = -1;
      return;
    }
    const lastIdx = lastBeatIdxRef.current;
    const lastTime = lastIdx >= 0 ? beats[lastIdx].time : -Infinity;

    // Lompat mundur -> reset tanpa memicu beat
    if (t < lastTime - 0.001) {
      let newIdx = -1;
      for (let i = 0; i < beats.length; i++) {
        if (beats[i].time <= t) newIdx = i;
        else break;
      }
      lastBeatIdxRef.current = newIdx;
      return;
    }

    let idx = lastIdx;
    while (idx + 1 < beats.length && beats[idx + 1].time <= t) {
      idx++;
      if (onBeat) onBeat(idx, beats[idx]);
    }
    lastBeatIdxRef.current = idx;
  }, [currentTime, beats, onBeat]);

  // Event listener audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      lastBeatIdxRef.current = -1;
    };
    const onLoaded = () => setDuration(audio.duration || 0);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoaded);
    if (audio.duration) setDuration(audio.duration);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);

  const resetBeats = useCallback(() => {
    lastBeatIdxRef.current = -1;
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    pause,
    seek,
    resetBeats
  };
}
