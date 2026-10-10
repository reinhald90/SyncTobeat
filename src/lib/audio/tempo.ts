import type { TempoEstimate } from './types';

/**
 * Estimasi BPM dengan autocorrelation pada onset envelope.
 * Rentang: 60-200 BPM. Resolusi half/double tempo diperiksa ulang.
 */
export function estimateTempo(
  envelope: Float32Array,
  frameRate: number
): TempoEstimate {
  const n = envelope.length;
  if (n < 8) return { bpm: 120, confidence: 0 };

  // Rata-rata
  let mean = 0;
  for (let i = 0; i < n; i++) mean += envelope[i];
  mean /= n;

  const centered = new Float32Array(n);
  for (let i = 0; i < n; i++) centered[i] = envelope[i] - mean;

  const minBPM = 60;
  const maxBPM = 200;
  const minLag = Math.max(1, Math.floor((60 * frameRate) / maxBPM));
  const maxLag = Math.min(n - 1, Math.ceil((60 * frameRate) / minBPM));

  const ac = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const count = n - lag;
    for (let i = 0; i < count; i++) {
      sum += centered[i] * centered[i + lag];
    }
    ac[lag] = count > 0 ? sum / count : 0;
  }

  // Cari puncak lokal
  type Cand = { bpm: number; score: number; lag: number };
  const cands: Cand[] = [];
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (ac[lag] > ac[lag - 1] && ac[lag] >= ac[lag + 1] && ac[lag] > 0) {
      cands.push({ bpm: (60 * frameRate) / lag, score: ac[lag], lag });
    }
  }

  if (cands.length === 0) {
    let bestLag = minLag;
    let bestVal = -Infinity;
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (ac[lag] > bestVal) {
        bestVal = ac[lag];
        bestLag = lag;
      }
    }
    return { bpm: (60 * frameRate) / bestLag, confidence: 0.2 };
  }

  cands.sort((a, b) => b.score - a.score);
  let best = cands[0];

  // Prefer BPM di rentang nyaman untuk JJ (90-180)
  for (const c of cands) {
    if (c.bpm >= 90 && c.bpm <= 180 && c.score >= best.score * 0.75) {
      best = c;
      break;
    }
  }

  // Koreksi half/double tempo
  const dbl = best.bpm * 2;
  const hlf = best.bpm / 2;
  if (dbl <= maxBPM && dbl >= 90) {
    const c = cands.find((x) => Math.abs(x.bpm - dbl) < 3);
    if (c && c.score > best.score * 1.15) best = c;
  }
  if (hlf >= minBPM && hlf <= 200) {
    const c = cands.find((x) => Math.abs(x.bpm - hlf) < 3);
    if (c && c.score > best.score * 1.15) best = c;
  }

  // Confidence = rasio skor puncak terbaik terhadap rata-rata autokorelasi
  let acMean = 0;
  let acCount = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (ac[lag] > 0) {
      acMean += ac[lag];
      acCount++;
    }
  }
  acMean = acCount > 0 ? acMean / acCount : 1;
  const confidence = Math.max(0, Math.min(1, best.score / (acMean * 4 + 1e-9)));

  return { bpm: best.bpm, confidence };
}
