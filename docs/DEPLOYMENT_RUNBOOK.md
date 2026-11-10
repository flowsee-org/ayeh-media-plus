# Deployment Runbook — Ayeh Media Plus

**Status legend used below**

| Label | Meaning |
|-------|---------|
| Locally verified | Proven on isolated local Docker Postgres / local SQLite app |
| Staging verified | Proven against a named Staging target |
| Not yet verified | No Staging/Production proof yet |
| Production-only (approval required) | Must not run without explicit human approval |

**Task 12 (2026-11-10):** Provider-independent Staging preparation + security fail-closed hardening completed. A **remote Staging environment was not deployed** (no hosting target / Staging secrets in-repo). Local Docker Postgres migration rehearsal (`ayeh_task12_*`) is **Locally verified only** — do **not** describe it as a deployed Staging environment.

**Task 13 (2026-11-10):** Production deployment packaging completed in-repo (multi-target Dockerfile, Nginx reverse proxy, Compose example, explicit migrate script, minimal CI). A **local production-like Docker stack** (`ayeh-prod-local` on `localhost:8080`) was **Verified in Docker**. This is **not** remote Staging and **not** Production.

---

## 1. Required environment variables

Never commit real secrets. Values below describe purpose only.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes (prod=`production`) | Enables production rate limiter; disables fixed/dev OTP codes and `dev_otp` / `resetToken` leakage |
| `PORT` | Yes | Express listen port (default `5000`) |
| `DATABASE_PROVIDER` | Yes | `sqlite` (local) or `postgresql` (prod/staging) |
| `DATABASE_URL` | Yes | Prisma datasource URL. Prod/staging must be `postgresql://…` |
| `DATABASE_SSL_MODE` | Recommended (PG) | e.g. `require` for managed Postgres |
| `DATABASE_CONNECTION_LIMIT` | Optional (PG) | Pool sizing hint for ops docs; app uses Prisma defaults unless wired |
| `JWT_SECRET` | Yes (prod/staging) | Signs auth JWTs. Production aborts if missing **or** equal to `ayeh_default_secret_2026` |
| `OTP_PEPPER` | Recommended (prod) | HMAC pepper for stored OTPs; falls back to `JWT_SECRET`. Production refuses weak/default peppers |
| `CORS_ORIGIN` | Yes (prod) | Comma-separated allowed browser origins |
| `APP_PUBLIC_URL` | Recommended (prod) | Base URL for password-reset email links |
| `NEXT_PUBLIC_API_BASE` | Optional | Public API base for the Next app; empty = same-origin |
| `EMAIL_PROVIDER` | Prod default `smtp` | `smtp` or `console` (console **forbidden** in production) |
| `SMTP_HOST` / `SMTP_PORT` / `EMAIL_FROM` | Yes when `smtp` | Nodemailer SMTP (Brevo: `smtp-relay.brevo.com:587`) |
| `SMTP_USER` / `SMTP_PASS` | **Required in production** | Brevo SMTP login + key; missing values fail-closed (no console fallback). Local MailHog smoke still needs non-empty placeholders |
| `SMTP_SECURE` / `SMTP_TIMEOUT_MS` | Optional | TLS-on-connect (port 465) and socket timeouts |
| `SMTP_REQUIRE_TLS` / `SMTP_TLS_REJECT_UNAUTHORIZED` | Optional | Port 587 enables STARTTLS by default; cert validation defaults **on** |
| `SMS_PROVIDER` | Prod default `textbee` | `textbee`, `twilio`, or `console` (console **forbidden** in production) |
| `TEXTBEE_API_KEY` / `TEXTBEE_DEVICE_ID` | Yes when `textbee` | TextBee gateway API key + registered Android device id |
| `TEXTBEE_TIMEOUT_MS` / `TEXTBEE_BASE_URL` | Optional | HTTP timeout (default 15000) and API base |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Yes when `twilio` | Twilio REST SMS (`TWILIO_FROM_NUMBER` must be E.164) |
| `TWILIO_TIMEOUT_MS` | Optional | SMS HTTP timeout (default 15000) |
| `ALLOW_LIVE_DELIVERY_TEST` / `LIVE_DELIVERY_EMAIL` / `LIVE_DELIVERY_PHONE` | Live script only | Gated `pnpm test:delivery:live` — never set in normal app runtime |
| `AUTH_DELIVERY_REQUIRED` | Dev-only override | Production **always** requires delivery validation. `=false` is refused in production (Task 12 fail-closed). In development, `=true` forces the same checks |
| `AUTH_OTP_*` / `AUTH_LOGIN_MAX_ATTEMPTS` / `AUTH_RATE_LIMIT_*` | Optional | OTP attempt / resend / login abuse controls. `AUTH_RATE_LIMIT_DISABLED=true` is refused in production |
| `OPENAI_API_KEY` | Optional | AI assistant features |
| `GEMINI_API_KEY` | Optional | Alternate AI provider |
| `VITE_BASE44_APP_ID` | Legacy | Compatibility leftover; not a deploy blocker |

