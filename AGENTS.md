# AGENTS.md — Ayeh Media Plus (آیه پلاس)

## Quick Start
```bash
pnpm install          # install deps (pnpm@11.21.0, Node 20–24)
pnpm db:generate      # generate SQLite Prisma Client
pnpm db:push          # push schema to local SQLite (dev only)
pnpm dev              # runs Express (5000) + Next.js (5173) concurrently
```

## Critical Architecture Facts

**Database**
- Dev: SQLite (`file:./dev.db`) via `pnpm db:push`
- Prod: PostgreSQL via `prisma migrate deploy` (migrations in `server/prisma/migrations/`)
- **Canonical schema**: `server/prisma/schema.prisma` (provider = sqlite)
- **Prod derivative**: `server/prisma/schema.production.prisma` — generated ONLY by `pnpm db:sync-production-schema`
- Parity gate: `pnpm test:schema` — fails on any drift beyond provider line
- Both schemas emit to same `@prisma/client` — **last generate wins**. After any `db:generate:pg`, re-run `pnpm db:generate` before SQLite work/tests.

**Rendering modes (Next.js 15 App Router)**
| Route | Mode | Notes |
|-------|------|-------|
| `/verse/[surah]/[ayah]` | SSG | `generateStaticParams` for popular verses |
| `/scholars`, `/collections` | ISR | revalidate 1h / 30m |
| `/`, `/community` | SSR | |
| `/live`, `/studio`, `/assistant`, `/admin`, `/profile` | CSR | |

**Backend** — Express + Socket.io on port 5000 (`server/index.js`)
- Routes under `/api/auth`, `/api/entities`, `/api/integrations`, `/api/gamification`, `/api/videos`, `/api/competitions`, `/api/moderation`, `/api/watch-history`, `/api/khatm`
- Socket.io at `/socket.io` for LiveRoom & presence
- Static uploads at `/uploads` (repo root, not `server/uploads`)

## Essential Commands

| Task | Command |
|------|---------|
| Schema parity check | `pnpm test:schema` |
| Sync prod schema from canonical | `pnpm db:sync-production-schema` |
| Generate PG client (prod image) | `pnpm db:generate:pg` |
| Deploy PG migrations | `pnpm db:migrate` |
| Run all API tests | `pnpm test` |
| Unit tests (delivery/OTP, mocked) | `pnpm test:delivery` |
| Critical functional tests | `pnpm test:critical` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Production build | `pnpm build` |
| Prisma Studio (SQLite) | `pnpm db:studio` |

## Auth & Delivery (Task 11/12/15)

**Providers**
- Email: Brevo SMTP (`EMAIL_PROVIDER=smtp`, `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER/PASS`, `EMAIL_FROM` must be Brevo-verified)
- SMS: TextBee default (`SMS_PROVIDER=textbee`, `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`) — requires Android 7+ phone with app online
- SMS optional: Twilio (`SMS_PROVIDER=twilio`)

**Fail-closed in production (`NODE_ENV=production`)**
- Console providers rejected at startup (`assertDeliveryConfigured`)
- Weak/default `JWT_SECRET` or `OTP_PEPPER` aborts startup (`assertOtpSecretsConfigured`)
- `AUTH_RATE_LIMIT_DISABLED=true` refused (`assertAuthRateLimitSafe`)
- `AUTH_DELIVERY_REQUIRED=false` ignored

**OTP security**
- HMAC-SHA256 stored (`h1:` prefix), expiry, single-use delete, max verify attempts
- Per-IP AND per-destination send/verify limits, per-account login limits
- In-memory rate limiter = **single-process only** (multi-instance needs shared store)

**Live delivery test** (gated): `pnpm test:delivery:live` needs `ALLOW_LIVE_DELIVERY_TEST=true` + explicit destination. Mocked tests are NOT live proof.

## Production Packaging (Task 13)

**Docker** — multi-target `Dockerfile`: `api` (Express + Socket.io + ffmpeg/ffprobe) and `web` (Next.js `output: 'standalone'`)
- Compose: `docker-compose.prod.example.yml` (proxy + web + api + private Postgres + uploads volume)
- Reverse proxy: `deploy/nginx/default.conf` routes `/api`, `/uploads`, `/socket.io` → api:5000; all else → web:5173
- Keep `NEXT_PUBLIC_API_BASE` empty for same-origin browser calls
- **Migrations run explicitly** via `scripts/migrate-deploy.sh` / Compose `migrate` profile — NOT on container start

**CI** (`.github/workflows/ci.yml`): schema parity → delivery tests → critical tests → full API tests → typecheck → production build. No deploy job.

## Known Limitations
- Brevo SMTP + TextBee SMS: implemented & mock-tested only; live delivery unproven in CI
- Remote Staging not deployed (provider-independent prep only)
- WebRTC SFU partially verified
- Media on local disk `/uploads` (no CDN/object storage)
- Auth rate limits in-memory per Node process
- Watch history server-backed (`WatchHistory` soft-refs `video_id`); apply PG migrations `20261110140000_watch_history_khatm_indexes` and `20261110150000_auth_otp_attempts_delivery` on deploy

## Key Files to Know
- `server/prisma/schema.prisma` — canonical schema (edit this, then `pnpm db:sync-production-schema`)
- `server/index.js` — Express entry, startup guards, rate limiting, Socket.io init
- `server/lib/delivery/` — email/SMS providers, OTP, rate limiting, config validation
- `server/routes/` — all REST endpoints
- `server/socket.js` — LiveRoom & presence
- `next.config.mjs` — Next.js config with dev rewrites proxying `/api`, `/uploads`, `/socket.io` to Express
- `scripts/check-schema-parity.mjs` — parity gate (run via `pnpm test:schema`)
- `scripts/migrate-deploy.sh` — explicit production migration runner

## Common Gotchas
1. **Prisma client shared output** — after `db:generate:pg`, run `db:generate` before any SQLite work
2. **Never `db:push` in production** — use `db:migrate` (`prisma migrate deploy`)
3. **Never hand-edit `schema.production.prisma`** — regenerate via sync script
4. **Uploads path** — served from repo root `/uploads`, ensure volume mount matches
5. **Trust proxy** — set `TRUST_PROXY=1` behind Nginx/Caddy so `req.ip` / rate limits see real client
6. **Rate limiting** — in-memory only; multi-instance needs Redis or edge limiter
7. **Dev vs prod rewrites** — Next.js rewrites only in dev; prod uses Nginx