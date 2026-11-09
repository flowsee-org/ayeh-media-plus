# AGENTS.md

## Project Context

This is the **Ayeh Media Plus (آیه پلاس)** web application repository. It operates completely independently with **pnpm**, **Next.js 15 App Router** (with SSG, ISR, SSR, and CSR rendering patterns), **React 19**, an integrated Node.js + Express backend, **SQLite (development) or PostgreSQL (production)** via Prisma ORM, and Socket.io for real-time live streaming and messaging.

### Database Support
- **Development**: SQLite (`file:./dev.db`) — zero-config, file-based
- **Production**: PostgreSQL — scalable, multi-instance ready
- Switch providers via `DATABASE_PROVIDER` env var in `.env`

## Key Files & Structure

- `src/app/`: Next.js 15 App Router structure:
  - `src/app/layout.jsx`: Root layout (fonts, metadata, providers).
  - `src/app/providers.jsx`: Client providers (Auth, Audio, TanStack Query, Toasters).
  - `src/app/(auth)/`: Authentication routes (CSR).
  - `src/app/(main)/`: Main application shell with `Layout`, `BottomNav`, and dynamic routes:
    - **SSG**: `/verse/[surah]/[ayah]` (pre-rendered popular verses with `generateStaticParams`), `/topics`, `/quran`.
    - **ISR**: `/scholars` (revalidate: 1h), `/collections` (revalidate: 30m), `/verse/...` (revalidate: 1d).
    - **SSR**: `/` (Home), `/community` (Live feed & discussions).
    - **CSR**: `/live` (WebRTC + Socket.io), `/studio` (Canvas), `/assistant` (AI Chat), `/admin`, `/profile`.
- `src/views/`: Interactive view components (Quran, Khatm, Live, Community, etc.).
- `src/lib/router-compat.jsx`: High-compatibility routing adapter backed natively by `next/navigation` and `next/link`.
- `src/api/base44Client.js`: In-repo compatibility adapter providing `auth`, `entities`, `integrations.Core`, and `actors.LiveRoom`.
- `server/`: Node.js Express backend:
  - `server/index.js`: Express app entry point (port 5000).
  - `server/db.js`: Prisma client instance.
  - `server/prisma/schema.prisma`: SQLite database schema.
  - `server/prisma/seed.js`: Database seeding script.
  - `server/routes/`: Auth, Entity CRUD, Uploads, and AI integration routes.
  - `server/socket.js`: Real-time Socket.io LiveRoom & presence handlers.
- `next.config.mjs`: Next.js configuration with rewrites for `/api`, `/uploads`, and `/socket.io` proxying to Express backend.
- `pnpm-workspace.yaml` & `.npmrc`: pnpm package manager configuration (`node-linker=hoisted`).
- `.env`: Environment variables (`PORT=5000`, `DATABASE_URL`, `JWT_SECRET`, optional `OPENAI_API_KEY`, `GEMINI_API_KEY`).

## Development Commands (pnpm)

- `pnpm dev`: Runs both the Express backend (port 5000) and the Next.js frontend (port 5173) concurrently.
- `pnpm server`: Runs only the backend.
- `pnpm client`: Runs only the Next.js frontend dev server (`next dev -p 5173`).
- `pnpm seed`: Seeds the SQLite database with initial users, scholars, curated verses, topics, and posts.
- `pnpm db:init`: Initializes the database (detects provider from .env, runs seed).
- `pnpm db:generate`: Generates Prisma Client for the configured provider.
- `pnpm db:push`: Pushes schema to database (development).
- `pnpm db:migrate`: Deploys Prisma migrations (production).
- `pnpm db:studio`: Opens Prisma Studio database GUI.
- `pnpm build`: Compiles the Next.js application for production (generating SSG, ISR, and SSR routes).
- `pnpm start`: Starts the Next.js production server on port 5173.
- `pnpm lint`: Runs ESLint checks.