### Auth delivery behavior

| Mode | Email | SMS | OTP in HTTP | Startup |
|------|-------|-----|-------------|---------|
| Development (`NODE_ENV` ≠ `production`) | Default `console` | Default `console` | May include `dev_otp` / `resetToken` | Warns if misconfigured; continues unless `AUTH_DELIVERY_REQUIRED=true` |
| Production / Staging (`NODE_ENV=production`) | Default `smtp`; console refused | Default `textbee`; console refused | Never returns codes/tokens | Fail-closed: delivery + OTP secrets + rate-limit safety — exit 1 on failure |

**OTP security:** codes stored as HMAC-SHA256 (`h1:`…); expiry; single-use delete; max verify attempts; resend cooldown; per-IP **and** per-destination (email/phone) send/verify windows; per-IP + per-account login windows.

**Production fail-closed (Task 12 + Task 15):**

- `AUTH_DELIVERY_REQUIRED=false` **cannot** disable mandatory provider validation under `NODE_ENV=production`.
- Console email/SMS providers are refused.
- Production SMTP requires `SMTP_USER` + `SMTP_PASS` (Brevo).
- Production TextBee requires `TEXTBEE_API_KEY` + `TEXTBEE_DEVICE_ID` (or Twilio vars when `SMS_PROVIDER=twilio`).
- Weak/default `JWT_SECRET` / OTP pepper refused.
- `AUTH_RATE_LIMIT_DISABLED=true` refused.

**Brevo SMTP setup (reproducible):**

1. Create a Brevo account and verify the sender/domain used in `EMAIL_FROM`.
2. SMTP & API → generate an SMTP key; set `SMTP_USER` (login) + `SMTP_PASS` (SMTP key).
3. Set `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_SECURE=false` (STARTTLS + cert validation).
4. Never use `EMAIL_PROVIDER=console` in Staging/Production.

**TextBee SMS setup (reproducible):**

1. Android 7.0+ device with an active SIM that can send SMS; install the TextBee app and keep it online.
2. Create a TextBee account + API key; register the device and copy `TEXTBEE_DEVICE_ID`.
3. Set `SMS_PROVIDER=textbee`, `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`.
4. Free plan limits: **50 messages/day**, **300/month**, **1 device** — not unlimited. Carrier/SIM charges may still apply.
5. Treat HTTP 200 / `smsBatchId` as **API acceptance / queue**, not delivery. Poll batch status (or dashboard) for `sent` / `delivered` / `failed`.

**Rate-limiter limitation (explicit):** auth abuse controls in `server/lib/delivery/rateLimit.js` are **in-memory per Node process only**. They do **not** synchronize across multiple application instances. This repo has **no Redis / shared store** wired today — do not claim multi-instance rate-limit protection. For horizontal scale, place a shared limiter at the edge/API gateway (or introduce a shared store only after an explicit deploy decision).

**External delivery verification status:** mocked unit/integration tests (`pnpm test:delivery`) are in-repo. Gated live script: `pnpm test:delivery:live` (`ALLOW_LIVE_DELIVERY_TEST=true` + destination email/phone). **Real Brevo/TextBee delivery is Not verified** until that script succeeds with operator credentials.

**Not implemented / no env wiring today (do not invent):**

- Object storage / CDN (`S3_*`, `R2_*`, CDN URL) — media is local disk `/uploads`
- WebRTC TURN/SFU credentials — Socket.io relays signaling only
- Redis / shared rate-limit store
- Automated Production deploy pipelines (CI runs tests/build only — see `.github/workflows/ci.yml`; no deploy job)

