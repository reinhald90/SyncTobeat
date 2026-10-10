export type OnsetEnvelope = {
  envelope: Float32Array;
  frameRate: number; // frame per detik
};

export type TempoEstimate = {
  bpm: number;
  confidence: number; // 0..1
};
