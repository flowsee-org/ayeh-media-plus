# Route Status Checklist (2026-11-10)

Evidence-based audit. SKIP all COMPLETE routes. Work only PARTIAL / BROKEN / MISSING.

| Route | Status | Notes |
|-------|--------|-------|
| `/` | COMPLETE | Home + Video/Scholar/Collection APIs |
| `/achievements` | COMPLETE | Gamification API |
| `/admin` | PARTIAL | Real CRUD; feature flags localStorage-only |
| `/assistant` | PARTIAL | LLM works; no conversation persistence |
| `/bookmarks` | PARTIAL | Verse/post localStorage; Prisma Bookmark unused |
| `/card-studio` | COMPLETE | SVG/PNG + Story/Post publish |
| `/collections` | COMPLETE | Public Collection list |
| `/collections/[id]` | PARTIAL | Loads; Verse enrichment missing; save local |
| `/collections/[id]/study` | PARTIAL | Study UI; tafsir tabs empty without Verse |
| `/community` | COMPLETE | Post CRUD |
| `/community/[id]` | COMPLETE | Comments |
| `/competitions` | COMPLETE | List |
| `/competitions/[id]` | BROKEN | Votes patch nonexistent `voted_by` |
| `/creator` | PARTIAL | Dead `/video` link; analytics tab inert |
| `/edit-video/[id]` | COMPLETE | Owner metadata edit |
| `/explore` | COMPLETE | Catalog browse |
| `/forgot-password` | PARTIAL | Token minted; no email in prod |
| `/guide` | PARTIAL | LLM + ayah; no history |
| `/khatm` | COMPLETE | Sessions + parts |
| `/khatm/[id]` | COMPLETE | Claim/complete + socket |
| `/live` | PARTIAL | WebRTC; follower gate broken via Follow fields |
| `/live/[id]` | BROKEN | Follow uses `scholar_id` vs `followed_id` |
| `/login` | COMPLETE | Auth |
| `/moderation` | COMPLETE | Queue + actions |
| `/profile` | COMPLETE | Own profile |
| `/profile/[id]` | PARTIAL | Follow field mismatches |
| `/quests` | PARTIAL | Alias of achievements |
| `/quran` | COMPLETE | Reader + audio |
| `/register` | COMPLETE | Register + OTP |
| `/reset-password` | COMPLETE | Reset with JWT |
| `/scholars` | PARTIAL | Follow CTA wrong payload |
| `/scholars/[id]` | PARTIAL | ID mix + broken Follow |
| `/search` | PARTIAL | Client-side; Gathering 404 swallowed |
| `/studio` | COMPLETE | Alias of card-studio |
| `/talks` | COMPLETE | Talk/lecture filter |
| `/topics` | BROKEN | Static topics; detail empty (no Verse rows) |
| `/upload` | COMPLETE | SubmissionWizard |
| `/verse/[surah]/[ayah]` | PARTIAL | Core works; curated reflections missing |
| `/watch-history` | PARTIAL | localStorage only |
| `/watch/[id]` | COMPLETE | Player + like/comment/bookmark |

## Priority order
1. Follow `followed_id` vs `scholar_id` (live, scholars, profile)
2. Competition vote API wiring
3. Topics ayah delivery via quranApi
4. Creator `/video`→`/watch` + analytics tab
5. Bookmarks / watch-history server sync (as capacity allows)
