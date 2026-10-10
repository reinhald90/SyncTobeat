export type Beat = {
  time: number;      // detik dari awal lagu
  strength: number;  // 0..1 kekuatan onset
  isStrong: boolean; // downbeat / aksen
};

export type AnalysisResult = {
  beats: Beat[];
  bpm: number;
  confidence: number; // 0..1
  envelope: Float32Array;
  frameRate: number;  // frame per detik pada envelope
  duration: number;   // detik
};

export type DecodedAudio = {
  playbackBuffer: AudioBuffer;
  samples: Float32Array; // mono 22050 Hz
  sampleRate: number;
  duration: number;
};
