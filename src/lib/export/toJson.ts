import type { Beat } from '@/types';
import { secondsToFrame } from '../time';

export function toJson(
  beats: Beat[],
  fps: number,
  offsetMs: number,
  bpm: number,
  fileName: string
): string {
  const payload = {
    app: 'Synctobeat',
    file: fileName,
    bpm: Math.round(bpm * 100) / 100,
    fps,
    offsetMs,
    count: beats.length,
    beats: beats.map((b, i) => {
      const t = b.time + offsetMs / 1000;
      return {
        index: i + 1,
        time: Math.round(t * 10000) / 10000,
        frame: secondsToFrame(t, fps),
        strength: Math.round(b.strength * 10000) / 10000,
        isStrong: b.isStrong
      };
    })
  };
  return JSON.stringify(payload, null, 2);
}
