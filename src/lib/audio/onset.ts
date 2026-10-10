import { fft } from './fft';
import type { OnsetEnvelope } from './types';

const WINDOW_SIZE = 1024;
const HOP_SIZE = 256;
const NUM_MEL_BANDS = 40;

function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}
function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1);
}

/**
 * Buat filterbank mel (triangular) untuk spektrum magnitudo.
 */
function createMelFilterbank(
  numBands: number,
  fftSize: number,
  sampleRate: number
): Float32Array[] {
  const numBins = Math.floor(fftSize / 2) + 1;
  const fMin = 30;
  const fMax = sampleRate / 2;
  const melMin = hzToMel(fMin);
  const melMax = hzToMel(fMax);

  const melPoints: number[] = [];
  for (let i = 0; i < numBands + 2; i++) {
    melPoints.push(melMin + ((melMax - melMin) * i) / (numBands + 1));
  }
  const binPoints = melPoints.map((m) =>
    Math.floor(((fftSize + 1) * melToHz(m)) / sampleRate)
  );

  const filters: Float32Array[] = [];
  for (let b = 0; b < numBands; b++) {
    const filter = new Float32Array(numBins);
    const left = binPoints[b];
    const center = binPoints[b + 1];
    const right = binPoints[b + 2];
    for (let k = left; k < center; k++) {
      if (center > left) filter[k] = (k - left) / (center - left);
    }
    for (let k = center; k < right; k++) {
      if (right > center) filter[k] = (right - k) / (right - center);
    }
    filters.push(filter);
  }
  return filters;
}

/**
 * Hitung onset strength envelope dengan spectral flux.
 * Langkah:
 *  1. STFT (window Hann 1024, hop 256)
 *  2. Magnitudo -> filterbank mel -> log(1 + x)
 *  3. Spectral flux: jumlah kenaikan energi antar frame (half-wave rectified)
 *  4. Normalisasi ke 0..1
 */
export function computeOnsetEnvelope(
  samples: Float32Array,
  sampleRate: number
): OnsetEnvelope {
  const n = samples.length;
  const frameRate = sampleRate / HOP_SIZE;

  if (n < WINDOW_SIZE) {
    return { envelope: new Float32Array(0), frameRate };
  }

  // Hann window
  const win = new Float32Array(WINDOW_SIZE);
  for (let i = 0; i < WINDOW_SIZE; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (WINDOW_SIZE - 1)));
  }

  const melFilters = createMelFilterbank(NUM_MEL_BANDS, WINDOW_SIZE, sampleRate);
  const numFrames = Math.floor((n - WINDOW_SIZE) / HOP_SIZE) + 1;

  const re = new Float32Array(WINDOW_SIZE);
  const im = new Float32Array(WINDOW_SIZE);
  const mag = new Float32Array(WINDOW_SIZE / 2 + 1);

  const bands = new Float32Array(numFrames * NUM_MEL_BANDS);

  for (let f = 0; f < numFrames; f++) {
    const start = f * HOP_SIZE;
    for (let i = 0; i < WINDOW_SIZE; i++) {
      re[i] = samples[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);

    for (let i = 0; i <= WINDOW_SIZE / 2; i++) {
      mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
    }

    for (let b = 0; b < NUM_MEL_BANDS; b++) {
      const filter = melFilters[b];
      let sum = 0;
      for (let k = 0; k < filter.length; k++) {
        const w = filter[k];
        if (w > 0) sum += mag[k] * w;
      }
      bands[f * NUM_MEL_BANDS + b] = Math.log1p(sum);
    }
  }

  // Spectral flux
  const flux = new Float32Array(numFrames);
  for (let f = 1; f < numFrames; f++) {
    let sum = 0;
    const off = f * NUM_MEL_BANDS;
    const prev = (f - 1) * NUM_MEL_BANDS;
    for (let b = 0; b < NUM_MEL_BANDS; b++) {
      const d = bands[off + b] - bands[prev + b];
      if (d > 0) sum += d;
    }
    flux[f] = sum;
  }

  // Normalisasi
  let max = 0;
  for (let i = 0; i < numFrames; i++) if (flux[i] > max) max = flux[i];
  if (max > 0) {
    for (let i = 0; i < numFrames; i++) flux[i] /= max;
  }

  return { envelope: flux, frameRate };
}
