# Ayeh Media Plus — Product Experience Audit

**Date:** 2026-11-10 (resume of interrupted Task 16)  
**Mode:** Audit & documentation only — no application/source/config changes.  
**Runtime under test:** `ayeh-prod-local` Docker stack via `http://localhost:8080` (proxy → web + api + Postgres). Stack left running and undisturbed.  
**Prior evidence reused:** Task 16 explore report (`agent-transcripts/864b2824-…/subagents/0fb5a19d-…`), root `AUDIT.md`, `LAUNCH_AUDIT.md`, `FUNCTIONAL_QA_AUDIT.md`, `UI_VISUAL_AUDIT.md`, `screenshots/browser-verified-*.png`.

**Screenshots (this pass):** `screenshots/product-audit/ayeh/`  
**Playwright matrix:** 1440×900, 1280×800, 768×1024, 390×844, 360×800 — 20 routes × 5 viewports (see `/tmp/ayeh-audit-screenshots/findings.json`).

**Companion docs:** [APARAT_PRODUCT_BENCHMARK.md](./APARAT_PRODUCT_BENCHMARK.md) · [CREATOR_AND_COMPETITION_PRODUCT_SPEC.md](./CREATOR_AND_COMPETITION_PRODUCT_SPEC.md) · [PRODUCT_UX_ROADMAP.md](./PRODUCT_UX_ROADMAP.md)

---

## 1. Executive verdict

Ayeh already looks like a **Persian RTL video platform** (Aparat-inspired chrome: right sidebar, global search, upload CTA, category chips). The Quranic identity is visible in branding and taxonomy. However, the **creator → publish → manage → compete** loop is broken or incomplete at the product layer:

1. Client video create/update/delete goes through `/api/entities/Video`, which does **not** recognize `reciter_id` as an ownership field → non-admin writes fail closed.
2. `/creator` is gated to `creator|moderator|admin`, so ordinary registered `user`s cannot reach a Creator Studio.
3. Competitions UI is **recitation/audio-first** (mic record) and uses status filters (`voting`, `upcoming`) that **do not exist** on `Competition.status` in Prisma.
4. Local Docker catalog under audit was **empty** (0 videos, competitions, scholars, collections) — empty states work, but discovery quality could not be judged with real content on this stack.

---

## 2. Resume inventory — what was already done vs missing

| Deliverable / investigation | Prior state | This resume |
|-----------------------------|-------------|-------------|
| Code audit routes / RBAC / creator / competitions | Completed in Task 16 explore subagent | Re-verified against current tree |
| `.env.production` tracked-file concern | Identified | Classified safely (no secret values printed) |
| Aparat WebFetch | Failed / thin | Replaced with Playwright + public docs |
| Browser QA on `ayeh-prod-local` | Not finished | Completed guest matrix @ 5 widths |
| `docs/APARAT_PRODUCT_BENCHMARK.md` | Interrupted mid-write | Completed |
| `docs/PRODUCT_EXPERIENCE_AUDIT.md` | Interrupted mid-write | Completed (this file) |
| `docs/CREATOR_AND_COMPETITION_PRODUCT_SPEC.md` | Interrupted mid-write | Completed |
| `docs/PRODUCT_UX_ROADMAP.md` | Missing (interrupted before create) | Completed this resume |
| Authenticated creator/admin E2E on Docker | Incomplete | Still unresolved (no seed users in this DB; not invented) |

---

## 3. Route & navigation audit (verified)

Active shell: `src/app/(main)/layout.jsx` → `src/components/layout/MainLayout.jsx` + `AppHeader` / `AppSidebar` / mobile bottom tabs. Legacy `src/components/Layout.jsx` is **not** wired into App Router.

### 3.1 Route inventory (summary)

Full mapping was verified in code (see prior Task 16 report). Highlights:

