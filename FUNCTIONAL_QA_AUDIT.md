# Functional QA Audit — Ayah Media Plus

Created: 2026-11-10  
Updated: 2026-11-10 (Task 13 — production packaging + local Docker verification; remote Staging/Production not deployed)  
Scope: real functionality only (UI/UX polish deferred)  
Method: code inspection + live API/DB probes against Express `:5000` / Next `:5173` + isolated Postgres migrate deploy  
Evidence: this document + `docs/DEPLOYMENT_RUNBOOK.md` + `pnpm test:schema` + `pnpm test:delivery` + `server/test-functional-critical.js` + `server/test-api.js` + `pnpm typecheck` + `pnpm build` + Task 12 isolated migrate DBs + Task 13 local Compose stack `ayeh-prod-local`

Prior UI audits (`UI_VISUAL_AUDIT.md`, `LAUNCH_AUDIT.md`, `ROUTE_STATUS.md`) are context only — HTTP 200 ≠ functional PASS.

---

## Phase 1 — Verification of previous session (do not trust blindly)

| Claimed change | Actual repo state on entry | Verdict |
|----------------|----------------------------|---------|
| Upload Multer → `process.cwd()/uploads` | Present in `upload.js`; static mount in `index.js` used `__dirname/../uploads` | **Partial / still broken under non-repo cwd** |
| Phone OTP sets `phone_verified` | Present in `auth.js` | **Correct** |
| Email OTP sets `email_verified` | Present in `auth.js` | **Correct** |
| Login rejects unverified with `EMAIL_NOT_VERIFIED` | Present; live admin login returned **403** | **Correct code, incomplete rollout** |
| Reset password sets `email_verified` | Present in `auth.js` | **Correct** |
| Seed sets `email_verified: true` | Present on admin/scholar/curated upserts | **Correct in seed file; seed not applied to DB** |
| One-shot grandfather existing users | **Not applied** — SQLite had `12` email users, **all** `email_verified=0` | **Missing → P0 lockout** |
| `server/test-functional-critical.js` | **File missing** (only claimed in audit) | **Missing** |
| Orphan media migrated | DB row `e2bd2f40-…` → `/uploads/1794267661333-….mp4` → **404** (file only under `server/uploads/`) | **Incomplete** |
| Frontend handles `EMAIL_NOT_VERIFIED` | **No matches** in `src/` | **Missing handoff** |

Branch on entry: `main` (ahead of `origin/main` by 1). Large unrelated working tree preserved; no resets/reverts.

---

## Summary (post-Task 6)

| Status | Count |
|--------|-------|
| PASS | Auth/upload/engagement/competitions/moderation + Podcast/Verse CRUD + server WatchHistory + Khatm atomic reserve + competition judge/results |
| PARTIAL | Search `?q=`, live SFU, SMS/email |
| FAIL | 0 open suite blockers (`pnpm test` green) |
| NOT IMPLEMENTED | CDN/object storage for media |

**P0/P1 confirmed and fixed this session:**
1. **P0** Email verification gate locked out **all** existing accounts including `admin@ayeh.media`.
2. **P0** Upload/transcode still used `process.cwd()` while static serve used `__dirname` → cwd-dependent split-brain.
3. **P1** Orphan user uploads under `server/uploads/` still 404 after path “fix”.
4. **P1** Login UI did not route unverified users into OTP verification.

---

## 1. Authentication and session management

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Admin login | PASS | — | After grandfather: `POST /api/auth/login` → 200 + token (`test-functional-critical.js`) |
| `GET /api/auth/me` | PASS | — | 200 with Bearer; 401 without |
| Register + OTP (`otpCode`) | PASS | — | Register → login 403 `EMAIL_NOT_VERIFIED` → verify `123456` (dev) → login 200 |
| Login before email verification | PASS (gate) | — | 403 + `code: EMAIL_NOT_VERIFIED` |
| Wrong password | PASS | — | 401 |
| Invalid OTP | PASS | — | 400 |
| Password reset E2E | PASS | — | Request (dev `resetToken`) → reset → login; also sets `email_verified` |
| Invalid reset token | PASS | — | 400 |
| Phone OTP login | PASS (dev) / PARTIAL (prod proof) | P2 | Captcha + OTP + Twilio/console provider wired; live Twilio send not yet proven |
| Logout / session | PASS | — | Client clears `localStorage` tokens; JWT bearer-only (no server revoke) |
| Login → verify handoff | PASS | — | `Login.jsx` on 403 resends OTP and navigates `/register?email=&verify=1`; `Register.jsx` opens OTP step |

**Files:** `server/routes/auth.js`, `server/lib/validation.js`, `src/lib/api.js`, `src/lib/AuthContext.jsx`, `src/views/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`  
**Models:** `User`, `AuthOtp`, `AuthCaptcha`

**Repro (gate):** register → skip verify → login → expect 403 `EMAIL_NOT_VERIFIED`.  
**Missing tests before this session:** no automated verify-gate coverage (now in `test-functional-critical.js`).  
**Next:** production email/SMS providers (architectural).

---

## 2. Video upload, submission, publishing, playback

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Upload auth | PASS | — | Unauth → 401; auth → 200 |
| Upload dir consistency | PASS | — | `upload.js` + `transcode.js` + `index.js` all resolve repo-root `/uploads` via `__dirname` (cwd-independent) |
| Static serve of new upload | PASS | — | File on disk under repo `uploads/`; `GET file_url` 200 |
| Create video + `media_url` | PASS | — | 201 `pending_review` |
| Create without media | PASS | — | 400 «عنوان و لینک محتوا الزامی است» |
| Catalog / platform MP4 | PASS | — | `/uploads/videos/plat-*.mp4` → 200 |
| Prior orphan user upload | PASS | — | Copied into repo `uploads/`; previously 404 → now 200 |
| HLS transcode | PARTIAL | P2 | Implemented; depends on ffmpeg; URLs under `/uploads/hls/...` |

**Files:** `server/routes/upload.js`, `server/lib/transcode.js`, `server/index.js`, `server/routes/videos.js`, `src/components/video/SubmissionWizard.jsx`  
**Models:** `Video`

---

## 3. Video details and navigation

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| `GET /api/videos/:id` | PASS | — | Title + `media_url` for catalog ids |
| Watch page route | PASS | — | `/watch/:id` → 200 (render); API detail real |
| Channel / `reciter_id` link | PARTIAL | P2 | Many seeded rows have `reciter_id: null`; link only when present |
| Related videos | PARTIAL | P2 | Client component present; ranking quality not validated |

**Files:** `src/views/VideoWatchPage.jsx`, `src/components/video/RelatedVideos.jsx`, `server/routes/videos.js`

---

## 4. User profiles and profile data

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| `GET /entities/User/:id` self | PASS | — | Returns `full_name` for authenticated user |
| Other user profile fetch | PASS | — | Admin id → 200 |
| Profile pages | PARTIAL | P2 | Routes render; depth/DS polish out of scope |