**Staging configuration status (Task 12):**

- Template: `.env.staging.example` (copy to untracked `.env.staging`)
- Example local Postgres compose: `docker-compose.staging.example.yml` (Postgres only — not a full Staging app deploy)
- No authorized remote Staging host / `STAGING_DATABASE_URL` / Staging Brevo / Staging TextBee credentials in-repo
- Local `.env.production` remains a **placeholder** (`DATABASE_PROVIDER=postgresql` but `DATABASE_URL` is still a SQLite `file:` URL) — **not** Staging or Production
- **Staging verified:** none (no remote app + DB deployment)

---

## 2. Prisma Client generation sequence

Both schemas emit into the **same** `@prisma/client` output. Last generate wins.

| Step | Command | When |
|------|---------|------|
| 1 | `pnpm db:sync-production-schema` | After canonical SQLite schema changes |
| 2 | `pnpm test:schema` | Parity gate (provider line only difference) |
| 3 | `pnpm db:generate:pg` **or** `pnpm db:prepare:prod` | Before PG migrate / PG smoke / prod image build |
| 4 | `DATABASE_URL=postgresql://… pnpm db:migrate` | Apply migration chain |
| 5 | `pnpm db:generate` | **Always** restore SQLite client before local SQLite app/tests |

Local development default remains:

```bash
pnpm db:generate
pnpm db:push   # SQLite only — never a production substitute
```

---

## 3. Database backup requirements

**Production-only (approval required)** before any migrate on a shared database:

1. Take a restore-tested snapshot/backup of the Postgres instance (provider snapshot or `pg_dump --format=custom`).
2. Record backup ID, timestamp, and operator.
3. Prefer a Staging clone restored from that backup for dry-run migrate first.
4. Do not proceed if backup restore has not been practiced at least once for this environment class.

Prisma migrations are **not** automatically reversible. Backup-based recovery is the primary rollback path.

---

## 4. Migration chain

Committed history (`server/prisma/migrations/`, lock `provider = "postgresql"`):

1. `20261110130000_init_canonical` — full schema create (27 app tables at init; additive later)
2. `20261110140000_watch_history_khatm_indexes` — creates `WatchHistory` + indexes/FK; adds `KhatmPart` unique `(session_id, part_number)` + query indexes
3. `20261110150000_auth_otp_attempts_delivery` — additive `AuthOtp.attempts` + `AuthOtp.last_sent_at` for OTP brute-force / resend metadata

Deploy command (never `db push` for Staging/Production):

```bash
DATABASE_PROVIDER=postgresql \
DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?schema=public' \
pnpm db:migrate
# = prisma migrate deploy --schema server/prisma/schema.production.prisma
```

### Locally verified (Task 10 + Task 11 + Task 12)

| Scenario | Isolated DB | Result |
|----------|-------------|--------|
| Fresh empty install (Task 10) | `ayeh_task10_fresh` @ Docker `ayeh-pg-schema-test:5433` | Init + WatchHistory migrations; **28** tables; indexes present |
| Existing DB upgrade (Task 10) | `ayeh_task10_upgrade` | Rows intact; WatchHistory created |
| Conflicting duplicates (Task 10) | `ayeh_task10_conflict` | Migrate **failed** `23505`; data preserved |
| Fresh + AuthOtp columns (Task 11) | `ayeh_task11_fresh` | Full 3-migration chain |
| Upgrade AuthOtp (Task 11) | `ayeh_task11_upgrade` | Existing OTP row preserved; `attempts=0` |
| Fresh full chain (Task 12) | `ayeh_task12_fresh` | All **3** migrations; **28** tables; **34** FKs; WatchHistory + KhatmPart indexes; `AuthOtp.attempts` + `last_sent_at` |
| Existing DB upgrade (Task 12) | `ayeh_task12_upgrade` | Init-only → seed Users/Videos/KhatmParts/AuthOtp → migrate 2+3. Pre-existing rows intact; AuthOtp gained `attempts=0`; WatchHistory created; soft orphan `video_id` OK |
| PG CRUD smoke (Task 12) | `ayeh_task12_fresh` | `pnpm test:pg-smoke` failures=0 |

### Staging verified

None — no remote Staging database or application configured.

### Production-only (approval required)

