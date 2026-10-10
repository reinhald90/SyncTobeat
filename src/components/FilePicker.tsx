'use client';

import { useRef } from 'react';

type Props = {
  file: File | null;
  onFile: (file: File) => void;
  error?: string | null;
};

export default function FilePicker({ file, onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="card">
      <h2>1. Pilih file musik</h2>
      <p className="hint">Ambil file MP3/WAV/M4A dari penyimpanan HP kamu.</p>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          // reset supaya bisa pilih file yang sama lagi
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => inputRef.current?.click()}
      >
        Pilih dari HP
      </button>
      {file && (
        <p className="file-info">
          <strong>{file.name}</strong>
          <br />
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
