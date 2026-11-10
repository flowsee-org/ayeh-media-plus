# UI/UX Visual Audit Checklist — Ayah Media Plus

Created: 2026-11-10  
Updated: 2026-11-10 (final — Shorts SVG thumb text cleared)  
Scope: visual consistency only (no backend/feature work)  
Baseline: `/` (`Home.jsx`) — `page-shell` / `max-w-[1400px]`, Rokh titles, Doran body, DS cards  
Evidence: `/tmp/ayeh-ui-audit/` (baseline + `postfix__*` + `postfix2__*` + `final__*__home_shorts.png`)

## Typography roles (verified from assets + live computed styles)

| Family | Weights available | Role | Live check |
|--------|-------------------|------|------------|
| **Doran** | 300–800 (woff2) | Primary UI, nav, forms, buttons, body | `body` → Doran ✓ |
| **Rokh** | 100–950 (woff2) | Display headings / page titles | `h1` → Rokh ✓ |
| **Tajrid** | 200–700 (woff2) | Quranic Arabic via `.font-arabic` / reading prefs default | `/quran` → Tajrid ✓ |
| **Falsafeh** | 300, 700 (woff only) | Editorial accents via `.font-editorial` / `.translation-text` | `/login`, `/guide`, `/bookmarks` → Falsafeh ✓ |

---

## Previously completed (skipped on final pass — do not redo)

- Route inventory + visual audit checklist written
- 81+ baseline screenshot states captured (`desktop__*`, `tablet__*`, `mobile__*`)
- Doran / Rokh / Falsafeh / Tajrid asset loading verified
- Duplicate homepage logo fixed; MainLayout chrome opt-outs; light mode primary tokens
- Auth pages unified; Bookmarks / WatchHistory / Creator / Moderation / Guide done
- Soft shells/titles on Profile, Quran, Verse*, Collections, Scholars, Topics, Competitions, Admin, EditVideo, CollectionStudy
- Resume pass 2: Search, Community, Studio, Upload, Achievements, Khatm, catalog cards
- Homepage layout/data/sections left unchanged; Home.jsx Shorts chrome from prior pass preserved

---

## Newly fixed (resume pass 2 + final Shorts thumbs)

### Target pages
1. **Search** — preserved prior shell/EmptyState work; Rokh section headings; idle/error/empty use DS EmptyState
2. **Community** — `page-shell-narrow`, editorial subtitle, primary chip/CTA tokens, DS EmptyState (`onAction`)
3. **Upload** — SubmissionWizard soft-aligned to `page-shell-narrow` + primary tokens (no emerald/saffron glow)
4. **Studio** — CardStudio `page-shell` + primary/secondary action tokens
5. **Achievements** — carpet/gilded hero replaced with soft DS-aligned card hero; primary tabs/progress
6. **Khatm** — carpet full-bleed removed; page-shell; session cards use primary progress/badges
7. **Scholars** — historical grid uses DS `ScholarCard`; EmptyState; soft header (no carpet)
8. **Collections** — DS `CollectionCard` with preserved save/share overlays; EmptyState
9. **Competitions** — EmptyState + primary filter chips
10. **VerseDetail** — local ScholarCard replaced with DS `ScholarCard`
11. **Shorts overlays** — titles stay outside thumbs; duration top-end only (prior chrome)
12. **Shorts SVG thumbs (final)** — removed baked-in `<text>` (title/subtitle/brand) from served `uploads/thumbs/*.svg` and mirror `server/uploads/thumbs/*.svg`; generators updated so regen stays visual-only

### EmptyState
- Optional `onAction` button support (Community create flow)

---

## Route checklist (after final pass)