**Files:** `src/views/Profile.jsx`, `src/app/(main)/profile/[id]/page.jsx`, `src/components/design-system/ProfilePage.jsx`  
**Models:** `User`

---

## 5. Search and discovery

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Client search (`SearchPage`) | PASS | — | Filters videos/scholars/collections/competitions after entity fetches (real data, not mocks) |
| `GET /api/videos?q=` | PARTIAL | P2 | Same count with/without `q` (13=13) — server ignores query |
| Home / Explore lists | PASS | — | Published/verified videos from API |

**Files:** `src/views/SearchPage.jsx`, `src/components/design-system/GlobalSearch.jsx`, `server/routes/videos.js`

---

## 6. Likes and comments

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Like create + filter | PASS | — | 201 + filter finds row; delete works (`test-functional-critical.js` + probe) |
| Comment create + filter | PASS | — | 201; filter by `video_id` returns rows |
| Counter denormalization | PARTIAL | P2 | Counts may lag until refresh |

**Files:** `server/routes/entities.js`, `src/components/design-system/InteractionToolbar.jsx`  
**Models:** `Like`, `Comment`

---

## 7. Follow / subscription relationships

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Dedicated follow route | PASS | — | `POST /entities/follow` → 201 with persisted ids |
| Duplicate follow | PASS | — | `POST /entities/Follow` → 409 Already following |
| Unfollow | PASS (prior) | — | DELETE path exercised in earlier audit; not re-broken |

**Files:** `server/routes/entities.js`, `src/components/live/FollowButton.jsx`  
**Models:** `Follow`

---

## 8. Saved videos and bookmarks

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Bookmark create | PASS | — | 201 id returned |
| Bookmark filter by `user_id` | PASS | — | ≥1 row |
| Bookmarks UI route | PASS (render) | — | `/bookmarks` 200; data from entities |

**Files:** `src/views/Bookmarks.jsx`, `server/routes/entities.js`  
**Models:** `Bookmark`

---

## 9. Playlists and collections

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Public collections list | PASS | — | `Collection/filter` → 2 rows (`name` field, not `title`) |
| User playlist CRUD product surface | PARTIAL | P2 | Collections ≈ curated lists; dedicated playlist UX not fully productized |
| Watch-later flag | PARTIAL | P2 | Schema has `is_watch_later`; end-user flow not fully E2E’d this pass |

**Files:** `src/views/Collections.jsx`, `src/views/CollectionStudy.jsx`  
**Models:** `Collection`, `Bookmark`

---

## 10. Watch history

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Client history cache | PASS | — | `src/lib/watchHistory.js` — localStorage cache + offline fallback |
| Server `WatchHistory` API | PASS (Task 8 + 9.1) | — | Dedicated `/api/watch-history` owner-scoped; Entity API now private/strict-owner (Task 9.1 closed prior cross-account list/update/delete leak) |
| Cross-device sync | PASS (Task 8) | — | Authenticated upsert/list; critical §8 green |
| Orphan / deleted video rows | PASS (Task 8) | — | Soft ref keeps rows; UI shows unavailable; ghost `video_id` probe `video_available=false` |

**Files:** `src/views/WatchHistory.jsx`, `src/lib/watchHistory.js`, `server/routes/watch-history.js`, `server/routes/entities.js`, `server/prisma/schema.prisma`  
**Note (corrected Task 9.1):** Generic `/entities/WatchHistory` previously listed/updated/deleted any user’s rows without ownership checks. Now in `PRIVATE_OWNER_ENTITIES` + `STRICT_OWNER_ENTITIES`; unauth → 401; cross-user → 403.

---

## 11. Quran, Surah, and Ayah

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Quran UI / navigation | PASS | — | `/quran` 200; `Quran.jsx` + `quranApi.js` (external APIs) |
| Local `Verse` entity | PASS (Task 7) | — | Model on canonical SQLite + production PG; critical suite §7 CRUD green; seed may still leave 0 rows so legacy `test-api` steps 4/7 can report empty lists |
| Verse detail routes | PASS (render + external data) | — | App routes exist; content from network Quran APIs |

**Files:** `src/views/Quran.jsx`, `src/views/VerseDetail.jsx`, `src/lib/quranApi.js`, `server/prisma/schema.prisma`  
**Mock vs real:** UI still prefers external Quran APIs; Prisma `Verse` is available for entity CRUD.

---

## 12. Khatm Quran

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Session / part entities | PASS | — | filter returns sessions + parts |
| Claim / reserve part | PASS (Task 8) | — | `POST /api/khatm/parts/:id/reserve` sets `status=reserved` + `reserved_at`; entity state updates blocked |
| `reserved_at` auto-fill | PASS (Task 8) | — | Server sets timestamp; critical §9 asserts `reserved_at` |
| Multi-user race | PASS (Task 8) | — | Concurrent reserve → one 200 + one 409 (or same-user idempotent); unique `(session_id, part_number)` |

**Files:** `src/views/Khatm.jsx`, `src/views/KhatmDetail.jsx`, `src/views/Quran.jsx`, `server/routes/khatm.js`, `server/routes/entities.js`  
**Models:** `KhatmSession`, `KhatmPart`, `KhatmDua`

---

## 13. Competitions and participation

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| List competitions | PASS | — | `GET /api/competitions` → 1 active |
| Submit entry | PASS | — | `POST /competitions/:id/entries` → 201 `pending_review` |
| Entity fallback create | PASS | — | `POST /entities/CompetitionEntry` → 201 |
| Judge / scoring E2E | PASS (Task 8) | — | Critical §10: default `verified`, reject, auto-rank, manual rank override, non-admin 403 |
| Results endpoint | PASS (Task 8) | — | `GET /api/competitions/:id/results` registered before `/:id`; verified/published only |
| Duplicate vote | PASS (Task 8) | — | Second identical upvote toggles off (no double-count) |

**Files:** `server/routes/competitions.js`, `src/views/Competitions.jsx`, `src/views/CompetitionDetail.jsx`, `src/lib/api.js`  
**Models:** `Competition`, `CompetitionEntry`, `Vote`

---

## 14. Admin permissions and moderation

| Feature | Status | Severity | Evidence |
|---------|--------|----------|----------|
| Moderation queue as admin | PASS | — | 200, items present (8 in probe) |
| Non-admin denied | PASS | — | Regular user → 403 |
| Unauthenticated denied | PASS | — | 401 |
| RBAC matrix | PASS | — | `server/middleware/rbac/permissions.js` |

**Files:** `server/routes/moderation.js`, `server/middleware/rbac/*`, `src/views/ModerationDashboard.jsx`, `src/views/AdminPanel.jsx`

---

## Fixes implemented this session

### Fix A — Upload path cwd independence (P0 residual)
- `server/routes/upload.js` and `server/lib/transcode.js` now resolve `uploads` from `__dirname` (same target as `server/index.js`), not `process.cwd()`.