| Area | Routes | Notes |
|------|--------|-------|
| Discovery | `/`, `/explore`, `/talks`, `/search` | Home SSR `force-dynamic`; Explore/Talks CSR |
| Watch | `/watch/[id]`, `/watch-history` | History auth-preferred + local cache |
| Creator | `/upload`, `/creator`, `/edit-video/[id]`, `/studio`, `/card-studio` | Studio = CardStudio (verse cards), **not** video studio; `/card-studio` duplicate |
| Competitions | `/competitions`, `/competitions/[id]` | List + detail + submit modal |
| Quranic | `/quran`, `/verse/...`, `/khatm`, `/topics`, `/guide`, `/assistant` | Quran not in Aparat bottom tabs |
| Social | `/community`, `/profile`, `/profile/[id]`, `/bookmarks`, `/achievements`, `/quests` | `/quests` aliases achievements |
| Live | `/live`, `/live/[id]` | No RoleGuard on go-live page |
| Staff | `/moderation` (`moderator|admin`), `/admin` (`admin`) | Login wall observed for guests |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password` | CSR |

**No `/shorts` route** — shorts are Home/Explore heuristics only.

### 3.2 Navigation IA (browser + code)

**Desktop sidebar (guest screenshot):** Home, Explore, Videos, Live, Channels/Scholars, Playlists; Library: Community, Competitions, Mushaf; Login CTA.

**Mobile bottom tabs:** Home, Explore, Videos, Live, Profile (`MainLayout` `MOBILE_TABS`).

**Inconsistencies:**
- Header shows **آپلود ویدیو** even for guests (screenshot); upload/creator then show login wall.
- Sidebar creator items require `creator+` (`AppSidebar.jsx`), but `/upload` RoleGuard allows `user`.
- Quran / Khatm / Studio / Achievements / Assistant are secondary (drawer/deep link), conflicting with a Quran-first product story vs video-first chrome.
- Dual design languages remain in repo (legacy Layout vs MainLayout).

---

## 4. Browser QA results (`localhost:8080`)

All sampled routes returned **HTTP 200** at all five viewports. `html[dir=rtl]` observed consistently. Persian copy renders cleanly.

### 4.1 Empty / loading / auth states

| Route | Guest observation |
|-------|-------------------|
| `/` | Empty videos + empty channels cards with CTAs |
| `/explore`, `/talks`, `/collections`, `/community`, `/scholars` | Empty-oriented catalog |
| `/competitions` | Hero + filters + empty: «مسابقه‌ای در این دسته موجود نیست» |
| `/quran` | Surah list loads (114) — strongest non-empty guest surface |
| `/creator`, `/upload`, `/admin`, `/moderation` | Shared login wall (shield) «وارد حساب کاربری شوید» |
| `/login`, `/register` | Clear Persian forms; register promises “watch & follow Quranic videos” |
| `/studio` | Loads Card Studio chrome (guest) |
| `/live` | Studio/live entry loads |
| `/profile`, `/bookmarks`, `/watch-history` | Guest/empty messaging |

**API confirmation on this stack:**  
`GET /api/videos` → `total: 0`; entity lists for Video/Competition/Scholar/Collection/User → empty. Catalog emptiness is environmental (unseeded Postgres), not a rendering crash.

### 4.2 Responsive notes

- **1440 / 1280:** Right sidebar + centered search; content column readable.
- **768:** Transitions toward compact chrome; nav still present (`navCount=3` in automation).
- **390 / 360:** Bottom tab bar appears; hamburger + search + login; chips wrap/scroll; empty cards remain usable. Brand mark (book icon) remains visible — good identity signal.
- No hard horizontal-break crashes observed on sampled pages.
- Accessibility: login walls and empty states have text + icon + CTA; automated a11y audit (axe) **not** run this pass.

### 4.3 Authenticated journeys

**Unresolved on this resume:** Docker DB had no users/seed; seed credentials are not reliably documented for this stack without risking guesswork. Prior `LAUNCH_AUDIT.md` mentions `admin@ayeh.media` against a different runtime. Do not treat that as proven for `ayeh-prod-local` today.

---

## 5. Creator experience (code + product)

### Strengths
- Upload wizard UI exists (`SubmissionWizard.jsx`).
- Dedicated `/api/videos` with `VIDEO_SUBMIT`, ownership via `reciter_id`, analytics endpoint.
- Public channel surfaces: `/profile/[id]` + Creator/Qari/Scholar profile components.
- Notifications model includes video approval/rejection and competition results.

### Critical weaknesses
1. **Broken write path:** `SubmissionWizard` / `EditVideo` / `CreatorDashboard` call `api.entities.Video.*`. In `server/routes/entities.js`, `OWNER_FIELDS` omits `reciter_id` and `Video` is not in `STRICT_OWNER_ENTITIES` → `ensureWritable` returns **Admin access required** for non-admins.
2. **No client helper for `/api/videos`** in `src/lib/api.js` (competitions helper exists; videos helper does not).
3. **Studio naming collision:** `/studio` is Card Studio (verse cards/stories), while product needs a **Creator Studio** for content/submissions.
4. **Role gate:** `/creator` blocks `user`; product direction requires every registered user to manage their own content **without** admin/moderation powers.
5. **Analytics unused:** `GET /api/videos/:id/analytics` not wired into dashboard.
6. **No draft status** in schema (`pending_review|verified|published|archived|rejected` only).
7. Self `/profile` is reading/gamification oriented — not a channel manager.

---

## 6. Competitions experience

### What exists
- Models: `Competition`, `CompetitionEntry`, `Vote` with scoring fields and entry statuses.
- APIs: list/create/entries/vote/results/judge (`server/routes/competitions.js` + `api.competitions`).
- UI: discovery page, detail with rules, entries, vote, submit modal.
- Submit modal: **microphone recording** or file upload; defaults `media_type: "audio"`; copy centers on «تلاوت».
- Entry cards support audio player and video detection.

### Gaps vs required content-production competition loop
| Required step | Current evidence |
|---------------|------------------|
| 1 Discover competition | List page exists; empty on this stack; filters include non-schema statuses |
| 2 Read topic/rules/requirements | Rules block if `comp.rules` present |
| 3 Create original content | Modal focuses on tilawah audio; weak path for video/educational/reflective pieces as first-class |
| 4 Submit content | Creates via `entities.CompetitionEntry` (owner field `author_id` — OK) + upload integration |
| 5 Track submission/evaluation status | Limited; no dedicated “my submissions” studio view |
| 6 Feedback/results | Judge API exists; **no judge UI** in `CompetitionDetail.jsx`; scores not surfaced as creator feedback loop |
| 7 Recognition/prizes | Prize fields + Leaderboard UI; `is_winner` used in UI but **not a schema field** |

**Status vocabulary mismatch:** UI filters `voting` / `upcoming` (`Competitions.jsx`, `shared.jsx`) vs schema `active|completed|cancelled|draft`.

Physical venue fields exist on `Competition` (`venue`, city, country) — fine as optional metadata; UI hero still frames prizes/tilawah more than “produce & publish content”.

---

## 7. Auth, RBAC, admin boundaries

| Concern | Finding |
|---------|---------|
| Register role | Defaults to `user` |
| Creator elevation | Admin role assign (`USER_ROLE_ASSIGN`) — no self-serve creator onboarding |
| Upload permission | RBAC allows `video:submit` for `user+`; UI path broken via entities |
| Moderation | `/moderation` RoleGuard staff-only; UI uses entities updates more than `/api/moderation` client wrapper |
| Admin | `/admin` admin-only; guest login wall verified |
| Live | `/live` lacks RoleGuard — risk of confusing guests / over-exposing go-live UI |
| Boundary intent | Creator tools must never grant ban/report-resolution — currently creator dashboard does not; good boundary **if** studio is opened to all users carefully |

---

## 8. Design system & RTL

**Strengths:** Consistent teal primary, Persian fonts (Doran/Rokh family in views), RTL dir, EmptyState component, Aparat-like header/sidebar.

**Weaknesses:**
- Dual chrome / dual font class conventions (`font-doran` vs design-system tokens).
- Cards used heavily on marketing/empty sections.
- Competition status colors/labels drift from schema.
- Guest upload CTA over-promises before auth.
- “برای شما” chip is not true personalization (`DailyRecommendation` unmounted per prior audit).

---

## 9. Security findings (env) — summary

See [PRODUCT_UX_ROADMAP.md](./PRODUCT_UX_ROADMAP.md) **P0-1** for remediation steps. Classification only (no values). Do not rotate, untrack, or rewrite history without explicit owner authorization:

| File | Tracked? | Classification |
|------|----------|----------------|
| `.env.production` | **Yes** (on `origin/main`, private repo) | Contains nonempty `JWT_SECRET` with weak/dev-like shape; `DATABASE_URL` is SQLite `file:` URL; API keys empty |
| `.env.production.docker` | No (gitignored) | Local docker secrets/placeholders; differs from example |
| `.env.production.docker.example` | Yes (intentional template) | Placeholder tokens (`change`/`local-docker-…`); TextBee keys are labeled local placeholders, not live credentials |
| `.env` | No | Local dev |
| `.env.example` / `.env.staging.example` | Yes | Templates |

Root cause: `.gitignore` has `.env.*` with un-ignores for `*.example` files, but **`.env.production` was committed earlier** and remains tracked.

---

## 10. Strengths / weaknesses / missing capabilities

### Strengths
- Coherent Aparat-inspired RTL video shell already live in production-like Docker.
- Broad route coverage (Quran, community, competitions, live, moderation).
- Server-side video + competition RBAC concepts exist.
- Empty and auth-gate states are generally intentional and Persian.

### Weaknesses
- Creator publish/manage loop broken for non-admins.
- Creator Studio not available to all registered users.
- Competition product skewed to audio tilawah + incomplete evaluation UX.
- Empty catalog on local prod stack limits discovery QA.
- Nav dual-identity (video platform vs Quran community app).

### Missing (product)
- Universal Creator Studio (content + submissions, no admin powers).
- Content-production competition journey end-to-end.
- Shorts product surface, true recommendations, channel branding settings.
- Wired analytics, drafts/scheduling, comments inbox for creators.
- Seeded/demo content pack for empty environments.

---

## 11. Files involved (verified)

- Layout/IA: `src/components/layout/MainLayout.jsx`, `src/components/design-system/AppSidebar.jsx`, `AppHeader.jsx`
- Creator: `src/views/CreatorDashboard.jsx`, `src/components/video/SubmissionWizard.jsx`, `src/views/EditVideo.jsx`, `src/views/CardStudio.jsx`
- Competitions: `src/views/Competitions.jsx`, `src/views/CompetitionDetail.jsx`, `src/components/community/shared.jsx`
- APIs: `server/routes/videos.js`, `server/routes/entities.js`, `server/routes/competitions.js`, `server/middleware/rbac/permissions.js`, `src/lib/api.js`
- Schema: `server/prisma/schema.prisma` (`Video`, `Competition`, `CompetitionEntry`)
- Guards: `src/components/RoleGuard.jsx`, `src/app/(main)/{upload,creator,admin,moderation}/page.jsx`

---

## 12. Unresolved investigations

1. Authenticated E2E on `ayeh-prod-local` (upload → pending_review → publish → watch → competition submit → judge).
2. Aparat authenticated creator dashboard.
3. Whether any alternate client path already calls `/api/videos` (none found in `src/`).
4. Live WebRTC SFU quality (known partial per AGENTS.md).
5. Whether tracked `.env.production` JWT was ever used outside local/dev (rotation decision is owner’s).
