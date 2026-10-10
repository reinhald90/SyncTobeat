import type { Beat } from '@/types';
import { formatTime, secondsToFrame } from '../time';

export function toMarkerText(
  beats: Beat[],
  fps: number,
  offsetMs = 0
): string {
  const lines: string[] = [];
  lines.push('# Synctobeat — marker beat');
  lines.push(`# FPS: ${fps} | Offset: ${offsetMs} ms | Total: ${beats.length} beat`);
  beats.forEach((b, i) => {
    const t = b.time + offsetMs / 1000;
    const frame = secondsToFrame(t, fps);
    lines.push(
      `${formatTime(t)}  |  frame ${frame}  |  beat ${i + 1}${b.isStrong ? ' (kuat)' : ''}`
    );
  });
  return lines.join('\n');
}