### Fix B — Auth lockout / grandfather (P0)
- Local `dev.db`: `UPDATE User SET email_verified=1 WHERE email IS NOT NULL AND password IS NOT NULL` (12 rows).
- Seed already upserts `email_verified: true` for known accounts (unchanged, still correct for future `pnpm seed`).

### Fix C — Orphan media (P1)
- Copied referenced files from `server/uploads/` → repo-root `uploads/` (e.g. `1794267661333-79281295.mp4`); static GET → 200.

### Fix D — Login verify handoff (P1)
- `Login.jsx`: on `EMAIL_NOT_VERIFIED`, `resendOtp` + navigate to Register OTP step.
- `Register.jsx`: honors `?email=&verify=1`.

### Tests
- Added `server/test-functional-critical.js` + `pnpm test:critical`.

---

## Remaining PARTIAL / NOT IMPLEMENTED

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Real SMS/email delivery | PASS (code) / PARTIAL (live) | P2 / arch | SMTP+Twilio integrated; console refused in prod; live send not verified |
| Server-side video `?q=` | PARTIAL | P2 | Client search works |
| Watch history sync | **PASS (fixed Task 8)** | — | `/api/watch-history` + soft `video_id`; localStorage cache remains |
| Competition judge E2E | **PASS (fixed Task 8)** | — | Critical §10 green |
| Khatm claim concurrency / `reserved_at` | **PASS (fixed Task 8)** | — | Critical §9 concurrent reserve + `reserved_at` |
| Live streaming broadcast | PARTIAL | P1 | Socket signaling tested in legacy suite; full WebRTC SFU unverified |
| Podcast entity on SQLite | **PASS (fixed Task 6)** | — | Model in `schema.prisma`; critical §6 + `test-api` step 13 green |
| Prisma Verse entity | **PASS (fixed Task 7)** | — | On canonical SQLite + generated production schema; critical §7 CRUD green |

---

## Task 6 — Schema parity (Podcast)

### Phase 1 evidence
- `pnpm test` → `node server/test-api.js` (17 steps; step 13 = Podcast CRUD).
- Only one runtime Prisma schema is used by tooling: `server/prisma/schema.prisma` (`package.json` `db:*` scripts). Parallel file: `server/prisma/schema.production.prisma` (PostgreSQL bootstrap copy; **not** referenced by `db:generate` / `db:push`).
- Podcast path: `TalkStudioModal.jsx` → `api.entities` Proxy → `POST /api/entities/Podcast` → `getPrismaModel('Podcast')` → `prisma.podcast`. Also listed in `STRICT_OWNER_ENTITIES`, `CROSS_USER_UPDATE_FIELDS.Podcast`, and account-delete cleanup (`prisma.podcast.deleteMany`).
- Pre-fix failure mode: missing model ⇒ `getPrismaModel` returns `null` ⇒ `{ message: "Entity not found" }` HTTP 404 (not an intentional capability gate).

### Root cause of Podcast 404
`getPrismaModel('Podcast')` in `server/routes/entities.js` returns `null` when Prisma Client has no `podcast` delegate. Dev/test always generate from `server/prisma/schema.prisma` (SQLite). `Podcast` existed only in `server/prisma/schema.production.prisma`, so the running client had no model → accidental dual-schema drift, **not** an intentional SQLite limitation.

### Architecture decision: **Case A**
Podcast must work in SQLite and PostgreSQL:
- Frontend: `TalkStudioModal.jsx` → `api.entities.Podcast.create`
- API registry: `STRICT_OWNER_ENTITIES` + `CROSS_USER_UPDATE_FIELDS.Podcast`
- Auth cleanup: `prisma.podcast.deleteMany` on account delete
- Product test: `server/test-api.js` step 13 expects real CRUD + chapter array deserialize
- Critical suite: section 6 asserts create/get/list/delete + JSON deserialize (no skips/mocks)

### Fix applied
- Added SQLite-compatible `Podcast` model to `server/prisma/schema.prisma` with the same scalar fields as production (`chapters` / `verse_keys` as JSON strings; indexes on `scholar_id`, `created_date`).
- `pnpm db:generate` + `pnpm db:push` against local `dev.db` (no production DB touched; no migration directory in repo — project uses `db push` for SQLite).
- No API/frontend changes required; existing `serializePayload` / `deserializeRecord` already handle chapter arrays.
- Extended `server/test-functional-critical.js` with Podcast CRUD assertions (suite now **30/30**).

### Remaining SQLite ↔ Production schema differences

**Superseded by Task 7 / 7.1:** `pnpm test:schema` now reports **27/27 models in parity** (provider-only difference). `schema.production.prisma` is regenerated from the canonical SQLite schema; `Follow.followed_id`, `Verse`, `Podcast`, engagement models, and indexes match. Historical drift rows below are retained only as pre-Task-7 context and are **no longer current**.

| Category (historical, pre-Task 7) | Detail | Status after Task 7.1 |
|----------|--------|------|
| Models only in one schema file | Engagement / Verse / Podcast drift | **Resolved** — parity gate green |
| `Follow` shape (`followed_id` vs `scholar_id`) | Prod file lagged | **Resolved** — both use `followed_id` |
| Dual-schema lockstep | Hand-maintained production copy | **Resolved** — `db:sync-production-schema` + `test:schema` |

**Canonical runtime schema today:** `server/prisma/schema.prisma`. Production derivative: `server/prisma/schema.production.prisma` (generate with `db:sync-production-schema`). PG client: `db:generate:pg` / `db:prepare:prod`. PG provision: `db:migrate` (not `db push`).

---

## Architectural limitations

1. Transactional email + SMS providers for production OTP.  
2. Server-side watch history if cross-device required.  
3. Full-text search if catalog grows beyond client filter.  
4. CDN / object storage beyond local disk.  
5. Live WebRTC SFU if live is in launch scope.  
6. Prisma Client shared output: SQLite and PostgreSQL generate into the same `@prisma/client` directory — last generate wins (see Task 7.1).  

---

## Task 7 / 7.1 — Schema unification + PostgreSQL migrate deploy

### Architecture (canonical)
- `server/prisma/schema.prisma` = **canonical** SQLite source of truth (includes `Verse`, `Podcast`, `Follow.followed_id`, `follower_name`, `post_excerpt`, engagement models).
- `server/prisma/schema.production.prisma` = **generated** PostgreSQL derivative via `pnpm db:sync-production-schema` (provider-only difference).
- Parity enforced by `pnpm test:schema` (`scripts/check-schema-parity.mjs`).
- Initial production migration: `server/prisma/migrations/20261110130000_init_canonical/migration.sql`  
  Verified **byte-identical** to `prisma migrate diff --from-empty --to-schema-datamodel server/prisma/schema.production.prisma --script`.  
  Contains only `CREATE` / index / FK statements — no `DROP`/`TRUNCATE`/destructive ops.
- Lock file: `server/prisma/migrations/migration_lock.toml` → `provider = "postgresql"`.

