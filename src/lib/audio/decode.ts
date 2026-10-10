import type { DecodedAudio } from '@/types';

const TARGET_SAMPLE_RATE = 22050;
const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

/**
 * Decode file audio menjadi:
 *  - playbackBuffer: AudioBuffer asli (untuk diputar)
 *  - samples: mono, 22050 Hz, Float32 (untuk analisis)
 */
export async function decodeAudioFile(file: File): Promise<DecodedAudio> {
  if (!file) throw new Error('Tidak ada file yang dipilih.');
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File terlalu besar (maksimal 200 MB).');
  }
  if (file.type && !file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|ogg|flac|opus)$/i.test(file.name)) {
    throw new Error('File bukan audio yang didukung. Gunakan MP3, WAV, M4A, OGG, atau FLAC.');
  }

  const arrayBuffer = await file.arrayBuffer();

  const AudioCtx: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    throw new Error('Browser ini tidak mendukung Web Audio API.');
  }

  const ctx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    throw new Error('Gagal membaca file audio. File mungkin rusak atau format tidak didukung.');
  } finally {
    // Tutup context segera setelah decode
    void ctx.close();
  }

  const duration = decoded.duration;
  const length = Math.max(1, Math.ceil(duration * TARGET_SAMPLE_RATE));

  // Offline render untuk resample ke 22050 Hz mono
  const offline = new OfflineAudioContext(1, length, TARGET_SAMPLE_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();

  return {
    playbackBuffer: decoded,
    samples: rendered.getChannelData(0),
    sampleRate: TARGET_SAMPLE_RATE,
    duration
  };
}
