/**
 * Beat tracking dengan dynamic programming (Ellis 2007).
 * Untuk setiap frame i, cari pendahulu j di sekitar i-period yang
 * memaksimalkan score[j] + env[i] - tightness * (i - j - period)^2.
 */
export function trackBeats(
  envelope: Float32Array,
  frameRate: number,
  bpm: number,
  tightness = 100
): number[] {
  const n = envelope.length;
  if (n === 0) return [];
  const bpmSafe = Math.max(30, Math.min(300, bpm));
  const period = (60 * frameRate) / bpmSafe;
  if (period < 2) return [];

  // Normalisasi envelope
  let max = 0;
  for (let i = 0; i < n; i++) if (envelope[i] > max) max = envelope[i];
  const env = new Float32Array(n);
  if (max > 0) for (let i = 0; i < n; i++) env[i] = envelope[i] / max;
  else env.set(envelope);

  const score = new Float32Array(n);
  const backlink = new Int32Array(n).fill(-1);

  for (let i = 0; i < n; i++) {
    score[i] = env[i];
    const jStart = Math.max(0, Math.floor(i - 2 * period));
    const jEnd = Math.max(0, Math.floor(i - period * 0.5));
    for (let j = jStart; j <= jEnd; j++) {
      const d = i - j - period;
      const penalty = -tightness * d * d;
      const cand = score[j] + penalty;
      if (cand > score[i]) {
        score[i] = env[i] + cand;
        backlink[i] = j;
      }
    }
  }

  // Traceback dari skor tertinggi
  let bestIdx = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < n; i++) {
    if (score[i] > bestVal) {
      bestVal = score[i];
      bestIdx = i;
    }
  }
  const beats: number[] = [];
  let cur = bestIdx;
  const guard = new Set<number>();
  while (cur >= 0 && !guard.has(cur)) {
    guard.add(cur);
    beats.push(cur);
    cur = backlink[cur];
  }
  beats.reverse();
  return beats;
}

/**
 * Tentukan beat kuat (downbeat) dengan asumsi 4/4:
 * pilih posisi fase (0-3) dengan rata-rata energi tertinggi.
 */
export function findStrongBeats(
  beatFrames: number[],
  envelope: Float32Array
): boolean[] {
  const res = new Array<boolean>(beatFrames.length).fill(false);
  if (beatFrames.length < 4) return res;

  const sums = [0, 0, 0, 0];
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < beatFrames.length; i++) {
    const phase = i % 4;
    const e = envelope[beatFrames[i]] ?? 0;
    sums[phase] += e;
    counts[phase]++;
  }
  let bestPhase = 0;
  let bestAvg = -Infinity;
  for (let p = 0; p < 4; p++) {
    const avg = counts[p] > 0 ? sums[p] / counts[p] : 0;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestPhase = p;
    }
  }
  for (let i = bestPhase; i < beatFrames.length; i += 4) res[i] = true;
  return res;
}