### Client generation (shared output)
| Command | Schema | Use |
|---------|--------|-----|
| `pnpm db:generate` | `schema.prisma` (sqlite) | Local dev + SQLite tests (default) |
| `pnpm db:generate:pg` | `schema.production.prisma` | PG smoke / production image |
| `pnpm db:prepare:prod` | sync → parity → generate:pg | Production prepare sequence |

Both write to the same `@prisma/client` output. After any local `db:generate:pg`, re-run `pnpm db:generate` before SQLite app/tests.

### Development vs production DB commands
| Intent | Command |
|--------|---------|
| Local schema iterate | `pnpm db:generate` + `pnpm db:push` |
| Sync PG derivative | `pnpm db:sync-production-schema` |
| Parity check | `pnpm test:schema` |
| Production / empty PG provision | `DATABASE_URL=postgresql://… pnpm db:migrate` |
| Disposable PG probe only | `pnpm db:push:pg` (**not** a migrate substitute) |
| Isolated PG CRUD | `DATABASE_URL=postgresql://… pnpm test:pg-smoke` |

### Fresh migrate deploy evidence (Task 7.1)
Isolated Docker Postgres `ayeh-pg-schema-test` (`postgres:16-alpine`, host port **5433**, password `ayeh_test`).  
Created empty DB `ayeh_migrate_verify_71` (and re-verified on `ayeh_migrate_verify_71b`):

```
Applying migration `20261110130000_init_canonical`
All migrations have been successfully applied.
Database schema is up to date!
```

Post-deploy: **27 app tables** + `_prisma_migrations`; **33** foreign keys including `Follow_followed_id_fkey`, `Vote_entry_id_fkey`, `Like_video_id_fkey`; Follow/Verse unique indexes present.  
`pnpm test:pg-smoke` on the migrate-deployed DB: **failures=0** (User, Follow, Video, Like, Bookmark, Verse, Podcast, Competition, CompetitionEntry, Comment, Vote, Report, ModerationAction).

**Do not claim production compatibility from `db push` alone** — Task 7.1 proof is `migrate deploy` on a genuinely empty database.

### Task 7.1 regression results (recorded)

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 27/27 models, provider-only difference |
| `pnpm test:critical` | **PASS** — `Result: 35 passed, 0 failed` |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (tailwind CJS/ESM warning only) |
| Fresh `prisma migrate deploy` | **PASS** — `20261110130000_init_canonical` |
| `pnpm test:pg-smoke` (post-migrate) | **PASS** — `failures=0` |
| `pnpm db:generate` / `pnpm db:generate:pg` | **PASS** — shared output; last generate wins |

### Files / tooling (Task 7+)
- `server/prisma/schema.prisma` — canonical (Verse, Podcast, Follow shape, …)
- `server/prisma/schema.production.prisma` — generated PG derivative
- `server/prisma/migrations/20261110130000_init_canonical/migration.sql` — initial PG migration
- `scripts/sync-prisma-production-schema.mjs`, `scripts/check-schema-parity.mjs`, `scripts/pg-schema-smoke.mjs`
- `package.json` — `db:generate:pg`, `db:prepare:prod`, `db:migrate`, `test:schema`, `test:pg-smoke`
- `AGENTS.md` — database architecture + generate/migrate safety

No production database modified. Existing migration history preserved (not overwritten). No UI/CSS changes in Task 7.1.

### Remaining functional blockers
- None blocking schema parity, migrate deploy, critical/API suites, typecheck, or build.
- Still PARTIAL product-wise: SMS/email delivery, live WebRTC SFU, CDN/object storage.
- Production deploy must apply follow-up migration `20261110140000_watch_history_khatm_indexes` (additive WatchHistory + KhatmPart indexes). Not run against production in this session.

---

## Task 8 — WatchHistory / Khatm / Competition judge (recovery)

### Recovery state on entry
Interrupted Task 8 left **partial** work: route files + canonical `WatchHistory` model + competitions judge/results edits existed, but:
- SQLite had **no** `WatchHistory` table / Khatm unique indexes yet (`db push` pending)
- Prisma Client lacked `WatchHistory`
- `schema.production.prisma` was **out of parity** (missing WatchHistory / Khatm indexes)
- Live Express process did not serve `/api/watch-history` or `/api/khatm` (stale process → 404)
- `KhatmDetail` / `Quran` still called blocked entity updates
- Critical suite had no §8–§10 coverage; `FUNCTIONAL_QA_AUDIT.md` still marked these NOT IMPLEMENTED/PARTIAL

### Design choices verified
| Area | Choice |
|------|--------|
| WatchHistory | Soft `video_id` (no Video FK) so deletes preserve history; `@@unique([user_id,video_id])` both non-null (SQLite+PG safe); user FK `onDelete: Cascade` |
| Khatm | Atomic `/api/khatm/parts/:id/{reserve,release,complete}` with `updateMany` + TTL; entity reservation fields blocked |
| Competitions | Default judge status remains **`verified`**; results include `verified\|published`; manual `rank_position` skips auto-recalc; `/:id/results` registered before `/:id` |

### Verification (this session)

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 28/28 models, provider-only difference |
| `pnpm test:critical` | **PASS** — `Result: 58 passed, 0 failed` (adds §8–§10) |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (tailwind CJS/ESM warning only) |
| Local `pnpm db:push` | **PASS** — WatchHistory + KhatmPart unique/indexes on SQLite |

### Files (Task 8)
- `server/prisma/schema.prisma` / synced `schema.production.prisma` — `WatchHistory`, KhatmPart indexes
- `server/prisma/migrations/20261110140000_watch_history_khatm_indexes/` — PG follow-up migration (not applied to production here)
- `server/routes/watch-history.js`, `server/routes/khatm.js`, `server/routes/competitions.js`, `server/routes/entities.js`, `server/index.js`
- `src/lib/watchHistory.js`, `src/views/WatchHistory.jsx`, `src/views/KhatmDetail.jsx`, `src/views/Quran.jsx`, `src/lib/api.js`
- `server/test-functional-critical.js`, `server/test-api.js` (khatm path), `AGENTS.md`

No UI/UX redesign. Unrelated working-tree changes preserved.

### Recommended next development task
1. Production ops: `pnpm db:migrate` to apply `20261110140000_watch_history_khatm_indexes` on empty/staging PG first.  
2. Wire real email/SMS providers; object storage/CDN for uploads.  
3. Live WebRTC SFU verification; then UI/UX pass.

---

## Task 9.1 — Security audit resume (WatchHistory exposure + authz)

### Confirmed vulnerabilities (fixed)