| Route | Status | Notes |
|-------|--------|-------|
| `/` | DONE | Baseline preserved; Shorts chrome prior + SVG thumb text cleared |
| `/explore` | SKIP | Already aligned |
| `/talks` | SKIP | Already aligned |
| `/search` | DONE | Shell + EmptyState + Rokh section titles |
| `/watch/[id]` | PARTIAL | Chrome opt-out done; related rail still custom |
| `/profile` | PARTIAL | Shell/titles unified; still not full DS ProfilePage |
| `/profile/[id]` | PARTIAL | Soft pad earlier; not revisited this pass |
| `/upload` | DONE | Primary token wizard; RoleGuard login gate verified |
| `/creator` | DONE | Prior pass |
| `/edit-video/[id]` | PARTIAL | Shell pad stripped earlier |
| `/bookmarks` | DONE | Prior pass |
| `/watch-history` | DONE | Prior pass |
| `/achievements` / `/quests` | DONE | Soft hero + primary tabs |
| `/live` | REMAINING | Narrow utility panels (out of this target list) |
| `/live/[id]` | DONE | Header/sidebar opt-out |
| `/quran` | PARTIAL | Shell + Tajrid default |
| `/verse/...` | DONE* | DS ScholarCard unified (*shell already prior) |
| `/khatm*` | DONE | Soft hero + session cards |
| `/collections` | DONE | DS CollectionCard + EmptyState |
| `/collections/[id]/study` | DONE | Prior pass |
| `/scholars*` | DONE | DS ScholarCard grid |
| `/topics` | PARTIAL | Shell + Rokh prior |
| `/community*` | DONE | Narrow shell + EmptyState polish |
| `/competitions*` | DONE | EmptyState + primary filters; detail cards still community-local |
| `/admin` | PARTIAL | Shell + Rokh prior |
| `/moderation` | DONE | Prior pass |
| `/assistant` | REMAINING | Optional Falsafeh accents |
| `/guide` | DONE | Prior pass |
| `/studio` / `/card-studio` | DONE | Soft primary tokens |
| `/login` `/register` `/forgot-password` `/reset-password` | DONE | Prior pass |

---

## Font integration results

- Doran: global body/UI ✓
- Rokh: headings via tokens + `font-rokh*` / `font-heading` ✓
- Falsafeh: `.font-editorial`, `.translation-text`, auth/guide/community/khatm intros ✓
- Tajrid: CSS `--font-arabic`, `.font-tajrid*`, reading prefs default ✓

---

## Remaining visual issues (not in this target list / optional next)

- `/live` utility panels still narrow/ad-hoc
- `/assistant` Falsafeh accents optional
- Profile still structurally diverges from DS `ProfilePage`
- Watch related rail still custom
- Competition detail entry cards remain community-local (list page EmptyState done)
- Editorial muted text contrast on very light Falsafeh weights

---

## Screenshot / build results

| Check | Result |
|-------|--------|
| Baseline screenshots | Reused (`/tmp/ayeh-ui-audit/desktop__*`, `tablet__*`, `mobile__*`) |
| Prior postfix | `postfix__{desktop,tablet,mobile}__*.png` |
| Resume postfix2 | 30 files `postfix2__{desktop,tablet,mobile}__{home,search,community,upload,studio,achievements,khatm,scholars,collections,competitions}.png` + `postfix2__desktop__home_shorts.png` |
| Final Shorts | `final__{desktop,tablet,mobile}__home_shorts.png` (3/3 OK) |
| Shorts SVG probe | All 8 live Shorts thumbs `hasText=false`; UI titles under cards; duration badges only on thumbs |
| Route HTTP | All target routes `200` |
| RTL | `documentElement.dir=rtl` on all captured routes ✓ |
| Responsive | Desktop 1440 / tablet 768 / mobile 390 for target set ✓ |
| `pnpm build` | Success (Next.js 16.5 canary; existing tailwind CJS/ESM warning only) |

### Target page completion (final)

| Page | Result |
|------|--------|
| Search | Fixed and verified |
| Community | Fixed and verified |
| Studio | Fixed and verified |
| Upload | Fixed and verified (wizard tokens; unauth RoleGuard gate as designed) |
| Achievements | Fixed and verified |
| Khatm | Fixed and verified |
| Catalog cards (Scholars/Collections/VerseDetail) | Fixed and verified |
| Shorts overlays | Fixed and verified (UI chrome) |
| Shorts SVG thumb text | Fixed and verified — baked-in labels removed; no overlap with UI duration/titles |
| Homepage redesign | Already complete and skipped (untouched except prior Shorts chrome) |
| Completed prior routes | Already complete and skipped |

---

## Priority legend

- **SKIP** — already aligned; not revisited
- **DONE** — finished this resume pass (or prior interrupted edits verified)
- **PARTIAL** — shell/typography fixed; deeper card/empty work remains
- **REMAINING** — still open for a later visual pass
