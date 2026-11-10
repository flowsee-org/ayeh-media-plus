# AGENTS.md

## Project Context

This is the **Ayeh Media Plus (آیه پلاس)** web application repository. It operates completely independently with **pnpm**, **Next.js 15 App Router** (with SSG, ISR, SSR, and CSR rendering patterns), **React 19**, an integrated Node.js + Express backend, **SQLite (development) or PostgreSQL (production)** via Prisma ORM, and Socket.io for real-time live streaming and messaging.

### Database Support
- **Development**: SQLite (`file:./dev.db`) — zero-config, file-based (`db push`)
- **Production**: PostgreSQL — provisioned with `prisma migrate deploy` (not `db push`)
- Switch runtime URL via `DATABASE_URL` / `DATABASE_PROVIDER` in `.env`

### Canonical schema architecture
- **Canonical source of truth**: `server/prisma/schema.prisma` (`provider = "sqlite"`).
- **Production derivative**: `server/prisma/schema.production.prisma` — generated only by `pnpm db:sync-production-schema` (provider swapped to `postgresql`; models must stay in parity).
- **Parity gate**: `pnpm test:schema` (`scripts/check-schema-parity.mjs`) — fails on any model/field/index drift beyond the provider line.
- **Initial PostgreSQL migration**: `server/prisma/migrations/20261110130000_init_canonical/` (SQL from `prisma migrate diff --from-empty`; apply with `pnpm db:migrate`).
- **Do not** hand-edit `schema.production.prisma` or overwrite applied migration history.

### Prisma Client generation (shared output — last generate wins)
Both schemas emit into the same `@prisma/client` output directory. Two generated clients cannot safely coexist there.

| Environment | Generate with | Then |
|-------------|---------------|------|
| Local / SQLite tests | `pnpm db:generate` | `pnpm db:push` (dev only) |
| PostgreSQL smoke / prod image | `pnpm db:generate:pg` (or `pnpm db:prepare:prod`) | `pnpm db:migrate` against empty/prod URL |
| After a local PG generate | **Always** re-run `pnpm db:generate` before SQLite app/tests | — |

`server/db.js` always imports `@prisma/client`; the active binary/provider is whatever was generated last.

### Production migration safety
- Prefer `pnpm db:migrate` (`prisma migrate deploy --schema server/prisma/schema.production.prisma`).
- `pnpm db:push:pg` is for disposable/isolated probes only — **not** a production provisioning substitute.
- Never run destructive SQL against production; never rewrite committed migration folders after they have been applied anywhere.
- Fresh empty-DB deploy was verified with migration `20261110130000_init_canonical` (Task 7.1).

### Provider-specific differences
- SQLite uses `db push` for local iteration; PostgreSQL uses versioned migrations under `server/prisma/migrations/`.
- Types/relations/indexes are identical across schemas when parity passes; only `datasource.provider` differs.
- Seed (`pnpm seed` / `pnpm db:init`) works against whichever client+URL is currently configured.

### Auth delivery (Task 11 + Task 15)
- **Email (Brevo SMTP)**: Nodemailer (`EMAIL_PROVIDER=smtp`) with `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_SECURE=false` (STARTTLS + cert validation), `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` (optional `SMTP_TIMEOUT_MS`, `SMTP_REQUIRE_TLS`, `SMTP_TLS_REJECT_UNAUTHORIZED`). Production **requires** SMTP username/password — no silent console fallback. `EMAIL_FROM` must match a Brevo-verified sender.
- **SMS (TextBee, production default)**: `SMS_PROVIDER=textbee` with `TEXTBEE_API_KEY` + `TEXTBEE_DEVICE_ID` (optional `TEXTBEE_TIMEOUT_MS`, `TEXTBEE_BASE_URL`). Module: `server/lib/delivery/sms/textbee.js`. HTTP 200 / `smsBatchId` means **accepted/queued**, not carrier-delivered — poll `getBatchStatus` for status. Free plan limits: 50/day, 300/month, 1 device; carrier/SIM charges may apply. Requires Android 7+ phone, TextBee app online, and an active SMS-capable SIM.
- **SMS (Twilio, optional)**: `SMS_PROVIDER=twilio` with `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` (optional `TWILIO_TIMEOUT_MS`).
- **Development**: defaults to console providers; may return `dev_otp` / `resetToken` hints. Production **refuses** console providers and validates config at startup (`assertDeliveryConfigured` in `server/index.js`).
- **Fail-closed (Task 12)**: under `NODE_ENV=production`, `AUTH_DELIVERY_REQUIRED=false` is ignored/refused; weak/default `JWT_SECRET` / OTP pepper abort startup; `AUTH_RATE_LIMIT_DISABLED=true` is refused.
- **Env load order**: `server/loadEnv.js` is imported first (also from `server/lib/jwt.js`) so `.env` is available before `IS_PRODUCTION` / JWT / provider selection.
- **OTP security**: HMAC-SHA256 stored codes (`h1:` prefix), expiry, single-use delete, max verify attempts, resend cooldown, per-IP **and** per-destination send/verify limits, per-account login limits. In-memory rate limiter is **single-process only**.
- **Live check (gated)**: `pnpm test:delivery:live` → `scripts/live-delivery-verify.mjs` requires `ALLOW_LIVE_DELIVERY_TEST=true` plus explicit destination email/phone; mocked `pnpm test:delivery` is **not** live proof.
- Apply PG migration `20261110150000_auth_otp_attempts_delivery` for `AuthOtp.attempts` + `last_sent_at`.
- Staging templates: `.env.staging.example`, `docker-compose.staging.example.yml`. Remote Staging is **not** configured until owner provides host + dedicated Postgres + delivery credentials (see `docs/DEPLOYMENT_RUNBOOK.md`).

