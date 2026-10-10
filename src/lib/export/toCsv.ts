import type { Beat } from '@/types';
import { formatTime, secondsToFrame } from '../time';

export function toCsv(beats: Beat[], fps: number, offsetMs = 0): string {
  const lines: string[] = [];
  lines.push('index,time_seconds,time_formatted,frame,strength,strong');
  beats.forEach((b, i) => {
    const t = b.time + offsetMs / 1000;
    lines.push(
      [
        i + 1,
        t.toFixed(4),
        formatTime(t),
        secondsToFrame(t, fps),
        b.strength.toFixed(4),
        b.isStrong ? '1' : '0'
      ].join(',')
    );
  });
  return lines.join('\n');
}
