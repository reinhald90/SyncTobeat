'use client';

import { useEffect, useRef } from 'react';
import type { Beat } from '@/types';

type Props = {
  samples: Float32Array | null;
  beats: Beat[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
};

export default function WaveformCanvas({
  samples,
  beats,
  duration,
  currentTime,
  onSeek
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2 + 0.5);
    ctx.lineTo(w, h / 2 + 0.5);
    ctx.stroke();

    // Waveform
    if (samples && samples.length > 0) {
      const mid = h / 2;
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const step = Math.max(1, Math.floor(samples.length / w));
      for (let x = 0; x < w; x++) {
        const start = x * step;
        const end = Math.min(start + step, samples.length);
        let min = 1;
        let max = -1;
        for (let i = start; i < end; i++) {
          const v = samples[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        const y1 = mid - max * mid * 0.9;
        const y2 = mid - min * mid * 0.9;
        ctx.moveTo(x + 0.5, y1);
        ctx.lineTo(x + 0.5, y2);
      }
      ctx.stroke();
    }

    // Beat markers
    if (duration > 0 && beats.length > 0) {
      for (const b of beats) {
        const x = (b.time / duration) * w;
        if (x < 0 || x > w) continue;
        ctx.strokeStyle = b.isStrong ? '#1d4ed8' : '#9ca3af';
        ctx.lineWidth = b.isStrong ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }

    // Playhead
    if (duration > 0) {
      const x = (currentTime / duration) * w;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }, [samples, beats, duration, currentTime]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="waveform-wrap">
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        onClick={handleClick}
        aria-label="Waveform audio, klik untuk lompat posisi"
      />
      <p className="hint small">Sentuh waveform untuk lompat ke posisi tertentu.</p>
    </div>
  );
}
