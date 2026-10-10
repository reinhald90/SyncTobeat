'use client';

import { useState } from 'react';
import type { Beat } from '@/types';
import { toCsv } from '@/lib/export/toCsv';
import { toJson } from '@/lib/export/toJson';
import { toMarkerText } from '@/lib/export/toMarkerText';

type Props = {
  beats: Beat[];
  fps: number;
  offsetMs: number;
  bpm: number;
  fileName: string;
};

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // beri jeda sebelum revoke
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportPanel({
  beats,
  fps,
  offsetMs,
  bpm,
  fileName
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const base = fileName.replace(/\.[^.]+$/, '') || 'synctobeat';

  const handleJson = () => {
    download(`${base}.synctobeat.json`, toJson(beats, fps, offsetMs, bpm, fileName), 'application/json');
  };
  const handleCsv = () => {
    download(`${base}.beats.csv`, toCsv(beats, fps, offsetMs), 'text/csv');
  };
  const handleTxt = () => {
    download(`${base}.markers.txt`, toMarkerText(beats, fps, offsetMs), 'text/plain');
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied('Gagal menyalin');
      setTimeout(() => setCopied(null), 1500);
    }
  };

  if (beats.length === 0) return null;

  return (
    <section className="card">
      <h2>6. Ekspor</h2>
      <p className="hint small">
        Format JSON &amp; CSV cocok untuk skrip/otomatisasi. Format TXT cocok
        disalin sebagai marker.
      </p>
      <div className="export-buttons">
        <button type="button" className="btn btn-primary btn-block" onClick={handleJson}>
          Unduh JSON
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={handleCsv}>
          Unduh CSV
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={handleTxt}>
          Unduh Marker TXT
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => copy('txt', toMarkerText(beats, fps, offsetMs))}
        >
          Salin Marker TXT
        </button>
      </div>
      {copied && <p className="hint small">Tersalin: {copied}</p>}
    </section>
  );
}