Applying this chain to any non-local / non-rehearsal database.

---

## 5. Migration preflight checks (read-only)

Run against the **target** database **before** `migrate deploy`. Do not delete or rewrite user data during preflight.

### 5.1 Detect duplicate Khatm reservations / part numbers

```sql
-- Must return 0 rows before migration 20261110140000 can succeed
SELECT session_id, part_number, COUNT(*) AS cnt, array_agg(id) AS ids
FROM "KhatmPart"
GROUP BY session_id, part_number
HAVING COUNT(*) > 1
ORDER BY cnt DESC, session_id, part_number;
```

### 5.2 WatchHistory already present (out-of-band create)

```sql
SELECT to_regclass('"WatchHistory"') AS watchhistory_relation;
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'WatchHistory_user_id_video_id_key',
    'KhatmPart_session_id_part_number_key'
  );
```

If `WatchHistory` already exists from a manual/`db push` experiment, `CREATE TABLE "WatchHistory"` in migration 2 will fail. **Do not** silently drop it. Stop and obtain approval for a reviewed forward fix (`migrate resolve` only after schema is confirmed equivalent).

### 5.3 Existing WatchHistory duplicate pairs (only if table already exists)

```sql
SELECT user_id, video_id, COUNT(*) AS cnt, array_agg(id) AS ids
FROM "WatchHistory"
GROUP BY user_id, video_id
HAVING COUNT(*) > 1;
```

### 5.4 Nullable / soft-reference notes

- `WatchHistory.video_id` is **soft** (no FK to `Video`) — intentional so history survives video deletion.
- `WatchHistory.user_id` FK → `User(id)` `ON DELETE CASCADE`.
- `KhatmPart.user_id` has **no** FK — reserved parts can reference deleted users until released by app logic.
- Migration 2 is additive (`CREATE TABLE` / `CREATE INDEX` / one FK). It does not rewrite reservation payloads.

### 5.5 If duplicates exist — manual reconciliation (approval required)

**Never** auto-dedupe in deploy scripts.

1. Export conflicting rows (IDs + status + user_id + reserved_at).
2. Product/ops decide keep vs archive per conflict (example policy candidates: keep `completed` over `available`; keep earliest `reserved_at`).
3. Apply an **explicit, reviewed** SQL change set only after written approval.
4. Re-run preflight until zero conflicts.
5. If Prisma recorded a failed migration (`finished_at` null), after data+schema are correct use:

```bash
# Production-only (approval required) — marks migration as rolled back or applied
npx prisma migrate resolve --rolled-back 20261110140000_watch_history_khatm_indexes \
  --schema server/prisma/schema.production.prisma
# then re-run pnpm db:migrate
# OR, if objects were manually made equivalent:
# npx prisma migrate resolve --applied 20261110140000_watch_history_khatm_indexes ...
```

---

## 6. Migration deployment commands

### Fresh Staging/Production empty database

```bash
pnpm db:prepare:prod
DATABASE_PROVIDER=postgresql DATABASE_URL='…' pnpm db:migrate
# optional seed only on non-prod:
# DATABASE_URL='…' pnpm seed
```

### Existing database that already has `20261110130000_init_canonical`

```bash
# 1) backup
# 2) preflight SQL (§5)
# 3) migrate
DATABASE_PROVIDER=postgresql DATABASE_URL='…' pnpm db:migrate
```

### Explicitly forbidden substitutes

- `pnpm db:push` / `pnpm db:push:pg` against Staging/Production
- Rewriting committed migration SQL after it has been applied anywhere
- Connecting to Production from developer laptops without approval

---

## 7. Post-migration verification

```sql
SELECT migration_name, finished_at IS NOT NULL AS applied
FROM "_prisma_migrations"
ORDER BY started_at;

SELECT COUNT(*) AS app_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name <> '_prisma_migrations';
-- Expect 28 after full chain

SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'WatchHistory_user_id_video_id_key',
    'WatchHistory_user_id_last_watched_at_idx',
    'WatchHistory_video_id_idx',
    'KhatmPart_session_id_part_number_key',
    'KhatmPart_session_id_idx',
    'KhatmPart_status_idx',
    'KhatmPart_user_id_idx'
  )
ORDER BY indexname;

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = '"WatchHistory"'::regclass;
```

