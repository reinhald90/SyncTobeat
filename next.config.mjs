/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Web Worker dengan sintaks new Worker(new URL(...), import.meta.url)
    // sudah didukung webpack 5 secara default. Tidak ada konfigurasi tambahan.
    return config;
  }
};

export default nextConfig;