| Finding | Endpoint / path | Severity | Impact | Evidence | Fix |
|---------|-----------------|----------|--------|----------|-----|
| WatchHistory Entity list/get/update/delete IDOR | `GET/PUT/DELETE /api/entities/WatchHistory[/:id]`, `POST .../filter` | **Critical** | Unauth listed all history (`200`, `total≥2`); user B updated/deleted user A’s row (`200`) | HTTP repro with isolated OTP users before fix | `WatchHistory` → `PRIVATE_OWNER_ENTITIES` + `STRICT_OWNER_ENTITIES`; private get-by-id check |
| CompetitionEntry self-scoring via Entity API | `PUT /api/entities/CompetitionEntry/:id` | **High** | Author set `score_total=100`, `rank_position=1`, `status=published`, `judged_by=self` (`200`) while judge route correctly `403` | HTTP repro | Non-staff updates that touch judge/approval fields → `403`; create strips those fields |
| KhatmPart structural delete bypass | `DELETE /api/entities/KhatmPart/:id` | **High** | Non-owner deleted another session’s reserved part (`200`) while `/api/khatm/.../release\|complete` correctly `403` | HTTP repro | Mutate/create requires session creator or staff; reservation fields still blocked |

### Disproved / already correct

| Probe | Result |
|-------|--------|
| Dedicated `/api/watch-history` unauth | `401/403` (pre-existing) |
| Dedicated Khatm release/complete by non-owner | `403` (pre-existing) |
| `/api/competitions/entries/:id/judge` by regular user | `403` via `COMPETITION_JUDGE` |
| Vote duplicate | API toggles off + Prisma `@@unique([user_id, entry_id])` present |
| WatchHistory create spoof `user_id` via entities | Already rebound to caller when owner policy applied |

### Correctness / hardening fixed with evidence

| Item | Change |
|------|--------|
| WatchHistory pagination `total` | Was page length; now `count({ where })` + `has_more` + aggregate `total_watch_seconds` |
| `video_id` validation | Length ≤128 + charset allowlist (not claimed as SQLi) |
| Response fields | Dedicated WH responses no longer echo `user_id` / internal dates |
| Account delete cleanup | Adds `Vote`/`Like`/`Bookmark`/`Report`/`ModerationAction`; nulls video `reciter_id` / competition `organizer_id` / report reviewer |
| JWT auth errors | No longer return raw `err.message` to clients |
| Competition public results | Strip `judged_by` / `reviewed_by` / `rejection_reason` |

### Migration safety (`20261110140000_watch_history_khatm_indexes`)

- SQL: creates `WatchHistory` + unique `(user_id,video_id)` + indexes; unique `(session_id,part_number)` + indexes on `KhatmPart`; FK `WatchHistory.user_id → User.id ON DELETE CASCADE`.
- Local SQLite preflight: **0** duplicate `(session_id, part_number)` rows.
- Risk on populated PG: `CREATE UNIQUE INDEX "KhatmPart_session_id_part_number_key"` fails if duplicates exist — run read-only `SELECT session_id, part_number, COUNT(*) … HAVING COUNT(*)>1` before deploy; do **not** delete user data during audit.
- Risk if WatchHistory already created out-of-band on a PG instance: `CREATE TABLE "WatchHistory"` would fail — treat as ops preflight, not a code defect.
- Not applied to production in this session.

### Auth rate limiting (inspected, no new limits added)

- `server/index.js` in-memory limiter on `/api/` — **production only** (`NODE_ENV === 'production'`), 100 req/min/IP; skipped in development.
- No dedicated login/OTP buckets beyond that shared limiter.

### Verification (Task 9.1)

| Command | Result |
|---------|--------|
| HTTP WatchHistory unauth/cross-user/owner after fix | unauth `401`; cross list empty / get-update-delete `403`; owner get `200` |
| HTTP CompetitionEntry self-score after fix | `403` with judge field names |
| HTTP KhatmPart stranger delete after fix | `403` |
| `pnpm test:schema` | **PASS** |
| `pnpm test:critical` | **PASS** — `76 passed, 0 failed` (adds §11 security regressions) |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (tailwind CJS/ESM warning only) |

### Files changed (Task 9.1)

- `server/routes/entities.js` — private WatchHistory; KhatmPart session-creator authz; CompetitionEntry judge-field lock
- `server/routes/watch-history.js` — true total count, video_id validation, leaner responses
- `server/routes/competitions.js` — public results field scrub
- `server/routes/auth.js` — broader account-delete cleanup
- `server/middleware/auth.js` — stop leaking JWT verify exception text
- `server/test-functional-critical.js` — §11 security regressions
- `FUNCTIONAL_QA_AUDIT.md` — this section

Unresolved critical authz: **none** after the three confirmed fixes above.

---

## Commands / verification results (Task 6 baseline, historical)

```bash
pnpm test:critical   # node server/test-functional-critical.js
pnpm test            # node server/test-api.js
pnpm typecheck
pnpm build
```

| Command | Result (Task 6 era) |
|---------|--------|
| Focused Podcast CRUD probe | **PASS** — create 201, chapters array, get 200, delete 200 |
| `pnpm test:critical` | **PASS** — was `30 passed` pre-Verse; now **35/35** after Task 7 |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (tailwind CJS/ESM warning only) |

### Files modified (Task 6)
- `server/prisma/schema.prisma` — added `Podcast` model
- `server/prisma/dev.db` — table pushed via `db push` (local only)
- `server/test-functional-critical.js` — Podcast CRUD critical assertions
- `FUNCTIONAL_QA_AUDIT.md` — this section

### Remaining functional blockers (superseded by Task 7.1 section above)
Historical Task 6 note: migrations directory did not yet exist; production PG migrate deploy was completed in Task 7.1.

---

## Recommended next development task

1. Provision a real Staging Postgres + app target; dry-run the full migrate chain there (see Task 10).  
2. Production ops (approval required): backup → preflight SQL → `pnpm db:migrate` for both migrations.  
3. Wire real email/SMS providers before relying on OTP in production; object storage/CDN if multi-instance; Live SFU if live is launch-scoped.  
4. Optional hardening: dedicated login/OTP rate buckets; optionally disallow CompetitionEntry create via generic entities.

---

## Task 10 — Staging & release readiness

### Repository safety (entry)

- Branch: `main` (ahead of `origin/main` by 1: `8b196d4 Watch page rebuild checkpoint`).
- Large dirty working tree preserved (UI + server + schema + audits). **No** reset/clean/stash.
- Untracked of note: `FUNCTIONAL_QA_AUDIT.md`, migration folder, `scripts/*schema*`, `server/routes/{khatm,watch-history}.js`, upload binaries under `uploads/` / `server/uploads/`.
- Staging secrets: **none configured** (`STAGING_DATABASE_URL` absent; no `.env.staging`).
- Local `.env.production`: placeholder only (`DATABASE_PROVIDER=postgresql` but `DATABASE_URL` is still SQLite `file:`) — **not** treated as Staging or Production. **No remote DB connections.**

### Migration-chain verification (Locally verified)

Isolated Docker Postgres `ayeh-pg-schema-test` (`postgres:16`, host **5433**). Commands used `prisma migrate deploy` via `pnpm db:migrate` (not `db push`).

