# Creator Studio & Content-Production Competitions — Product Spec

**Date:** 2026-11-10  
**Status:** Specification from audit evidence (not implemented in this task)  
**Identity:** Ayeh Media Plus is a **Quranic content creation and publishing platform**. Aparat informs UX familiarity; it is not the product identity.  
**Companion docs:** [APARAT_PRODUCT_BENCHMARK.md](./APARAT_PRODUCT_BENCHMARK.md) · [PRODUCT_EXPERIENCE_AUDIT.md](./PRODUCT_EXPERIENCE_AUDIT.md) · [PRODUCT_UX_ROADMAP.md](./PRODUCT_UX_ROADMAP.md)

---

## 1. Product principle

Every registered user is a **potential creator**. The default post-register experience must invite publishing and competition participation without granting **admin** or **moderation** powers.

Competitions are primarily **content-production competitions**:

1. Discover a competition  
2. Read topic, rules, requirements  
3. Create original content (video / short / audio / educational / reflective)  
4. Submit the content  
5. Track submission & evaluation status  
6. Receive feedback & results  
7. Earn recognition, achievements, or prizes  

Physical gatherings (`venue*` fields) are **optional formats**, never the primary mental model.

---

## 2. Personas & permissions

| Persona | Who | Can do | Must never do |
|---------|-----|--------|---------------|
| Viewer → Creator | role `user` (default on register) | Browse; follow; like/comment; upload own content; manage own library; enter competitions; track own submissions | Access `/admin`, `/moderation`, judge, ban, assign roles |
| Elevated Creator | role `creator` (optional badge/trust) | Same as user + any future trusted-publisher privileges | Staff tools |
| Moderator | `moderator` | Review queues, approve/reject content & entries | Change system roles (unless also admin) |
| Admin | `admin` | Roles, system config, competition organization tools | — |
| Guest | anonymous | Discover public content; hit auth walls on publish | Mutate content |

**RBAC today (verified):** `server/middleware/rbac/permissions.js` — `video:submit` already includes `user`; `competition:submit:entry` / `vote` exist; `competition:judge` is staff. The product gap is **UI gating + wrong API wiring**, not missing submit permission for users.

---

## 3. Creator Studio (required experience)

### 3.1 Entry points
- Persistent **Upload** in header (auth-gated).
- Sidebar / mobile: **استودیوی سازنده** visible to **all authenticated users**.
- Public channel CTA: “مدیریت کانال” → Studio (owner only).
- Competition detail CTA: “ساخت و ارسال اثر” → create flow with competition pre-linked.

### 3.2 Studio information architecture

| Studio tab | Purpose | Notes |
|------------|---------|-------|
| Overview | Counts, recent activity, pending items, next actions | Wire real `/api/videos/:id/analytics` aggregates |
| Library | All own videos/audio/shorts with status chips | Uses `/api/videos` ownership (`reciter_id`) |
| Upload / Publish | Guided publish wizard | Title, media, thumbnail, category, verse link, visibility |
| Submissions | Competition entries + evaluation states | Per-entry timeline |
| Channel | Public channel preview + bio/avatar/links | No moderation tools |
| Comments (P2) | Reply to comments on own content | Inbox, not admin reports |
| Achievements (P2) | Badges, competition results, recognition | Ties to gamification APIs |

**Naming:** Reserve `/studio` or `/creator` for this Creator Studio. Move verse **Card Studio** to a clearly named route (e.g. `/card-studio` only, or `/tools/verse-cards`) to end the collision.

### 3.3 Content statuses (proposed product language)

Align UI labels to schema (extend schema only in a later implementation task):

| Status | Meaning | Creator sees |
|--------|---------|--------------|
| `draft` *(missing today — add later)* | Not submitted | Edit / delete / submit |
| `pending_review` | Awaiting staff | Tracking + cancel request (policy TBD) |
| `verified` | Staff verified | Ready / scheduled |
| `published` | Public | Analytics + share |
| `rejected` | Needs changes | Reason + resubmit |
| `archived` | Hidden by owner/staff | Restore |

### 3.4 Channel vs profile
- **Public channel** (`/profile/[id]` or future `/c/[slug]`): content grid, popular, about, follow.
- **Account profile**: security, notifications, reading stats — not the publish desk.
- Today’s self `/profile` reading UI must not be mistaken for Creator Studio.

### 3.5 Acceptance criteria — Creator Studio
- [ ] Any authenticated `user` can open Studio and upload.
- [ ] Create/update/delete of own videos succeeds via the **supported** API (`/api/videos`), not admin-only entity writes.
- [ ] Studio never shows moderation queue, role assignment, or report resolution.
- [ ] Public channel updates within refresh/ISR expectations after publish approval.
- [ ] Empty Studio shows a Quranic-toned first-publish CTA (not a dead end).