### Production packaging (Task 13)
- **Images**: multi-target `Dockerfile` — `api` (Express + Socket.io + static ffmpeg/ffprobe) and `web` (Next.js `output: 'standalone'`).
- **Compose example**: `docker-compose.prod.example.yml` (proxy + web + api + private Postgres + uploads volume). Env template: `.env.production.docker.example`.
- **Reverse proxy**: `deploy/nginx/default.conf` routes `/api`, `/uploads`, `/socket.io` → api:5000; all else → web:5173. Keep `NEXT_PUBLIC_API_BASE` empty for same-origin browser calls.
- **Migrations**: explicit only via `scripts/migrate-deploy.sh` / Compose profile `migrate` — **not** on container start. Never `db push` for Staging/Production.
- **CI**: `.github/workflows/ci.yml` runs schema/delivery/critical/API tests, typecheck, and production build. No deploy job.
- Local production-like Docker stack was verified on `localhost` — **not** remote Staging/Production.

### Remaining production limitations
- Brevo SMTP + TextBee SMS are **implemented and mock-tested**; live external delivery requires operator credentials + (for TextBee) an online Android gateway — not proven in CI.
- Remote Staging environment is **not deployed** (provider-independent prep only as of Task 12; packaging as of Task 13).
- Live WebRTC SFU is only partially verified.
- Media still local-disk `/uploads` (no CDN/object storage yet).
- Authenticated watch history is server-backed (`WatchHistory` soft-references `video_id`; localStorage remains offline cache). Apply PG follow-up migrations `20261110140000_watch_history_khatm_indexes` and `20261110150000_auth_otp_attempts_delivery` on deploy.
- Auth rate limits are in-memory per Node process — multi-instance production needs a shared store or edge limiter.

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
  - `server/prisma/schema.prisma`: Canonical SQLite schema (source of truth).
  - `server/prisma/schema.production.prisma`: Generated PostgreSQL derivative.
  - `server/prisma/migrations/`: PostgreSQL migrate-deploy history.
  - `server/prisma/seed.js`: Database seeding script.
  - `server/routes/`: Auth, Entity CRUD, Uploads, and AI integration routes.
  - `server/socket.js`: Real-time Socket.io LiveRoom & presence handlers.
- `scripts/check-schema-parity.mjs`, `scripts/sync-prisma-production-schema.mjs`, `scripts/pg-schema-smoke.mjs`: schema tooling.
- `next.config.mjs`: Next.js config (`output: 'standalone'`); dev rewrites proxy `/api`, `/uploads`, `/socket.io` to Express. Production prefers Nginx/Caddy (see `deploy/nginx/default.conf`).
- `Dockerfile`: multi-target `api` / `web` production images.
- `docker-compose.prod.example.yml`, `.env.production.docker.example`, `scripts/migrate-deploy.sh`: local production-like packaging + explicit migrate.
- `pnpm-workspace.yaml` & `.npmrc`: pnpm package manager configuration (`node-linker=hoisted`).
- `.env`: Environment variables (`PORT=5000`, `DATABASE_URL`, `JWT_SECRET`, optional `OPENAI_API_KEY`, `GEMINI_API_KEY`).

## Development Commands (pnpm)

- `pnpm dev`: Runs both the Express backend (port 5000) and the Next.js frontend (port 5173) concurrently.
- `pnpm server`: Runs only the backend.
- `pnpm client`: Runs only the Next.js frontend dev server (`next dev -p 5173`).
- `pnpm seed`: Seeds the database with initial users, scholars, curated verses, topics, and posts.
- `pnpm db:init`: Connects using `.env` provider URL and runs seed.
- `pnpm db:generate`: Generates Prisma Client from the **SQLite** canonical schema (local default).
- `pnpm db:generate:pg`: Generates Prisma Client from the **PostgreSQL** production schema (overwrites the shared client output).
- `pnpm db:prepare:prod`: Sync production schema → parity check → generate PG client.
- `pnpm db:sync-production-schema`: Regenerate `schema.production.prisma` from canonical SQLite schema.
- `pnpm db:push`: Pushes canonical schema to the local SQLite database (development only).
- `pnpm db:push:pg`: Pushes production schema to a disposable Postgres URL (not for production provisioning).
- `pnpm db:migrate`: Deploys PostgreSQL migrations (`migrate deploy` against `DATABASE_URL`).
- `pnpm db:studio`: Opens Prisma Studio against the SQLite schema.
- `pnpm test:schema` / `pnpm test:delivery` / `pnpm test:critical` / `pnpm test` / `pnpm test:pg-smoke`: schema parity, OTP/delivery unit tests, critical API, full API, isolated PG CRUD.
- `pnpm build`: Compiles the Next.js application for production (generating SSG, ISR, and SSR routes).
- `pnpm start`: Starts the Next.js production server on port 5173.
- `pnpm lint`: Runs ESLint checks.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-upgrade -->

## Next.js upgrade reminders

Upgrade reminders emitted by this project's installed Next.js CLI during `next dev` or `next build` are part of the `experimental.agentUpgrade` workflow. Follow these reminders' instructions while respecting user instructions declining upgrades.

<!-- END:nextjs-agent-upgrade -->
