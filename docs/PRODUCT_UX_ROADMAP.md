# Product UX Roadmap — Ayeh Media Plus

**Date:** 2026-11-10  
**Status:** Actionable roadmap from Task 16 audit evidence (documentation only; nothing in this file is implemented by this task)  
**Companion docs:** [APARAT_PRODUCT_BENCHMARK.md](./APARAT_PRODUCT_BENCHMARK.md) · [PRODUCT_EXPERIENCE_AUDIT.md](./PRODUCT_EXPERIENCE_AUDIT.md) · [CREATOR_AND_COMPETITION_PRODUCT_SPEC.md](./CREATOR_AND_COMPETITION_PRODUCT_SPEC.md)

**Priority legend**

| Priority | Meaning |
|----------|---------|
| P0 | Security, data integrity, or hard product blockers |
| P1 | Core content creation, publishing, creator & competition workflows |
| P2 | UX consistency, navigation, responsive & RTL |
| P3 | Visual polish and optional enhancements |

---

## P0 — Security, integrity, blockers

### P0-1 — Tracked `.env.production` remediation (authorized security task)

| Field | Detail |
|-------|--------|
| **Problem** | `.env.production` is tracked on `origin/main`. It contains a nonempty `JWT_SECRET` with a weak/dev-like shape and a SQLite `file:` `DATABASE_URL`. `.gitignore` ignores `.env.*` for *new* files, but this file remains tracked from an earlier commit. |
| **Expected outcome** | File is removed from the Git index (and preferably replaced by a template-only example if needed). Any secret that may have been used outside local/dev is rotated under owner control. History rewrite is **not** automatic. |
| **Affected** | `.env.production`, `.gitignore` (verify ignore rules), deployment runbooks; **do not** touch `.env.production.docker` (gitignored local secrets) |
| **Dependencies** | Explicit owner authorization. Confirm whether the JWT was ever used in a shared/staging/production host. |
| **Acceptance criteria** | (1) `git ls-files` no longer lists `.env.production`. (2) No secret values appear in docs, PR text, or chat. (3) If the JWT may have been used externally, it is rotated and dependents updated. (4) No force-push / history rewrite unless the owner explicitly requests it. |
| **Priority** | P0 |
| **Note** | This is a **controlled security task**, not the first product-code change. Document only; do not rotate or untrack in the audit docs pass. |

### P0-2 — Fix creator Video write path (entities vs `/api/videos`)

| Field | Detail |
|-------|--------|
| **Problem** | `SubmissionWizard`, `EditVideo`, and `CreatorDashboard` call `api.entities.Video.*`. In `server/routes/entities.js`, `OWNER_FIELDS` omits `reciter_id` and `Video` is not in `STRICT_OWNER_ENTITIES`, so non-admin writes fail closed (“Admin access required”). A working ownership-aware API already exists at `/api/videos`. Client `src/lib/api.js` has no `videos` helper. |
| **Expected outcome** | Authenticated owners can create/update/delete their own videos via the supported `/api/videos` surface. Entity admin hacks are not required for ordinary publishing. |
| **Affected** | `src/lib/api.js`, `src/components/video/SubmissionWizard.jsx`, `src/views/EditVideo.jsx`, `src/views/CreatorDashboard.jsx`, optionally read paths that should use `/api/videos` list filters; `server/routes/videos.js` (verify only) |
| **Dependencies** | None for the client wiring. Do not weaken entity admin boundaries; prefer routing writes to `/api/videos`. |
| **Acceptance criteria** | (1) `api.videos` (or equivalent) wraps list/get/create/update/delete (+ analytics if needed). (2) Upload wizard create succeeds as role `user`. (3) Owner edit/delete succeed; non-owner denied. (4) No new admin privileges granted to `user`. |
| **Priority** | P0 |

### P0-3 — Competition status vocabulary mismatch

| Field | Detail |
|-------|--------|
| **Problem** | UI filters use `voting` and `upcoming` (`Competitions.jsx`, `shared.jsx`) but Prisma `Competition.status` is `active \| completed \| cancelled \| draft`. Filters against non-schema values hide or empty valid competitions. |
| **Expected outcome** | List filters and labels map only to schema statuses (and/or date-derived “upcoming” computed client-side from `start_date`, not a fake status string). |
| **Affected** | `src/views/Competitions.jsx`, `src/components/community/shared.jsx`, any status chip/color maps; schema comments in `server/prisma/schema.prisma` (docs alignment only unless a later migration adds phases) |
| **Dependencies** | Product decision already captured in the competition spec: do not invent `voting` as a status; use phase/criteria for voting. |
| **Acceptance criteria** | (1) Filter IDs ⊆ schema statuses (plus optional computed upcoming). (2) Empty Docker + seeded competition with `status=active` appears under the correct filter. (3) No UI references to `status === "voting"` as a stored value. |
| **Priority** | P0 |

