'use client';

import { useRef, useState } from 'react';

type Props = {
  fps: number;
  onFpsChange: (fps: number) => void;
  sensitivity: number;
  onSensitivityChange: (s: number) => void;
  offsetMs: number;
  onOffsetChange: (ms: number) => void;
  bpm: number;
  onBpmChange: (b: number) => void;
  onReanalyze: () => void;
  disabled: boolean;
};

const FPS_OPTIONS = [24, 30, 60];

export default function SettingsPanel({
  fps,
  onFpsChange,
  sensitivity,
  onSensitivityChange,
  offsetMs,
  onOffsetChange,
  bpm,
  onBpmChange,
  onReanalyze,
  disabled
}: Props) {
  const tapsRef = useRef<number[]>([]);
  const [tapBpm, setTapBpm] = useState<number | null>(null);

  const handleTap = () => {
    const now = performance.now();
    const taps = tapsRef.current;
    // reset kalau jeda terlalu lama (>2 detik)
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avg > 0) {
        const computed = 60000 / avg;
        if (computed >= 40 && computed <= 300) {
          setTapBpm(Math.round(computed));
        }
      }
    }
  };

  const applyTapBpm = () => {
    if (tapBpm) onBpmChange(tapBpm);
  };

  return (
    <section className="card">
      <h2>4. Pengaturan</h2>

      <div className="setting-block">
        <label className="setting-label" htmlFor="fps-select">
          FPS video
        </label>
        <div className="fps-buttons">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${fps === f ? ' chip-active' : ''}`}
              onClick={() => onFpsChange(f)}
            >
              {f} fps
            </button>
          ))}
        </div>
      </div>

      <div className="setting-block">
        <label className="setting-label" htmlFor="sensitivity-range">
          Sensitivitas deteksi: <strong>{sensitivity.toFixed(2)}x</strong>
        </label>
        <input
          id="sensitivity-range"
          type="range"
          min={0.5}
          max={2.5}
          step={0.05}
          value={sensitivity}
          onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
        />
        <p className="hint small">
          Nilai lebih tinggi = lebih banyak beat terdeteksi (termasuk yang lemah).
        </p>
      </div>

      <div className="setting-block">
        <label className="setting-label" htmlFor="offset-input">
          Offset manual (ms)
        </label>
        <input
          id="offset-input"
          type="number"
          step={1}
          value={offsetMs}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onOffsetChange(isNaN(v) ? 0 : v);
          }}
          className="input"
        />
        <p className="hint small">
          Geser semua beat ke depan (+) atau ke belakang (−).
        </p>
      </div>

      <div className="setting-block">
        <label className="setting-label" htmlFor="bpm-input">
          BPM
        </label>
        <div className="bpm-row">
          <input
            id="bpm-input"
            type="number"
            step={0.5}
            min={40}
            max={300}
            value={Math.round(bpm * 10) / 10}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onBpmChange(v);
            }}
            className="input"
          />
          <button type="button" className="btn btn-secondary" onClick={handleTap}>
            Tap Tempo
          </button>
          {tapBpm !== null && (
            <button type="button" className="btn btn-secondary" onClick={applyTapBpm}>
              Pakai {tapBpm}
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={onReanalyze}
        disabled={disabled}
      >
        Analisis Ulang dengan Pengaturan Ini
      </button>
    </section>
  );
}
