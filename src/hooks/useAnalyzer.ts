'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeAudioFile } from '@/lib/audio/decode';
import type { AnalysisResult, DecodedAudio } from '@/types';

type Status = 'idle' | 'decoding' | 'analyzing' | 'done' | 'error';

type WorkerResponse =
  | { type: 'progress'; value: number }
  | { type: 'result'; result: AnalysisResult }
  | { type: 'error'; message: string };

export function useAnalyzer() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [decoded, setDecoded] = useState<DecodedAudio | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const cleanupWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupWorker();
    };
  }, [cleanupWorker]);

  const runWorker = useCallback(
    (dec: DecodedAudio, sensitivity: number, bpmOverride?: number) =>
      new Promise<AnalysisResult>((resolve, reject) => {
        cleanupWorker();
        const worker = new Worker(
          new URL('../workers/analyzer.worker.ts', import.meta.url)
        );
        workerRef.current = worker;

        worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
          const msg = ev.data;
          if (msg.type === 'progress') {
            setProgress(20 + msg.value * 0.8);
          } else if (msg.type === 'result') {
            resolve(msg.result);
            cleanupWorker();
          } else if (msg.type === 'error') {
            reject(new Error(msg.message));
            cleanupWorker();
          }
        };
        worker.onerror = () => {
          reject(new Error('Pemroses audio gagal berjalan.'));
          cleanupWorker();
        };

        worker.postMessage({
          type: 'analyze',
          samples: dec.samples,
          sampleRate: dec.sampleRate,
          sensitivity,
          bpmOverride
        });
      }),
    [cleanupWorker]
  );

  const analyze = useCallback(
    async (
      file: File,
      sensitivity = 1,
      bpmOverride?: number
    ): Promise<AnalysisResult | null> => {
      setError(null);
      setResult(null);
      setProgress(0);
      setStatus('decoding');
      let dec: DecodedAudio;
      try {
        dec = await decodeAudioFile(file);
        setDecoded(dec);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Gagal membaca file audio.';
        setError(msg);
        setStatus('error');
        return null;
      }

      setStatus('analyzing');
      setProgress(20);
      try {
        const res = await runWorker(dec, sensitivity, bpmOverride);
        setResult(res);
        setProgress(100);
        setStatus('done');
        return res;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Gagal menganalisis audio.';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [runWorker]
  );

  const reanalyze = useCallback(
    async (sensitivity: number, bpmOverride?: number) => {
      if (!decoded) return null;
      setStatus('analyzing');
      setProgress(20);
      setError(null);
      try {
        const res = await runWorker(decoded, sensitivity, bpmOverride);
        setResult(res);
        setProgress(100);
        setStatus('done');
        return res;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Gagal menganalisis audio.';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [decoded, runWorker]
  );

  const reset = useCallback(() => {
    cleanupWorker();
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
    setDecoded(null);
  }, [cleanupWorker]);

  return {
    status,
    progress,
    error,
    result,
    decoded,
    analyze,
    reanalyze,
    reset
  };
}