| Scenario | Database | Evidence |
|----------|----------|----------|
| A. Fresh empty install | `ayeh_task10_fresh` | Applied `20261110130000_init_canonical` + `20261110140000_watch_history_khatm_indexes`. **28** app tables + `_prisma_migrations`. **34** FKs. WatchHistory PK + `user_id` FK `ON DELETE CASCADE`. Indexes: `WatchHistory_user_id_video_id_key`, `WatchHistory_user_id_last_watched_at_idx`, `WatchHistory_video_id_idx`, `KhatmPart_session_id_part_number_key`, `KhatmPart_session_id_idx`, `KhatmPart_status_idx`, `KhatmPart_user_id_idx`. |
| B. Existing DB upgrade | `ayeh_task10_upgrade` | Init-only → seeded 2 users, 2 videos, 1 session, 3 unique `KhatmPart` rows → migrate 2 succeeded. Pre-existing rows intact. Post-check: unique WatchHistory enforced; soft orphan `video_id` insert OK; deleting user cascades that user’s WatchHistory; KhatmPart rows retained (no `user_id` FK). |
| C. Conflicting dataset | `ayeh_task10_conflict` | Duplicate `(session_id, part_number)` inserted deliberately. Migrate 2 **failed** `P3018` / Postgres `23505` on `KhatmPart_session_id_part_number_key`. Duplicate rows **unchanged** (no silent dedupe). Failed migration marker left in `_prisma_migrations` (`finished_at` null); WatchHistory table not left behind (transaction rollback). |

**Staging verified:** none. **Production:** not touched.

### Preflight SQL (read-only)

Documented in `docs/DEPLOYMENT_RUNBOOK.md` §5. Primary conflict detector:

```sql
SELECT session_id, part_number, COUNT(*) AS cnt, array_agg(id) AS ids
FROM "KhatmPart"
GROUP BY session_id, part_number
HAVING COUNT(*) > 1;
```

Manual reconciliation of duplicates requires **explicit approval** before any DELETE/UPDATE; deploy must not auto-dedupe.

### Staging environment assessment

| Check | Result |
|-------|--------|
| Verified Staging database URL | **Missing** |
| Verified Staging deploy target (Docker/K8s/PaaS config) | **Missing** in-repo |
| Safe action taken | Local isolated migrate verification + runbook only |

### Integration readiness (do not invent)

| Area | Implemented | Missing | Env / services | How to test | Blocks prod release? |
|------|-------------|---------|----------------|-------------|----------------------|
| Email OTP | Brevo-compatible SMTP (Nodemailer) + console (dev); hashed OTP store; startup validation; auth routes integrated | Live Brevo proof against a real mailbox | `EMAIL_PROVIDER`, `SMTP_*`, `EMAIL_FROM` | Register → SMTP or console; mocked unit tests in `pnpm test:delivery` | **Blocks if prod lacks SMTP creds**; code refuses silent console fallback |
| SMS OTP | TextBee (prod default) + Twilio optional + console (dev); E.164 normalize; auth routes integrated | Live TextBee proof (API accept ≠ delivered) or Twilio handset | `SMS_PROVIDER`, `TEXTBEE_*` or `TWILIO_*` | `/send-otp-phone` → TextBee/Twilio/console; `pnpm test:delivery` | **Conditional** — blocks phone-login launch until TextBee gateway (or Twilio) is configured + verified |
| WebRTC SFU | Socket.io room presence + **signaling** relay (`offer`/`answer`/ICE) in `server/socket.js` | Media SFU, TURN, recording, multi-node room state | No TURN/LiveKit/mediasoup config | Manual 2-browser live room; signaling events only | **Only if live broadcast is in launch scope** (else PARTIAL product) |
| CDN / object storage | Local disk Multer + static `/uploads` (+ HLS under `/uploads/hls`) | S3/R2/GCS, CDN URLs, signed uploads | No object-storage env | Upload → `GET /uploads/...` on same node | **Yes for multi-instance / durable media**; single-node soft-launch possible with disk caveat |

### Security hardening classification (Task 10 review)

| Topic | Classification | Notes |
|-------|----------------|-------|
| Dedicated login/OTP rate-limit buckets | **Implemented (Task 11) / residual multi-instance gap** | Auth routes use in-memory per-IP + per-destination limits (`server/lib/delivery/rateLimit.js`) plus global `/api/` limiter. Still **not** shared across processes — document/ops gap for horizontal scale. |
| CompetitionEntry create via generic Entity endpoints | **Functional limitation** / **Optional hardening** | Create still allowed via `POST /entities/CompetitionEntry` (judge fields stripped for non-staff — Task 9.1). Dedicated `/api/competitions/:id/entries` is the preferred path. Self-scoring via Entity update was a **confirmed vulnerability** and is fixed. |
| Moderation/audit history on account deletion | **Intentional product decision** (with retention tradeoff) | `DELETE /api/auth/me` deletes `ModerationAction` rows where `actor_id` is the user; reporter-owned `Report`s deleted; `reviewed_by` nulled. Not silent data corruption — explicit cleanup. If compliance needs immutable audit logs, that is a product change, not an open vuln. |

### Documentation delivered

- Created `docs/DEPLOYMENT_RUNBOOK.md` (env vars, generate sequence, backup, preflight, migrate, verify, health, recovery, rollback limits, lock risks).
- Distinguishes Locally verified / Staging verified / Not yet verified / Production-only (approval required).

### Regression gates (Task 10) — Locally verified

After PG migrate probes, `pnpm db:generate` restored the SQLite client; API restarted without shell-overridden `DATABASE_URL`.

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 28/28 models, provider-only difference |
| `pnpm test:critical` | **PASS** — `Result: 76 passed, 0 failed` |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (existing tailwind CJS/ESM warning only) |
| Fresh PG migrate chain | **PASS** — `ayeh_task10_fresh` |
| Existing DB upgrade migrate | **PASS** — `ayeh_task10_upgrade` |
| Conflicting KhatmPart migrate | **FAIL as expected** — `ayeh_task10_conflict` (`23505`); data preserved |

**Staging verified:** none. **Production migrate:** not run.

### Remaining risks / next task

1. **No Staging** — production migrate remains unproven outside local Docker.  
2. OTP email/SMS stubs — production users cannot receive codes without providers.  
3. Local-disk media — not multi-instance safe.  
4. Failed-migration recovery requires ops familiarity with `prisma migrate resolve` after approved data fixes.  
5. **Next recommended task:** stand up Staging (DB + app + secrets) and dry-run migrate + smoke there before any Production approval.

---

## Task 11 — Production Email & SMS OTP Integration (2026-11-10)

### Status

**COMPLETE (code + local verification).** Real SMTP/Twilio live message delivery was **not** exercised (no authorized provider credentials).

### What shipped

