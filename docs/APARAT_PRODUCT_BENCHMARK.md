# Aparat Product Benchmark (UX patterns for Ayeh Media Plus)

**Date:** 2026-11-10  
**Scope:** Evidence-based UX benchmark only. Aparat is a **pattern reference**, not a brand/UI to copy.  
**Method:** Playwright Chromium against public Aparat pages + public docs (LinkedIn redesign write-up, Aparat income page). WebFetch of `support.aparat.com` returned HTTP 500 during this audit.

**Screenshots:** `screenshots/product-audit/aparat/`  
**Companion docs:** [PRODUCT_EXPERIENCE_AUDIT.md](./PRODUCT_EXPERIENCE_AUDIT.md) · [CREATOR_AND_COMPETITION_PRODUCT_SPEC.md](./CREATOR_AND_COMPETITION_PRODUCT_SPEC.md) · [PRODUCT_UX_ROADMAP.md](./PRODUCT_UX_ROADMAP.md)

---

## 1. Evidence sources

| Source | Status | Notes |
|--------|--------|-------|
| Playwright `https://www.aparat.com/` (1440×900) | Verified 200 | RTL homepage with Shorts row, category chips, sidebar |
| Playwright mobile home (390×844) | Verified 200 | Bottom-oriented discovery; Shorts / Live / Collections prominence |
| Playwright search `قرآن` | Verified 200 | Results with sort/quality filters; duration + view metadata |
| Playwright watch `/v/{id}` | Verified 200 | Player + channel follow + like/comment/save/share chrome |
| Playwright `/upload` | Verified login wall | Redirects to login/register (“ورود یا ثبت‌نام”) |
| Playwright `/login` | Verified 200 | Minimal phone/account continue form |
| Playwright `/income/` | Verified 200 | Creator monetization thresholds + reporting pitch |
| LinkedIn redesign article (Mostafa Zargar, Jan 2025) | Verified via WebFetch | Documents IA: personalized tabs, quick access, channel redesign |
| `support.aparat.com` | **Inaccessible** (HTTP 500) | Creator-help topics known only from search snippets; not treated as verified page content |

**Limitation:** Creator dashboard, analytics, channel settings, and authenticated upload wizard were **not** inspected behind login. Do not invent those screens. Infer only from public marketing/docs + login walls.

---

## 2. Verified IA and discovery patterns

### Homepage
- **RTL shell:** sidebar on the right; header search centered; auth/upload on the left (LTR-mirrored).
- **Primary nav (sidebar):** Home, Live (with live-count badge), Browse channels; login prompt card for personalization; dark-mode toggle; satellite products (Game, Music, Filimo, Kids, Sport).
- **Category chips:** “برای شما”, Live, topical verticals (pets, comedy, kids, news, lifestyle, gaming, cooking, film, music…).
- **Above-the-fold content density:** personalization banner → **Shorts rail** (vertical thumbs + view badges + “play all”) → featured/horizontal rows.
- **Guest personalization CTA:** explicit “log in for recommendations / followed channels”.

### Search
- Dedicated results page with **sort** (upload date) and **quality** filters.
- Result cards expose duration, title, channel-ish attribution, view/age signals.
- Quran search returns religious content mixed with ads — reminder that Ayeh must keep **Quranic curation**, not open-web noise.

### Watch page
- Large player with tap-to-unmute / sound affordance.
- Channel identity + **follow** CTA with subscriber count.
- Engagement cluster: like count, comment count, **save**, **share**.
- Related/seasonal rails and cross-product promos below/ beside player.
- Hashtags and metadata (views, relative time).

### Mobile (390)
- App install promo, Shorts / Upload / Live / Collections entry points.
- Category chip row remains primary discovery control.
- Content remains dense; thumbnails stay the main visual language.

### Upload / creator entry
- Upload icon is always visible; **upload requires auth** (login wall observed).
- Every registered user is expected to become a channel owner (Aparat mental model); monetization is a later gated program, not the upload gate.

### Creator incentives (public `/income/`)
Verified claims only:
- Revenue share from successful ad views (≥4s).
- Eligibility thresholds: **≥200 followers** and **≥3,000 watch hours in last 3 months**.
- Dedicated income reporting panel after enrollment.
- Settlement rules described publicly (threshold + banking).
- Original production emphasized over re-uploads/edits-only.

---

## 3. Reusable UX patterns for Ayeh (do not copy branding)

1. **Video-first IA:** Home / Explore / Live / Channels / Library, with search always global.
2. **Dense thumbnail grids + Shorts rail** for casual discovery, with clear view/duration badges.
3. **Channel as the creator identity:** profile = channel showcase (videos, popular, about), distinct from account settings.
4. **Upload always one click away**, but auth-gated; post-login goes straight into publish flow.
5. **Watch chrome:** Like / Comment / Save / Share / Follow in one predictable cluster.
6. **Personalized “برای شما”** only after signals exist; guest gets an honest login CTA (Aparat does this).
7. **Creator growth ladder:** publish → audience → eligibility → analytics/income reports (Ayeh can map this to recognition/achievements/prizes without ads).
8. **Responsive swap:** desktop right sidebar → mobile bottom/drawer navigation without losing search.
9. **RTL craft:** Persian type, mirrored chrome, chips that scroll naturally in RTL.
10. **Satellite features stay secondary** so the primary job (watch/publish video) stays obvious.

---

## 4. Patterns Ayeh should **not** copy

- Aparat pink/purple brand, logo, or satellite consumer brands (Filimo, Aparat Game, etc.).
- Open entertainment taxonomy as the primary IA (pets, cars, gaming) — Ayeh taxonomy must stay Quranic (tilawah, tafsir, reflection, education, competition content).
- Ad-monetization as the core creator promise — Ayeh’s primary loop is **faithful content creation + competitions + recognition**.
- Literal layout cloning (identical chip sets, identical Shorts chrome, identical income landing).

---

## 5. Mapping to Ayeh product pillars

| Aparat pattern (verified) | Ayeh intended mapping |
|---------------------------|------------------------|
| Home discovery + Shorts | Quranic video/audio/shorts discovery with curated categories |
| Channel pages | Creator channels for every registered user |
| Upload (+ auth wall) | Creator Studio publish flow for all users (no admin rights) |
| Watch engagement cluster | Like/comment/save/share/follow on Quranic media |
| Income eligibility ladder | Competition results, achievements, optional prizes — not admin tools |
| Live + count badge | Optional live sessions; not the primary competition model |
| Search filters | Search across videos, creators, competitions, collections |

---

## 6. Unresolved Aparat investigations

- Authenticated Creator Dashboard / analytics / playlist manager / channel settings UI.
- Exact upload wizard steps (title, thumbnail, category, publish schedule).
- Subscription/follow feed ranking quality.
- Support-center upload/channel tutorials (`support.aparat.com` down during audit).

These must be re-checked with an authenticated Aparat session before any pixel-level redesign claims.
