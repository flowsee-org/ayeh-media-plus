# Ayah Media Plus — Launch Audit (2026-11-10)

Evidence-based status against the Aparat-level Quranic video platform goal.
Prior MISSION_REPORT / RELEASE_GATE claims of “complete” are **not** treated as proof.

## Runtime

| Service | Status | Notes |
|---------|--------|-------|
| Express `:5000` | ✅ Restored | Was down / hung during audit |
| Next `:5173` | ✅ Restored | Was accepting TCP but not responding |
| Auth login | ✅ | `admin@ayeh.media` works |
| Comment / Like / Follow APIs | ✅ Smoke-tested | Persist correctly |

## Content integrity (fixed this turn)

| Issue | Before | After |
|-------|--------|-------|
| Duplicate Aparat `6Zv4j` | 3 rows | 1 (engagement merged) |
| Fabricated views (125k+) | Seed + live DB | Reset to real / small measured |
| Misattributed “tafsir/lecture” titles on plain audio | Several seed rows | Titles match actual sources |
| Empty thumbnails | All 15 | Local SVG thumbs under `/uploads/thumbs` |
| Fake live flags | Present historically | `is_live=0` for catalog VOD |
| Uploads path split-brain | `uploads/` vs `server/uploads/` | Express now serves repo-root `uploads/` (matches multer/transcode) |
| HLS/thumb URL prefix | `/hls`, `/thumbs` | `/uploads/hls`, `/uploads/thumbs` |

Current catalog: **13** items (9 audio + 4 Aparat video embeds). No duplicate `media_url`.

## Route smoke (HTTP)

All sampled routes return **200**: `/`, `/explore`, `/search`, `/watch/:id`, `/upload`, `/creator`, `/quran`, `/scholars`, `/competitions`, `/collections`, `/community`, `/talks`, `/khatm`, `/live`, `/admin`, `/moderation`, auth pages, etc.

## Still incomplete / unverified for launch

### Core video platform
1. **Catalog is audio-heavy** — only 4 Aparat embeds; need more authorized Quranic *video* (not audio-as-video).
2. **Aparat hash authenticity** — embeds load a SPA shell; metadata/oEmbed unreliable; need verified Quranic video IDs + thumbnails from Aparat where possible.
3. **Shorts** — UI filters short durations; content exists for a few short ayah clips; no dedicated Shorts product surface beyond Home strip.
4. **Live streaming** — route exists; `LiveSession` count was 0; no verified end-to-end broadcast.
5. **Playlists** — Collections exist; true user playlists / watch-later UX needs verification.
6. **Recommendations** — client-side engine exists; quality vs Aparat not validated.
7. **Creator Studio analytics** — mock daily series removed; need real measured analytics.
8. **CDN** — local `/uploads` only; no production CDN config.
9. **Upload → transcode → playback E2E** — path bugs fixed; full ffmpeg journey not re-verified this turn.

### Quranic ecosystem
Modules exist as routes (Quran, Khatm, Scholars, Competitions, Collections, Community, Talks). Depth/quality vs product vision still needs per-module functional verification (not just HTTP 200).

### Product / UX
- Large uncommitted WIP UI diff (Home, Watch, Explore, header/sidebar, etc.).
- Goal requires **stable Light Mode**; earlier reports pushed dark-default — verify ThemeToggle / defaults.
- Persian RTL + branding must stay consistent across unfinished WIP pages.

## Priority order (next)

1. Verify Light Mode default + watch playback (audio + Aparat) end-to-end in browser.
2. Expand authorized real video catalog; keep audio clearly typed as audio.
3. E2E: register → upload → publish → watch → like/comment/follow → bookmark/history.
4. Live + Shorts minimum viable product paths.
5. Quranic module functional pass.
6. Production deploy prep (Postgres, env, CDN, secrets).