Optional disposable CRUD probe (**Locally verified** tooling; point only at disposable DBs):

```bash
DATABASE_URL='postgresql://…/disposable' pnpm db:generate:pg
DATABASE_URL='postgresql://…/disposable' pnpm test:pg-smoke
pnpm db:generate   # restore SQLite client afterward
```

---

## 8. API health checks

`GET /api/health` returns `{ status, time, database }` and **503** when the DB ping fails.

After app deploy (Staging when it exists):

```bash
curl -sS "$API/api/health"                                             # expect 200 + database=ok
curl -sS -o /dev/null -w '%{http_code}\n' "$API/api/videos"
curl -sS -o /dev/null -w '%{http_code}\n' "$API/api/auth/me"          # expect 401
curl -sS -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"<staging-admin>","password":"<secret>"}'               # expect 200 only with real staging creds
curl -sS -o /dev/null -w '%{http_code}\n' "$WEB/"                      # Next frontend
```

Critical local gates (SQLite app — restore client with `pnpm db:generate` after any PG generate):

```bash
pnpm test:schema
pnpm test:delivery
pnpm test:critical
pnpm test
pnpm typecheck
pnpm build
```

---

## 9. Failure recovery procedure

1. **Stop** further migrate attempts if Prisma reports `P3018` (failed migration).
2. Inspect `_prisma_migrations` for `finished_at IS NULL`.
3. Inspect Postgres error (`23505` duplicate unique, `42P07` relation exists, etc.).
4. Prefer **restore from backup** for ambiguous partial states.
5. If failure was duplicate `KhatmPart` data: keep rows, reconcile with approval (§5.5), `migrate resolve --rolled-back`, re-run `db:migrate`.
6. Do **not** assume `migrate deploy` auto-rolls back application code. Redeploy previous app image if the new app requires migration-2 objects and migrate cannot complete.

---

## 10. Rollback limitations

| Approach | Supported? | Notes |
|----------|------------|-------|
| Automatic Prisma down migration | **No** | Not used in this repo |
| Restore DB backup + redeploy previous app | **Yes (preferred)** | Production-only with approval |
| Forward fix SQL + `migrate resolve` | **Yes (reviewed)** | Only when backup restore is heavier than a known-safe fix |
| Dropping `WatchHistory` / unique indexes ad hoc | **No** without approval | Risk of data loss |

Application compatibility:

- App builds that include `/api/watch-history` and Khatm unique assumptions need migration 2.
- Older app builds that never touch `WatchHistory` can run on init-only DB, but shipping current `main` without migration 2 is unsupported for watch-history/khatm concurrency guarantees.

---

## 11. Locking / downtime risks

| Change | Risk |
|--------|------|
| Fresh empty `migrate deploy` | Low; creates empty objects |
| `CREATE UNIQUE INDEX` on `KhatmPart(session_id, part_number)` | Can fail on duplicates; on large tables may take locks while building the index |
| `CREATE TABLE WatchHistory` + FK | Short catalog locks; generally low downtime on modest data |
| Long-running exclusive locks | Unlikely for current additive SQL, but still schedule a maintenance window on Production |

Recommendation: run migrate during a short maintenance window; keep API briefly read-only or offline if `KhatmPart` is large.

---

## 12. Staging architecture (proposed — not yet deployed)

**Selected model (provider-independent):** single Staging app instance + dedicated Staging PostgreSQL + independent secrets + local-disk `/uploads` volume on that instance.

| Layer | Staging expectation | In-repo status |
|-------|---------------------|----------------|
| App config | Separate `.env.staging` / host secrets (`NODE_ENV=production`) | Template only: `.env.staging.example` |
| Database | Dedicated Postgres DB (never Production URL, never SQLite) | Local rehearsal only (`ayeh_task12_*`); no remote Staging DB |
| Prisma | `pnpm db:prepare:prod` then `pnpm db:migrate` | Scripts ready |
| Health | `GET /api/health` (includes DB ping) | Implemented |
| Email/SMS | Real Staging Brevo SMTP + TextBee (or Twilio) | Credentials **missing** |
| Media | Single-instance disk volume backed up with the node | Multi-instance needs shared storage (not selected) |
| Live | Signaling-only Socket.io; no SFU/TURN | Launch-scope decision required |

**Missing external inputs from project owner (exact list):**