- Provider architecture under `server/lib/delivery/` (SMTP Nodemailer, Twilio fetch, console dev-only).
- Auth routes integrated: register, verify-otp, resend-otp, send/verify phone OTP, reset-password-request/reset, login gate.
- `server/loadEnv.js` first-import env load (also via `server/lib/jwt.js`).
- Hashed OTP storage (`h1:` HMAC), attempts / cooldown / rate limits.
- PG migration `20261110150000_auth_otp_attempts_delivery`.
- Unit suite `pnpm test:delivery` (included in `pnpm test:critical`).

### Regression gates (Task 11) — Locally verified

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 28/28 models |
| `pnpm test:delivery` | **PASS** — 45/45 (after startup-validation assertion) |
| `pnpm test:critical` | **PASS** — functional `82 passed, 0 failed` (+ delivery suite) |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (existing tailwind CJS/ESM warning only) |
| Fresh PG migrate | **PASS** — `ayeh_task11_fresh` (3 migrations) |
| Upgrade PG migrate | **PASS** — `ayeh_task11_upgrade` (existing AuthOtp row preserved; `attempts=0`) |
| API startup (`node server/index.js`) | **PASS** — console email/sms selected in development |

**Real SMTP/Twilio send:** not verified. **Staging:** none. **Production migrate:** not run.

---

## Task 12 — Staging Environment Setup & Release Readiness (2026-11-10)

### Verdict

**Provider-independent preparation COMPLETE. Remote Staging NOT deployed.**  
Local Docker Postgres migration rehearsal is **Locally verified** only and must not be described as a deployed Staging environment.

### Repository / infrastructure discovered

| Item | Result |
|------|--------|
| Branch | `main` (ahead of `origin/main` by 1); large dirty working tree **preserved** |
| Docker / Compose in-repo | **None** prior to Task 12; added `docker-compose.staging.example.yml` (Postgres example only) |
| CI/CD (`.github/workflows`) | **Missing** |
| Dockerfile | **Missing** |
| VPS / PaaS / deploy target | **Not present** in-repo |
| Local PG rehearsal host | Docker `ayeh-pg-schema-test` (`postgres:16-alpine`, host **5433**, password `ayeh_test`) — disposable test DB only |
| `.env.production` | Placeholder (`DATABASE_PROVIDER=postgresql` + SQLite `file:` URL) — **not** Staging/Production |
| Staging secrets | **Missing** (template: `.env.staging.example`) |

### Security issues discovered and fixed

| Issue | Fix |
|-------|-----|
| `NODE_ENV=production` + `AUTH_DELIVERY_REQUIRED=false` could skip fatal delivery validation | Production always fail-closed; override refused via `assertDeliveryConfigured` / `isDeliveryRequired` |
| Explicit default `JWT_SECRET` only warned | Production **aborts** on missing or well-known default secret |
| OTP pepper could fall back to weak/dev defaults | `assertOtpSecretsConfigured()` refuses weak/default/short peppers in production |
| `AUTH_RATE_LIMIT_DISABLED=true` usable in production | Refused via `assertAuthRateLimitSafe()` |
| Login/OTP limits mostly IP-scoped | Added per-destination email/phone windows + separate per-IP and per-account login caps |
| Health check lacked DB signal | `GET /api/health` now pings DB (`database=ok\|error`) |

### Production delivery fail-closed verification

Covered by `pnpm test:delivery` (Task 12 additions): production ignores `AUTH_DELIVERY_REQUIRED=false`; console providers refused; missing SMTP/Twilio fails assert; valid providers pass; weak OTP pepper / disabled rate limits refused.

### Rate-limiting scope and limitations

| Scope | Implemented? |
|-------|--------------|
| Per-IP send / verify / login / reset | Yes |
| Per-email / per-phone destination window | Yes (Task 12) |
| Per-account login window | Yes (Task 12) |
| Resend cooldown | Yes |
| OTP verify attempt counter (DB) | Yes (`AuthOtp.attempts`) |
| Multi-process / multi-instance shared limits | **No** — in-memory only; explicitly documented |

### Staging architecture selected / proposed

Single Staging Node app + dedicated Staging PostgreSQL + independent secrets + local `/uploads` volume. Templates: `.env.staging.example`, `docker-compose.staging.example.yml`. Full procedure in `docs/DEPLOYMENT_RUNBOOK.md` §12.

### Real Staging deployed?

**No.** No authorized remote host, Staging DB URL, or Staging delivery credentials were available.

### Migration rehearsal (Locally verified — not Staging)

| Scenario | DB | Result |
|----------|----|--------|
| Fresh | `ayeh_task12_fresh` | 3 migrations applied; 28 tables; 34 FKs; WatchHistory + KhatmPart indexes; AuthOtp `attempts`/`last_sent_at` |
| Upgrade | `ayeh_task12_upgrade` | Init → seed → migrate 2+3; Users/Videos/KhatmParts/AuthOtp intact; WatchHistory created |
| PG smoke | `ayeh_task12_fresh` | `pnpm test:pg-smoke` failures=0 |
| Client restore | — | `pnpm db:generate` restored SQLite client after PG generate |

### Smoke tests on remote Staging

**Not run** — no Staging deployment. Local SQLite critical/API suites remain the functional gate.

### External email/SMS verification

**Mocked only** (`pnpm test:delivery`). No authorized live SMTP/Twilio send performed.

### Storage / multi-instance readiness

- **Intended soft-launch posture:** single app instance with persistent `/uploads` disk + DB backups.  
- **Multi-instance:** blocked without shared object storage + shared/edge rate limiting + Socket.io sticky/shared adapter; Live still lacks SFU/TURN.

### Remaining Production blockers (exact owner inputs)

1. Staging (then Production) host + deploy access  
2. Dedicated Staging PostgreSQL URL  
3. Staging/Production `JWT_SECRET` + `OTP_PEPPER`  
4. Authorized SMTP credentials + test inbox  
5. Authorized Twilio credentials + test handset  
6. Single- vs multi-instance decision  
7. Whether Live WebRTC is launch-scoped  

### Regression gates (Task 12) — Locally verified

After PG rehearsal, `pnpm db:generate` restored the SQLite client. API restarted on SQLite `.env` (no shell `DATABASE_URL` override).

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 28/28 models, provider-only difference |
| `pnpm test:delivery` | **PASS** — **71 passed, 0 failed** |
| `pnpm test:critical` | **PASS** — schema + delivery + functional **82 passed, 0 failed** |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** |
| Fresh PG migrate | **PASS** — `ayeh_task12_fresh` |
| Upgrade PG migrate | **PASS** — `ayeh_task12_upgrade` |
| `pnpm test:pg-smoke` | **PASS** — failures=0 on `ayeh_task12_fresh` |
| `GET /api/health` | **PASS** — `{ status: ok, database: ok }` on local SQLite app |

**Staging verified:** none. **Production migrate:** not run. **Real SMTP/Twilio:** not verified.

---

## Task 13 — Production Deployment Packaging (2026-11-10)

