import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // eslint and TypeScript are enforced during builds (lint + typecheck pass cleanly).
  async rewrites() {
    // In development, Next.js (port 5173) proxies /api, /uploads, /socket.io
    // to the Express backend (port 5000). In production both run on the same
    // host, so relative rewrites are correct. Allow override via env for
    // custom deployments (e.g. separate API host).
    const isDev = process.env.NODE_ENV === 'development';
    const apiBase = isDev
      ? (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000')
      : (process.env.NEXT_PUBLIC_API_BASE || '');
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
