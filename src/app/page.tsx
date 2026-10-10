'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FilePicker from '@/components/FilePicker';
import WaveformCanvas from '@/components/WaveformCanvas';
import BeatPlayer from '@/components/BeatPlayer';
import SettingsPanel from '@/components/SettingsPanel';
import BeatTable from '@/components/BeatTable';
import ExportPanel from '@/components/ExportPanel';
import { useAnalyzer } from '@/hooks/useAnalyzer';
import { useBeatPlayback } from '@/hooks/useBeatPlayback';
import type { AnalysisResult, Beat } from '@/types';

type TapFn = (() => void) | undefined;

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [fps, setFps] = useState(30);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [offsetMs, setOffsetMs] = useState(0);
  const [bpm, setBpm] = useState(120);

  const [beats, setBeats] = useState<Beat[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [duration, setDuration] = useState(0);

  const [metronome, setMetronome] = useState(true);
  const [blink, setBlink] = useState(false);
  const [vibrate, setVibrate] = useState(false);

  const [flashActive, setFlashActive] = useState(false);
  const [activeBeatIdx, setActiveBeatIdx] = useState(-1);

  const flashTimerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const analyzer = useAnalyzer();

  // Playback hook
  const handleBeat = useCallback(
    (index: number, beat: Beat) => {
      setActiveBeatIdx(index);

      // Klik metronom (lewat helper yang dipasang BeatPlayer)
      if (metronome) {
        const fn = (window as unknown as { __synctobeatClick?: TapFn })
          .__synctobeatClick;
        if (fn) fn();
      }

      if (blink) {
        setFlashActive(true);
        if (flashTimerRef.current !== null) {
          window.clearTimeout(flashTimerRef.current);
        }
        flashTimerRef.current = window.setTimeout(() => {
          setFlashActive(false);
        }, 90);
      }

      if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(beat.isStrong ? 45 : 25);
        } catch {
          // diabaikan
        }
      }
    },
    [metronome, blink, vibrate]
  );

  const { audioRef, isPlaying, currentTime, duration: audioDuration, togglePlay, pause, seek, resetBeats } =
    useBeatPlayback(beats, { onBeat: handleBeat });

  // Set URL audio dari file
  useEffect(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (!file) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    audioUrlRef.current = url;
    setAudioUrl(url);
    return () => {
      // revoke saat file berubah / unmount
      if (audioUrlRef.current === url) {
        URL.revokeObjectURL(url);
        audioUrlRef.current = null;
      }
    };
  }, [file]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    setFileError(null);
    setBeats([]);
    setActiveBeatIdx(-1);
    analyzer.reset();
    // pause & reset playback saat ganti file
    pause();
    resetBeats();
  };

  const handleAnalyze = async () => {
    if (!file) {
      setFileError('Pilih file musik terlebih dahulu.');
      return;
    }
    setFileError(null);
    const res: AnalysisResult | null = await analyzer.analyze(file, sensitivity);
    if (res) {
      setBeats(res.beats);
      setBpm(res.bpm);
      setConfidence(res.confidence);
      setDuration(res.duration);
      resetBeats();
    }
  };

  const handleReanalyze = async () => {
    const res = await analyzer.reanalyze(sensitivity, bpm || undefined);
    if (res) {
      setBeats(res.beats);
      setBpm(res.bpm);
      setConfidence(res.confidence);
      setDuration(res.duration);
      resetBeats();
    }
  };

  const handleSeek = (t: number) => {
    seek(t);
  };

  const activeBeatLabel = useMemo(() => {
    if (activeBeatIdx < 0 || !beats[activeBeatIdx]) return '';
    const b = beats[activeBeatIdx];
    return `Beat #${activeBeatIdx + 1}${b.isStrong ? ' (kuat)' : ''}`;
  }, [activeBeatIdx, beats]);

  const playing = analyzer.status === 'analyzing' || analyzer.status === 'decoding';

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}

      <FilePicker file={file} onFile={handleFile} error={fileError || analyzer.error} />

      <section className="card">
        <h2>2. Analisis</h2>
        <p className="hint">
          Semua proses terjadi di HP kamu — file tidak dikirim ke server.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleAnalyze}
          disabled={!file || playing}
        >
          {playing ? 'Menganalisis…' : 'Analisis'}
        </button>

        {analyzer.status !== 'idle' && (
          <>
            <div className="analysis-progress">
              <div
                className="analysis-progress-fill"
                style={{ width: `${Math.round(analyzer.progress)}%` }}
              />
            </div>
            <p className="progress-label">
              {analyzer.status === 'decoding' && 'Membaca file…'}
              {analyzer.status === 'analyzing' && `Menganalisis… ${Math.round(analyzer.progress)}%`}
              {analyzer.status === 'done' && `Selesai. ${beats.length} beat terdeteksi.`}
              {analyzer.status === 'error' && 'Gagal.'}
            </p>
          </>
        )}

        {beats.length > 0 && (
          <p className="hint small">
            BPM: <strong>{bpm.toFixed(1)}</strong> · Kepercayaan:{' '}
            <strong>{Math.round(confidence * 100)}%</strong> · Durasi:{' '}
            <strong>{duration.toFixed(1)}s</strong>
          </p>
        )}
      </section>

      {beats.length > 0 && (
        <section className="card">
          <h2>Waveform &amp; penanda beat</h2>
          <WaveformCanvas
            samples={analyzer.decoded?.samples ?? null}
            beats={beats}
            duration={duration || audioDuration}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </section>
      )}

      {beats.length > 0 && (
        <BeatPlayer
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={audioDuration || duration}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          metronome={metronome}
          onMetronomeChange={setMetronome}
          blink={blink}
          onBlinkChange={setBlink}
          vibrate={vibrate}
          onVibrateChange={setVibrate}
          flashActive={flashActive}
          activeBeatLabel={activeBeatLabel}
        />
      )}

      {beats.length > 0 && (
        <SettingsPanel
          fps={fps}
          onFpsChange={setFps}
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
          offsetMs={offsetMs}
          onOffsetChange={setOffsetMs}
          bpm={bpm}
          onBpmChange={setBpm}
          onReanalyze={handleReanalyze}
          disabled={playing}
        />
      )}

      {beats.length > 0 && (
        <BeatTable beats={beats} fps={fps} offsetMs={offsetMs} />
      )}

      {beats.length > 0 && file && (
        <ExportPanel
          beats={beats}
          fps={fps}
          offsetMs={offsetMs}
          bpm={bpm}
          fileName={file.name}
        />
      )}
    </>
  );
}