**Scope:** Multi-target Docker images, Nginx reverse proxy, Compose example, explicit migrate script, minimal CI, documentation.  
**Not in scope:** Remote Staging or Production deploy.

### Packaging artifacts (Implemented)

| Artifact | Status |
|----------|--------|
| `Dockerfile` (`api` / `web` targets, non-root `node`) | Present |
| `.dockerignore` (excludes `.env*`, local uploads, logs) | Present |
| `docker-compose.prod.example.yml` | Present |
| `.env.production.docker.example` (tracked template) | Present; real `.env.production.docker` gitignored |
| `deploy/nginx/default.conf` (`/api`, `/uploads`, `/socket.io` → api; else → web) | Present |
| `scripts/migrate-deploy.sh` (explicit; not on container start) | Present |
| `.github/workflows/ci.yml` (tests + typecheck + build; **no deploy**) | Present |
| `docs/DEPLOYMENT_RUNBOOK.md` §14 | Present |

### Local Docker stack (`ayeh-prod-local`) — Verified in Docker

| Check | Result |
|-------|--------|
| Images `ayeh-api:local` / `ayeh-web:local` | Built; containers healthy |
| Public port | Host `8080` → proxy only; DB `5432` **not published** |
| `GET /api/health` via proxy | `{"status":"ok","database":"ok"}` |
| Proxy → `/`, `/api/videos`, `/api/auth/me` (401) | Verified |
| PostgreSQL provider inside API | `DATABASE_PROVIDER=postgresql` |
| `_prisma_migrations` | All 3 migrations `applied=t` |
| Uploads volume `ayeh-prod-local_ayeh_uploads` → `/app/uploads` | Marker + unique file survive `api` recreate; proxy `200` |
| Raw WebSocket upgrade | `HTTP/1.1 101 Switching Protocols` on `/socket.io` via proxy |
| Socket.IO client (websocket transport) | Connected; `transport=websocket`, `readyState=1` |
| Non-root containers | `uid=1000(node)` for api + web |
| No `.env` baked into images | Confirmed (no `/app/.env*` in image layers) |
| Weak/default `JWT_SECRET` | One-off container refused (default secret message) |
| `EMAIL_PROVIDER=console` in production | Refused |
| `AUTH_DELIVERY_REQUIRED=false` in production | Refused |

### Explicit non-claims

- **Staging verified:** none  
- **Production verified:** none  
- **Real SMTP/Twilio delivery:** not verified  
- Multi-instance shared uploads / shared rate-limit store: **not implemented**  
- Live WebRTC SFU/TURN: **not packaged** (signaling-only)

### Regression gates (Task 13) — Locally verified

After any PG generate, `pnpm db:generate` restored the SQLite client. Shell `DATABASE_URL` / `DATABASE_PROVIDER` unset so dotenv SQLite `.env` is used. Docker `ayeh-prod-local` left running (proxy `:8080`).

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 28/28 models, provider-only difference |
| `pnpm test:delivery` | **PASS** — **71 passed, 0 failed** |
| `pnpm test:critical` | **PASS** — schema + delivery + functional **82 passed, 0 failed** |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (Next.js 16.5 canary; 1 Tailwind ESM/CJS format warning) |
| Local `GET /api/health` (`:5000`) | **PASS** — SQLite app `database=ok` |
| Docker proxy `GET /api/health` (`:8080`) | **PASS** — PostgreSQL `database=ok` |

**Staging verified:** none. **Production deploy:** not run. **Real SMTP/Twilio:** not verified.

---

## Task 15 — Brevo SMTP + TextBee SMS Integration (2026-11-10)

**COMPLETE (code + mocked automated tests + docs/env/compose).** Live Brevo authentication/delivery and live TextBee Android SMS were **not** exercised (no authorized provider credentials / gateway in this environment).

### What landed
- Reused Nodemailer SMTP provider with Brevo defaults (STARTTLS on 587, cert validation, production-required `SMTP_USER`/`SMTP_PASS`).
- Independent TextBee module `server/lib/delivery/sms/textbee.js` (`POST /gateway/send-sms`, `x-api-key`, E.164, 429→rate-limit, status poll via `getBatchStatus`). Explicitly distinguishes API acceptance (`smsBatchId`) from carrier delivery.
- Production SMS default → `textbee` (Twilio remains opt-in). Console refused in production; no silent fallback.
- Env/compose/docs synchronized: `.env.example`, `.env.staging.example`, `.env.production.docker.example`, `docker-compose.prod.example.yml`, `AGENTS.md`, `docs/DEPLOYMENT_RUNBOOK.md`.
- Gated live script: `pnpm test:delivery:live` (`scripts/live-delivery-verify.mjs`) — requires `ALLOW_LIVE_DELIVERY_TEST=true` + destination email/phone; does not run user OTP flows.

### Evidence labels (Task 15 DoD)
| Item | Status |
|------|--------|
| Brevo SMTP implemented + automated-test verified | **Implemented** + **Integration-tested with mocks** |
| TextBee SMS implemented + automated-test verified | **Implemented** + **Integration-tested with mocks** |
| Env + Compose complete | **Implemented** |
| Mocked provider tests | See regression gates below |
| Real Brevo SMTP auth/delivery | **Not verified** |
| Real TextBee SMS sent via Android gateway | **Not verified** |
| SMS delivered vs API-accepted | **Not verified** (code never claims delivered on HTTP 200) |
| Existing `ayeh-prod-local` Docker stack | Left running; health re-checked after work |

### Remaining blockers for live proof
1. Brevo SMTP login + SMTP key + verified `EMAIL_FROM` sender  
2. Authorized test inbox (`LIVE_DELIVERY_EMAIL`)  
3. TextBee API key + device id  
4. Online Android 7+ phone with TextBee app + SMS-capable SIM  
5. Authorized test handset (`LIVE_DELIVERY_PHONE`)  
6. Then: `ALLOW_LIVE_DELIVERY_TEST=true pnpm test:delivery:live`

### Regression gates (Task 15) — Locally verified

| Command | Result |
|---------|--------|
| `pnpm test:schema` | **PASS** — 28/28 models, provider-only difference |
| `pnpm test:delivery` | **PASS** — **100 passed, 0 failed** (mocked only) |
| `pnpm test:critical` | **PASS** — schema + delivery + functional **82 passed, 0 failed** |
| `pnpm test` | **PASS** — `ALL 17 TESTS PASSED` |
| `pnpm typecheck` | **PASS** |
| `pnpm build` | **PASS** (Next.js 16.5 canary; 1 Tailwind ESM/CJS format warning) |
| `pnpm db:generate` | Restored SQLite client after gates |
| Docker `ayeh-prod-local` | Left running; proxy `/api/health` → `database=ok` |
| `pnpm test:delivery:live` | **Refused** without `ALLOW_LIVE_DELIVERY_TEST` / destinations / live credentials (expected) |

**Staging verified:** none. **Production deploy:** not run. **Real Brevo/TextBee:** not verified.
