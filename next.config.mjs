import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  turbopack: {},
  // Minimal runtime image for Docker (`pnpm build` → `.next/standalone`).
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.islamic.network' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  // eslint and TypeScript are enforced during builds (lint + typecheck pass cleanly).
  async rewrites() {
    // Development: Next (5173) proxies /api, /uploads, /socket.io → Express (5000).
    // Production (Task 13): prefer an edge reverse proxy (Nginx/Caddy) that routes
    // those paths to Express and everything else to Next. Leave NEXT_PUBLIC_API_BASE
    // empty so the browser uses same-origin paths; do not point it at an
    // unreachable internal Docker hostname.
    // If NEXT_PUBLIC_API_BASE is unset in production, skip Next-level rewrites so
    // empty-string destinations cannot loop back onto the Next process.
    const isDev = process.env.NODE_ENV === 'development';
    const apiBase = isDev
      ? (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000')
      : (process.env.NEXT_PUBLIC_API_BASE || '');
    if (!apiBase) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiBase}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
