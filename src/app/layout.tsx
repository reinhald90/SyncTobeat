import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synctobeat — Deteksi Beat untuk Editor JJ',
  description:
    'Deteksi posisi beat pada file musik langsung di HP. Untuk editor video jedag-jedug.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="/">
              Synctobeat
            </a>
            <nav className="nav">
              <a href="/">Beranda</a>
              <a href="/panduan">Panduan</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <p>Synctobeat — semua proses audio terjadi di HP kamu, tanpa server.</p>
        </footer>
      </body>
    </html>
  );
}