1. Staging host / VPS / PaaS account and SSH or deploy credentials  
2. Staging public URL + TLS certificate arrangement  
3. Dedicated Staging PostgreSQL URL (user/password/host/db)  
4. Staging `JWT_SECRET` and `OTP_PEPPER` (unique, ≥16 chars, non-default)  
5. Staging Brevo SMTP (`SMTP_HOST=smtp-relay.brevo.com`, `SMTP_USER`/`SMTP_PASS`, verified `EMAIL_FROM`) and authorized test inbox  
6. Staging TextBee (`TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`) + online Android 7+ gateway/SIM, or Twilio (`TWILIO_*`) + authorized test handset  
7. Decision: single-instance vs multi-instance (affects `/uploads` + rate-limit strategy)  
8. Decision: whether Live WebRTC is in launch scope (affects SFU/TURN requirement)

Until items 1–6 are provided and the app+DB are actually deployed, Staging remains **Not yet verified**.

### Backup & recovery (Staging / Production)

1. Snapshot or `pg_dump --format=custom` before every migrate.  
2. Practice restore onto a disposable DB at least once per environment class.  
3. Media: back up the `/uploads` volume with the same cadence as the DB for single-instance.  
4. Rollback = restore DB backup + redeploy previous app revision (no Prisma down migrations).

### Storage & multi-instance readiness

| Concern | Current | Single-instance Staging | Multi-instance |
|---------|---------|-------------------------|----------------|
| Uploads | Repo-root `/uploads` via Multer + `express.static` | Persist a named volume; include in backup | **Requires shared object storage or NFS** — not implemented |
| Auth rate limits | In-memory Map | Adequate for one Node process | **Not shared** — edge limiter required |
| Socket.io / Live | In-process rooms + signaling | Works for one node | Sticky sessions or shared adapter needed; still no SFU |
| Global `/api/` limiter | In-memory | Same single-process caveat | Same |

### WebRTC / Live limitation

`server/socket.js` provides presence + WebRTC **signaling** (`offer`/`answer`/ICE). There is no media SFU, TURN config, or recording. If live broadcast is launch-scoped, Staging/Production need an explicit SFU/TURN decision. Otherwise treat Live as partial/out-of-scope for launch.

## 13. Integration readiness (summary)

| Integration | Blocks production release? | Status |
|-------------|---------------------------|--------|
| Postgres migrate chain | **Yes** until Staging migrate approved & verified | Locally verified (incl. Task 12) |
| Remote Staging deploy | **Yes** | Missing host + secrets |
| JWT + CORS + `NODE_ENV` | **Yes** | Config required; defaults refused in prod |
| SMS/email OTP providers | **Yes** for auth flows under production | Code ready; live send **not** verified |
| WebRTC SFU / TURN | **Only if live broadcast is launch-scoped** | Signaling only |
| CDN / object storage | **Only if multi-instance or durable media is required** | Local disk `/uploads` |
| Shared rate-limit store | **Only if multi-instance** | In-memory only |

See `FUNCTIONAL_QA_AUDIT.md` Task 12–13 for verification evidence.

---

## 14. Task 13 — Container packaging & reverse proxy (local production-like)

### Architecture (implemented)

Two application processes + edge proxy + optional self-hosted Postgres:

| Service | Image / process | Internal port | Public |
|---------|-----------------|--------------:|--------|
| `proxy` | `nginx:1.27-alpine` + `deploy/nginx/default.conf` | 80 | host `${AYEH_PUBLIC_PORT:-8080}` only |
| `web` | `ayeh-web` (`Dockerfile` target `web`, Next standalone) | 5173 | **no** (private network) |
| `api` | `ayeh-api` (`Dockerfile` target `api`, Express + Socket.io) | 5000 | **no** (private network) |
| `db` | `postgres:16-alpine` (Compose example) | 5432 | **not published** by default |

Browser / clients talk **only** to the proxy. Frontend `src/lib/api.js` uses same-origin `/api` and Socket.IO path `/socket.io`. Keep `NEXT_PUBLIC_API_BASE` **empty** so the browser never targets an unreachable Docker DNS name.

### Nginx routing (`deploy/nginx/default.conf`)