### P0-4 — Remove non-schema `is_winner` UI reliance

| Field | Detail |
|-------|--------|
| **Problem** | `CompetitionDetail.jsx` reads `entry.is_winner`, which is **not** a Prisma field. Winner presentation should use `rank_position` and/or `/api/competitions/:id/results`. |
| **Expected outcome** | Winner/recognition UI is driven by real fields and the results API. |
| **Affected** | `src/views/CompetitionDetail.jsx`, leaderboard helpers if any |
| **Dependencies** | Results endpoint already exists (`api.competitions.results`). |
| **Acceptance criteria** | (1) No `is_winner` reads. (2) Rank 1–N styling uses `rank_position`. (3) Results rail matches API payload. |
| **Priority** | P0 |

---

## P1 — Core creator & competition workflows

### P1-1 — Creator Studio for every authenticated user

| Field | Detail |
|-------|--------|
| **Problem** | `/creator` RoleGuard allows only `creator \| moderator \| admin`. Product principle: every registered `user` manages their own content without staff powers. Server RBAC already allows `video:submit` for `user+`. |
| **Expected outcome** | All authenticated users reach Creator Studio. Studio never exposes moderation queues, role assignment, or report resolution. |
| **Affected** | `src/app/(main)/creator/page.jsx`, `src/components/RoleGuard.jsx` (usage only), `src/components/design-system/AppSidebar.jsx` (creator nav visibility), `src/views/CreatorDashboard.jsx` |
| **Dependencies** | **P0-2** (otherwise Studio open but publish still broken). |
| **Acceptance criteria** | (1) Role `user` can open `/creator` after login. (2) Guest still sees login wall. (3) No admin/moderation controls appear in Studio for `user`. (4) Sidebar/header entry visible when authenticated. |
| **Priority** | P1 |

### P1-2 — Resolve Card Studio vs Creator Studio naming

| Field | Detail |
|-------|--------|
| **Problem** | `/studio` loads Card Studio (verse cards). Product “Creator Studio” is `/creator` / upload flows. Collision confuses IA. |
| **Expected outcome** | Creator Studio is the primary “studio” mental model; verse Card Studio lives only under a clearly named route (e.g. keep `/card-studio`, retire ambiguous primary label on `/studio`). |
| **Affected** | `src/app/(main)/studio/page.jsx`, `src/app/(main)/card-studio/page.jsx`, nav labels in sidebar/header, `src/views/CardStudio.jsx` |
| **Dependencies** | P1-1 for nav copy consistency. |
| **Acceptance criteria** | (1) Nav never labels Card Studio as the content Creator Studio. (2) Deep links to verse-card tools still work. (3) Upload / library remain under Creator Studio. |
| **Priority** | P1 |

### P1-3 — Content-production competition submission UX

| Field | Detail |
|-------|--------|
| **Problem** | Competition detail submit modal is microphone / «تلاوت» oriented and defaults `media_type: "audio"`. Spec requires video, short, audio, educational/reflective works as first-class. |
| **Expected outcome** | Submit flow supports allowed types from competition rules; prefers linking a Studio video asset to an entry when appropriate; mic remains an option for recitation, not the only path. |
| **Affected** | `src/views/CompetitionDetail.jsx`, upload integration helpers, optionally Creator Studio “Submissions” entry CTA |
| **Dependencies** | **P0-2**, **P1-1** (create content first, then submit). |
| **Acceptance criteria** | (1) User can attach video or audio before deadline. (2) Copy/UI reflects competition type, not only tilawah. (3) Entry created with correct `media_type` and ownership (`author_id`). (4) Venue fields remain optional metadata. |
| **Priority** | P1 |

### P1-4 — Studio Submissions tracking + feedback

| Field | Detail |
|-------|--------|
| **Problem** | No dedicated “my competition submissions” desk. Creators cannot easily track `pending_review → …` or see judge feedback. |
| **Expected outcome** | Creator Studio Submissions tab lists own entries with status chips, rejection reasons, scores when judged, and links to competition detail. |
| **Affected** | `src/views/CreatorDashboard.jsx` (or new studio section), `api.competitions` / entity `CompetitionEntry` reads scoped to current user |
| **Dependencies** | P1-1; judge feedback surface benefits from **P1-5**. |
| **Acceptance criteria** | (1) Authenticated user sees only their entries. (2) Status matches schema entry statuses. (3) Scores/`rejection_reason` visible when set. (4) Empty state CTA to `/competitions`. |
| **Priority** | P1 |

### P1-5 — Staff judge UI for existing judge API

