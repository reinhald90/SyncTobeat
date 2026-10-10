/// <reference lib="webworker" />

import { computeOnsetEnvelope } from '../lib/audio/onset';
import { estimateTempo } from '../lib/audio/tempo';
import { trackBeats, findStrongBeats } from '../lib/audio/beatTracking';
import type { Beat } from '../types';

type WorkerRequest = {
  type: 'analyze';
  samples: Float32Array;
  sampleRate: number;
  sensitivity: number;
  bpmOverride?: number;
};

type WorkerResult = {
  beats: Beat[];
  bpm: number;
  confidence: number;
  envelope: Float32Array;
  frameRate: number;
  duration: number;
};

type WorkerResponse =
  | { type: 'progress'; value: number }
  | { type: 'result'; result: WorkerResult }
  | { type: 'error'; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function postProgress(value: number) {
  const msg: WorkerResponse = { type: 'progress', value };
  ctx.postMessage(msg);
}

function postError(message: string) {
  const msg: WorkerResponse = { type: 'error', message };
  ctx.postMessage(msg);
}

function postResult(result: WorkerResult) {
  const msg: WorkerResponse = { type: 'result', result };
  // Transfer buffer envelope
  ctx.postMessage(msg, [result.envelope.buffer]);
}

ctx.addEventListener('message', (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  if (!msg || msg.type !== 'analyze') return;

  try {
    postProgress(5);

    // 1. Onset strength envelope
    const { envelope, frameRate } = computeOnsetEnvelope(
      msg.samples,
      msg.sampleRate
    );
    if (envelope.length === 0) {
      throw new Error('Audio terlalu pendek untuk dianalisis.');
    }
    postProgress(40);

    // 2. Terapkan sensitivitas: eksponen pada envelope
    //    sensitivitas tinggi -> kurva dinaikkan -> onset lemah lebih terlihat
    const sens = Math.max(0.1, Math.min(4, msg.sensitivity || 1));
    const power = 1 / sens;
    for (let i = 0; i < envelope.length; i++) {
      envelope[i] = Math.pow(envelope[i], power);
    }
    postProgress(55);

    // 3. Estimasi BPM
    let bpm: number;
    let confidence: number;
    if (msg.bpmOverride && msg.bpmOverride > 0) {
      bpm = msg.bpmOverride;
      confidence = 1;
    } else {
      const tempo = estimateTempo(envelope, frameRate);
      bpm = tempo.bpm;
      confidence = tempo.confidence;
    }
    postProgress(70);

    // 4. DP beat tracking (gaya Ellis)
    const tightness = 100 / sens;
    const beatFrames = trackBeats(envelope, frameRate, bpm, tightness);
    postProgress(88);

    // 5. Downbeat / strong beat labelling (asumsi 4/4)
    const strongFlags = findStrongBeats(beatFrames, envelope);

    const beats: Beat[] = beatFrames.map((f, i) => ({
      time: f / frameRate,
      strength: envelope[f] ?? 0,
      isStrong: strongFlags[i]
    }));

    postProgress(100);
    postResult({
      beats,
      bpm,
      confidence,
      envelope,
      frameRate,
      duration: msg.samples.length / msg.sampleRate
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Gagal memproses audio.';
    postError(message);
  }
});

export {};