| Incoming | Upstream |
|----------|----------|
| `/api/*` | `api:5000` |
| `/uploads/*` | `api:5000` |
| `/socket.io/*` | `api:5000` (HTTP + WebSocket upgrade) |
| everything else | `web:5173` |

Also: `client_max_body_size 110m` (Multer max 100MB + multipart overhead), long proxy timeouts for media, `X-Forwarded-*` headers. Express sets `trust proxy` in production so rate limits see the real client IP.

### Build & run (local verification)

```bash
cp .env.production.docker.example .env.production.docker   # untracked; edit secrets
docker compose -f docker-compose.prod.example.yml --env-file .env.production.docker build
docker compose -f docker-compose.prod.example.yml --env-file .env.production.docker up -d db
./scripts/migrate-deploy.sh --env-file .env.production.docker \
  --compose-file docker-compose.prod.example.yml            # explicit YES / --yes for rehearsal
docker compose -f docker-compose.prod.example.yml --env-file .env.production.docker up -d
curl -sS http://localhost:8080/api/health                   # expect database=ok
```

Image build commands (equivalent):

```bash
docker build --target api -t ayeh-api:local .
docker build --target web -t ayeh-web:local .
```

Runtime (inside containers): `node server/index.js` (api), `node server.js` (Next standalone web).

### Explicit migrations (never on container start)

Use `scripts/migrate-deploy.sh` (or Compose profile `migrate`). The script:

1. Prints redacted `DATABASE_URL` / provider  
2. Refuses SQLite / non-Postgres URLs  
3. Reminds the operator to back up  
4. Requires interactive `YES` (or `--yes` / `--skip-backup-prompt` for disposable local only)  
5. Runs `prisma migrate deploy --schema server/prisma/schema.production.prisma`  
6. Prints `migrate status`  
7. Points at runbook recovery (§§5–10)

### Upload persistence

- Path: container `/app/uploads` → Compose volume `ayeh_uploads`  
- Matches Multer / `express.static` (repo-root `/uploads` layout)  
- Survives `api` container recreate (**Verified in Docker** with marker file)  
- Backup: include the uploads volume with DB dumps for single-instance  
- Multi-instance: still requires shared storage (not implemented)

### Health checks

- API: `GET /api/health` → `{ status, time, database }` (503 if DB ping fails)  
- Compose/Docker HEALTHCHECK probes API DB health and Next `/`  
- Proxy healthcheck: `wget` → `/api/health`

### CI

`.github/workflows/ci.yml` — install, schema, delivery, critical, full API tests, typecheck, `pnpm build`. **No** Production deploy job. **No** workflow secrets.

### Security / ops notes (Task 13)

- Images run as non-root `node`  
- `.dockerignore` excludes `.env*`, `node_modules`, local `uploads`, logs  
- Production refuse paths verified in Docker: default `JWT_SECRET`, `AUTH_DELIVERY_REQUIRED=false`  
- Local Docker smoke may use placeholder SMTP/TextBee (or Twilio) env so the process **starts**; real OTP delivery still needs reachable Brevo + an online TextBee Android gateway (or Twilio)  
- `pnpm test:delivery:live` is the only in-repo path for one-shot live Brevo/TextBee checks; mocked `pnpm test:delivery` is **not** live proof 
- Rate limits remain in-memory (single process)  
- Live WebRTC remains signaling-only (no SFU/TURN in packaging)

### Verified in Docker (Task 13 local stack) vs not verified

| Check | Result |
|-------|--------|
| Image build `ayeh-api` / `ayeh-web` | Verified in Docker |
| Compose config + Postgres healthy | Verified in Docker |
| Explicit migrate deploy (3 migrations) | Verified in Docker |
| Proxy → Next `/` | Verified in Docker |
| Proxy → `/api/health` (`database=ok`) | Verified in Docker |
| Proxy → `/api/videos`, `/api/auth/me` (401) | Verified in Docker |
| Proxy → `/uploads/*` + volume persistence after recreate | Verified in Docker |
| Socket.IO polling handshake (+ `upgrades:["websocket"]`) | Verified in Docker |
| Raw HTTP `101 Switching Protocols` WebSocket upgrade via proxy `/socket.io` | Verified in Docker |
| Socket.IO client session over WebSocket transport through proxy | Verified in Docker (`transport=websocket`, `readyState=1`) |
| Remote Staging / Production | **Not yet verified** |