| Field | Detail |
|-------|--------|
| **Problem** | `POST /api/competitions/entries/:id/judge` and `api.competitions.judge` exist; `CompetitionDetail.jsx` has no judge UI. Staff may fall back to raw entity updates. |
| **Expected outcome** | Moderator/admin can score entries from a staff surface (moderation or competition detail staff panel) via the judge API only. Creators cannot edit scores. |
| **Affected** | `src/views/CompetitionDetail.jsx` and/or `src/views/ModerationDashboard.jsx`, `src/lib/api.js` (`competitions.judge`) |
| **Dependencies** | RoleGuard already staff-gates moderation; keep creator Studio free of judge tools. |
| **Acceptance criteria** | (1) Staff can submit scores through UI. (2) Non-staff cannot. (3) Protected judge fields remain server-enforced. (4) Creator sees results via P1-4. |
| **Priority** | P1 |

### P1-6 — Seeded/demo content pack for empty environments (follow-up)

| Field | Detail |
|-------|--------|
| **Problem** | Local `ayeh-prod-local` Docker Postgres was empty during audit (0 videos/competitions). Discovery UX could not be judged with real catalog density. |
| **Expected outcome** | Documented, safe seed/demo pack for disposable local/staging DBs (Quranic sample videos, one active competition, a few channels). |
| **Affected** | `server/prisma/seed.js`, docs/runbooks; **not** production data |
| **Dependencies** | Owner decision on which media assets are authorized to ship in seed. |
| **Acceptance criteria** | (1) Fresh local/staging DB can be seeded without manual SQL. (2) Home/Explore/Competitions show non-empty states. (3) Seed never overwrites production without explicit guard. |
| **Priority** | P1 (ops/QA enabler; do not run against live prod) |

---

## P2 — UX consistency, navigation, responsive & RTL

### P2-1 — Align upload / creator nav gates

| Field | Detail |
|-------|--------|
| **Problem** | Header shows «آپلود ویدیو» for guests; sidebar creator items require `creator+` while `/upload` RoleGuard allows `user`. Over-promises and inconsistent gates. |
| **Expected outcome** | Guest: upload CTA → login. Authenticated `user+`: upload + Studio visible. Staff tools stay separate. |
| **Affected** | `AppHeader.jsx`, `AppSidebar.jsx`, `src/app/(main)/upload/page.jsx`, RoleGuard usages |
| **Dependencies** | P1-1. |
| **Acceptance criteria** | (1) Guest click path lands on login with return URL. (2) Authenticated user sees Studio + Upload. (3) No staff links for `user`. |
| **Priority** | P2 |

### P2-2 — Unify chrome / typography tokens

| Field | Detail |
|-------|--------|
| **Problem** | Dual design languages remain (legacy Layout vs MainLayout; mixed `font-doran` vs design-system tokens). Prior UI audit improved many routes but drift remains. |
| **Expected outcome** | Main App Router shell is the single chrome; page shells/titles use shared tokens (Doran UI / Rokh display / Tajrid Arabic). |
| **Affected** | `MainLayout.jsx`, design-system components, remaining partial routes called out in `UI_VISUAL_AUDIT.md` |
| **Dependencies** | None blocking P0/P1. |
| **Acceptance criteria** | (1) No live App Router page mounts legacy `Layout.jsx`. (2) Spot-check home/explore/watch/creator at 1440 and 390 for consistent type roles. (3) RTL `dir` preserved. |
| **Priority** | P2 |

### P2-3 — Empty / loading / error / success consistency

| Field | Detail |
|-------|--------|
| **Problem** | Empty states are generally intentional on the empty Docker stack, but success/error toasts and loading skeletons are uneven across creator and competition flows. |
| **Expected outcome** | Shared EmptyState + consistent pending/error messaging on publish, edit, competition submit, and Studio lists. |
| **Affected** | Creator/competition views, shared EmptyState component |
| **Dependencies** | P0-2 / P1-3 so real success paths exist to style. |
| **Acceptance criteria** | (1) Failed publish shows Persian actionable error. (2) Success confirms pending_review vs published honestly. (3) Empty Studio/competitions have one primary CTA. |
| **Priority** | P2 |

### P2-4 — IA clarity: video platform vs Quran companion modules

| Field | Detail |
|-------|--------|
| **Problem** | Chrome is Aparat-like (Home/Explore/Videos/Live) while product identity is Quranic creation; Quran/Khatm/Studio/Assistant are secondary. |
| **Expected outcome** | Keep video-first discovery familiarity; surface Quran companion modules without burying Creator Studio or competitions. Document nav IA once and implement consistently desktop + mobile. |
| **Affected** | `MainLayout` `MOBILE_TABS`, `AppSidebar`, home category chips |
| **Dependencies** | Product spec §1 principles. |
| **Acceptance criteria** | (1) Authenticated nav includes Creator Studio. (2) Competitions reachable in ≤2 taps on mobile. (3) Mushaf/Quran still one tap from library/sidebar. |
| **Priority** | P2 |

