'use client';

import { useCallback, useEffect, useRef } from 'react';
import { formatTimeShort } from '@/lib/time';

type Props = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  metronome: boolean;
  onMetronomeChange: (v: boolean) => void;
  blink: boolean;
  onBlinkChange: (v: boolean) => void;
  vibrate: boolean;
  onVibrateChange: (v: boolean) => void;
  flashActive: boolean;
  activeBeatLabel: string;
};

export default function BeatPlayer({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  metronome,
  onMetronomeChange,
  blink,
  onBlinkChange,
  vibrate,
  onVibrateChange,
  flashActive,
  activeBeatLabel
}: Props) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const Ctor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      audioCtxRef.current = new Ctor();
    }
    return audioCtxRef.current;
  }, []);

  // Bersihkan AudioContext saat unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Klik metronom dipicu dari parent via `onBeatFired`; di sini hanya menyediakan helper.
  // Dukungan klik publik melalui context global sederhana:
  useEffect(() => {
    const handler = () => {
      if (!metronome) return;
      const ctx = ensureAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1000;
      osc.type = 'square';
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    };
    (window as unknown as { __synctobeatClick?: () => void }).__synctobeatClick = handler;
    return () => {
      delete (window as unknown as { __synctobeatClick?: () => void }).__synctobeatClick;
    };
  }, [metronome, ensureAudioCtx]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <section className="card">
      <h2>3. Putar &amp; rasakan beat</h2>

      <div className="player-row">
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={onTogglePlay}
        >
          {isPlaying ? 'Jeda' : 'Putar'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-large"
          onClick={() => onSeek(0)}
        >
          Ke Awal
        </button>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="time-display">
        <span>{formatTimeShort(currentTime)}</span>
        <span className="muted"> / {formatTimeShort(duration)}</span>
      </div>

      {activeBeatLabel && <p className="beat-status">{activeBeatLabel}</p>}

      <div className="check-list">
        <label className="check-row">
          <input
            type="checkbox"
            checked={metronome}
            onChange={(e) => onMetronomeChange(e.target.checked)}
          />
          <span>Klik metronom di setiap beat</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={blink}
            onChange={(e) => onBlinkChange(e.target.checked)}
          />
          <span>Layar berkedip di setiap beat</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={vibrate}
            onChange={(e) => onVibrateChange(e.target.checked)}
          />
          <span>Getarkan HP (jika didukung)</span>
        </label>
      </div>

      <div
        aria-hidden
        className={`flash-overlay${flashActive ? ' flash-on' : ''}`}
      />
    </section>
  );
}
