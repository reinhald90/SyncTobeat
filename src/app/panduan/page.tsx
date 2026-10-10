import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panduan — Synctobeat',
  description: 'Cara pakai Synctobeat untuk editor video jedag-jedug.'
};

export default function PanduanPage() {
  return (
    <article className="panduan">
      <h1>Panduan Singkat untuk Editor JJ</h1>
      <p>
        Synctobeat membantu kamu menemukan <strong>titik beat</strong> pada lagu,
        supaya potongan video jedag-jedug pas dengan musiknya. Semua berjalan di
        HP kamu, tidak perlu internet setelah halaman terbuka.
      </p>

      <h2>Langkah-langkah</h2>
      <ol>
        <li>
          <strong>Pilih file musik.</strong> Tekan tombol <em>Pilih dari HP</em>,
          lalu pilih lagu dari penyimpanan (MP3, WAV, M4A, OGG).
        </li>
        <li>
          <strong>Tekan Analisis.</strong> Tunggu sampai progress selesai.
          Hasilnya berupa daftar beat dan BPM.
        </li>
        <li>
          <strong>Lihat waveform.</strong> Garis biru tebal = beat kuat (aksen),
          garis abu-abu tipis = beat biasa. Sentuh waveform untuk lompat ke
          bagian lagu tertentu.
        </li>
        <li>
          <strong>Putar lagunya.</strong> Aktifkan <em>Klik metronom</em>,
          <em>Layar berkedip</em>, dan <em>Getar HP</em> supaya kamu bisa
          merasakan beat walaupun telinga sedang capek.
        </li>
        <li>
          <strong>Sesuaikan FPS.</strong> Pilih 24, 30, atau 60 fps sesuai
          project kamu. Kolom <em>Frame</em> akan berubah otomatis.
        </li>
        <li>
          <strong>Atur offset kalau perlu.</strong> Kalau beat terasa maju atau
          mundur, geser offset manual (ms). Nilai positif = maju, negatif =
          mundur.
        </li>
        <li>
          <strong>Ekspor.</strong> Unduh JSON, CSV, atau TXT marker. File bisa
          dipakai di script editor atau disalin manual ke timeline.
        </li>
      </ol>

      <h2>Tips supaya akurat</h2>
      <ul>
        <li>
          Pakai file <strong>MP3/WAV asli</strong>, bukan rekaman dari HP.
          Rekaman sering menggeser timing.
        </li>
        <li>
          Kalau beat terdeteksi dua kali terlalu cepat (double tempo), turunkan
          BPM manual di panel pengaturan ke setengahnya.
        </li>
        <li>
          Kalau banyak beat aneh, turunkan <em>sensitivitas</em> ke sekitar 0,8.
        </li>
        <li>
          Kalau ada beat yang hilang, naikkan <em>sensitivitas</em> ke sekitar
          1,4.
        </li>
      </ul>

      <h2>Contoh alur kerja</h2>
      <ol>
        <li>Analisis lagu → catat BPM.</li>
        <li>Atur FPS sesuai project (misalnya 30).</li>
        <li>Ekspor TXT marker.</li>
        <li>
          Buka editor video, salin setiap marker ke timeline (biasanya ada
          fitur &ldquo;import marker&rdquo;).
        </li>
        <li>Potong klip tepat di marker beat kuat.</li>
      </ol>

      <h2>Pertanyaan umum</h2>
      <p>
        <strong>Apakah file saya diunggah ke server?</strong> Tidak. Semua
        diproses di HP kamu.
      </p>
      <p>
        <strong>Kenapa hasil bisa beda-beda?</strong> Setiap lagu punya
        struktur berbeda. Untuk lagu dengan beat yang tebal dan stabil,
        akurasi tinggi; untuk lagu ambient/ritmis rumit, gunakan
        sensitivitas/offset manual.
      </p>
      <p>
        <strong>Bisa dipakai offline?</strong> Ya, setelah halaman terbuka
        pertama kali, analisis berjalan tanpa internet.
      </p>
    </article>
  );
}