---

## P3 — Polish & optional enhancements

### P3-1 — Shorts product surface

| Field | Detail |
|-------|--------|
| **Problem** | Shorts are Home/Explore duration heuristics only; no `/shorts` route. |
| **Expected outcome** | Optional dedicated short-form rail/page with Quranic short content — not a clone of Aparat branding. |
| **Affected** | Home/Explore, possible new route |
| **Dependencies** | Catalog with real short videos (P1-6 helps). |
| **Acceptance criteria** | Clear entry + vertical-friendly watch; empty state when none. |
| **Priority** | P3 |

### P3-2 — Wire video analytics into Studio

| Field | Detail |
|-------|--------|
| **Problem** | `GET /api/videos/:id/analytics` exists but is unused in the dashboard. |
| **Expected outcome** | Overview shows real views/engagement for owned videos (no mock series). |
| **Affected** | `CreatorDashboard.jsx`, `src/lib/api.js` |
| **Dependencies** | P0-2 / P1-1. |
| **Acceptance criteria** | Analytics match API for owner; non-owner denied. |
| **Priority** | P3 |

### P3-3 — Channel branding & personalization honesty

| Field | Detail |
|-------|--------|
| **Problem** | Self `/profile` is reading/gamification oriented; “برای شما” is not true personalization (`DailyRecommendation` unmounted per audit). |
| **Expected outcome** | Channel manager in Studio; guest personalization chip either backed by signals or honest login CTA (Aparat pattern). |
| **Affected** | Profile/channel components, Home chips |
| **Dependencies** | P1-1. |
| **Acceptance criteria** | Channel bio/avatar editable by owner; fake personalization removed or gated. |
| **Priority** | P3 |

### P3-4 — Optional in-person competition metadata clarity

| Field | Detail |
|-------|--------|
| **Problem** | Schema has `venue*` fields; UI framing can still feel attendance-first. |
| **Expected outcome** | Venue shown only when set, labeled as optional/in-person add-on; primary CTA remains create & submit content. |
| **Affected** | Competition detail hero/copy |
| **Dependencies** | P1-3. |
| **Acceptance criteria** | Competitions without venue read as online content-production events. |
| **Priority** | P3 |

### P3-5 — Draft video status (schema extension later)

| Field | Detail |
|-------|--------|
| **Problem** | Video statuses lack `draft`; creators cannot save unpublished work-in-progress distinctly from `pending_review`. |
| **Expected outcome** | Optional later schema + UI for drafts (implementation task with migration; not assumed done). |
| **Affected** | `schema.prisma`, videos routes, Studio library |
| **Dependencies** | P0-2 first. |
| **Acceptance criteria** | Draft create/edit without review queue; submit promotes to `pending_review`. |
| **Priority** | P3 |

---

## Dependency graph (summary)

```
P0-1 (env security, owner-authorized)
P0-2 (videos API client wiring) ──┬──► P1-1 (Studio for all users) ──► P1-2, P1-4, P2-1, P3-2, P3-3
                                  ├──► P1-3 (competition submit UX) ──► P1-4, P3-4
                                  └──► P3-5 (drafts, later)
P0-3 (competition status filters)
P0-4 (is_winner → rank_position)
P1-5 (judge UI) ──► richer P1-4 feedback
P1-6 (seed pack) ──► better discovery QA / P3-1
P2-* parallel after P0/P1 core paths work
```

---

## Recommended next implementation task

**Do this next (product code):** **P0-2 + P1-1 together**

1. Add a client `videos` helper in `src/lib/api.js` targeting `/api/videos`.
2. Rewire `SubmissionWizard`, `EditVideo`, and `CreatorDashboard` writes/reads to that helper (ownership via `reciter_id` on the videos API).
3. Open `/creator` (and sidebar entry) to all authenticated roles including `user`, without exposing moderation/admin tools.

**Why:** This unblocks the entire creator → publish → manage loop. Server submit permission for `user` already exists; the gap is UI gating + wrong API wiring. Competition and Studio-tracking work (P1-3/P1-4) depends on publish working.

**In parallel (not blocking product code, requires owner authorization):** **P0-1** — stop tracking `.env.production`, classify exposure, rotate only if the weak JWT may have been used outside local/dev. Do not rewrite Git history unless explicitly requested.

---

## Remaining uncertainty (do not treat as done)

1. Authenticated E2E on `ayeh-prod-local` (upload → review → watch → competition submit → judge) — Docker DB was unseeded; no invented credentials.
2. Aparat authenticated Creator Dashboard / upload wizard — public benchmark only.
3. Whether tracked `.env.production` JWT was ever deployed outside this machine — owner decision for rotation.
4. Live WebRTC SFU quality — known partial per project notes; out of this roadmap’s critical path.
