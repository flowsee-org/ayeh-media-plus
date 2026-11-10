import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {},
  // Minimal runtime image for Docker (`pnpm build` → `.next/standalone`).
  // public/ and .next/static must be copied beside standalone/server.js in the image.
  output: 'standalone',
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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'src/lib/router-compat.jsx'),
    };
    return config;
  },
};

export default nextConfig;