---

## 4. Competition product specification

### 4.1 Competition object (creator-facing)

Must communicate:
- Title / theme / Quranic topic  
- Allowed content types (video, short, audio, text+media, educational)  
- Rules & requirements (length, verse scope, originality, deadline)  
- Evaluation method (jury scores, community vote, hybrid)  
- Prizes / recognition  
- Optional: physical event metadata (clearly labeled optional)

Schema already has: `type`, `rules`, dates, `registration_deadline`, `judging_criteria`, `prizes`, venue fields, `status`.

### 4.2 Canonical statuses (fix UI ↔ schema)

**Competition.status (schema):** `draft | active | completed | cancelled`  
Remove or remap UI-only `voting` / `upcoming` filters:
- Upcoming → `draft` or `active` with `start_date` in future (product decision)
- Voting → phase flag or `judging_criteria` mode, **not** a fake status string

**Entry.status (schema):** `pending_review | verified | published | rejected | disqualified`

### 4.3 End-to-end competition journey

```
Discover (/competitions)
  → Detail (rules, requirements, examples, deadline)
    → Create content (Studio upload OR inline wizard supporting video+audio)
      → Submit (links video_id / media to CompetitionEntry)
        → Track (Studio → Submissions: pending → …)
          → Feedback (scores, rejection_reason, judge notes)
            → Results (rank, badges, prizes)
```

### 4.4 Submission requirements
- Support **video and audio** as first-class (UI today defaults audio/mic).
- Prefer linking a **published or pending Video** asset to an entry (content-production), not only a one-off blob.
- Capture title, description, verse_key when relevant, originality attestation.
- Enforce `registration_deadline` / `end_date` in API (UI must surface errors).

### 4.5 Evaluation & feedback
- Staff use judge API (`POST /api/competitions/entries/:id/judge`) via a **moderation/judge UI** (missing today).
- Creators see scores + written feedback in Studio Submissions — never edit their own scores (`COMPETITION_ENTRY_JUDGE_FIELDS` already protected server-side).
- Community voting remains optional engagement (`Vote` model + existing vote API).

### 4.6 Recognition
- Map results to notifications (`competition_result`), achievements/badges, optional prize fulfillment workflow (admin).
- Stop relying on non-schema `is_winner`; use `rank_position` + published results endpoint.

### 4.7 Acceptance criteria — competitions
- [ ] Guest can discover competitions and read rules.
- [ ] Authenticated user can submit allowed content types before deadline.
- [ ] User can see each entry’s status and feedback in Creator Studio.
- [ ] Judge/moderator can score without using raw entity admin hacks.
- [ ] Filters/labels match schema statuses (no dead `voting`/`upcoming` filters).
- [ ] Physical venue is optional metadata, not required to understand the competition.

---

## 5. Viewer → creator conversion

| Moment | Prompt |
|--------|--------|
| Empty home | “اولین ویدیوی قرآنی‌ات را منتشر کن” → Studio |
| After watch | “اثر مشابه بساز” / “در مسابقه مرتبط شرکت کن” |
| Competition empty entries | “اولین اثر را ارسال کن” |
| Register success | Mini onboarding: channel name → first upload OR join featured competition |
| Achievements | Unlock badges for first publish / first submission |

No separate “apply to become creator” gate for basic publishing.

---

## 6. Current → target gap (evidence-based)

| Spec need | Current verified state |
|-----------|------------------------|
| Universal Creator Studio | `/creator` RoleGuard = `creator+` only |
| Working publish API from UI | UI uses `entities.Video`; ownership hole on `reciter_id` |
| Studio ≠ Card Studio | `/studio` is CardStudio |
| Content-production competitions | Detail submit is tilawah/audio-centric |
| Submission tracking desk | No dedicated list in Studio |
| Judge feedback UX | API only; no detail UI |
| Status vocabulary | UI/schema mismatch |
| Channel manager | Weak; self profile is reading-oriented |

---

## 7. Non-goals (this spec)

- Implementing monetization/ads like Aparat income.
- Copying Aparat visual brand.
- Giving creators moderation powers.
- Replacing Quran reading (mushaf/khatm) — those remain companion modules under the publishing platform.

---

## 8. Dependent systems

- Auth roles & `RoleGuard`  
- `server/routes/videos.js` + client API wrapper  
- `server/routes/competitions.js` + entry/judge flows  
- `entities.js` ownership policy (or stop using entities for Video writes)  
- Upload/transcode (`/api/integrations/upload`)  
- Notifications + gamification  
- Moderation queue (staff) separate from Creator Studio  
