'use client';

import { useMemo, useState } from 'react';
import type { Beat } from '@/types';
import { formatTime, secondsToFrame } from '@/lib/time';

type Props = {
  beats: Beat[];
  fps: number;
  offsetMs: number;
};

const PAGE_SIZE = 50;

export default function BeatTable({ beats, fps, offsetMs }: Props) {
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => {
    const list = beats.map((b, i) => {
      const t = b.time + offsetMs / 1000;
      return {
        index: i + 1,
        time: t,
        frame: secondsToFrame(t, fps),
        isStrong: b.isStrong
      };
    });
    return showAll ? list : list.slice(0, PAGE_SIZE);
  }, [beats, fps, offsetMs, showAll]);

  if (beats.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h2>5. Daftar beat</h2>
      <p className="hint small">
        Total {beats.length} beat. Kuat = aksen (biasanya setiap 4 beat).
      </p>
      <div className="table-wrap">
        <table className="beat-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Waktu</th>
              <th>Frame</th>
              <th>Jenis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.index} className={r.isStrong ? 'strong' : ''}>
                <td>{r.index}</td>
                <td>{formatTime(r.time)}</td>
                <td>{r.frame}</td>
                <td>{r.isStrong ? 'Kuat' : 'Biasa'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!showAll && beats.length > PAGE_SIZE && (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setShowAll(true)}
        >
          Tampilkan semua ({beats.length})
        </button>
      )}
    </section>
  );
}
