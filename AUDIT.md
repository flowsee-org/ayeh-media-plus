# Ayah Media Plus — Route & Feature Audit

## Route Inventory (33 routes)

| # | Route | Page/View | Status | Issues |
|---|-------|-----------|--------|--------|
| 1 | / | Home | ✅ Working | Needs Aparat-style rebuild |
| 2 | /login | Login | ✅ Working | Needs Aparat-style UI |
| 3 | /register | Register | ✅ Working | Needs Aparat-style UI |
| 4 | /forgot-password | ForgotPassword | ? | Needs testing |
| 5 | /reset-password | ResetPassword | ? | Needs testing |
| 6 | /profile | Profile | ✅ Working | Needs Aparat-style channel UI |
| 7 | /profile/[id] | ProfilePage | ✅ Working | Needs channel-style UI |
| 8 | /watch/[id] | VideoWatchPage | ✅ Working | Has HLS + quality selector |
| 9 | /watch-history | WatchHistory | ✅ Working | LocalStorage-based |
| 10 | /upload | SubmissionWizard | ✅ Working | Has transcoding |
| 11 | /edit-video/[id] | EditVideo | ✅ Working | Newly created |
| 12 | /creator | CreatorDashboard | ✅ Working | Needs Aparat-style |
| 13 | /explore | Explore | ✅ Working | Needs Aparat-style discovery |
| 14 | /search | SearchPage | ✅ Working | Needs Aparat-style search |
| 15 | /quran | Quran | ✅ Working | Quranic content |
| 16 | /verse/[surah]/[ayah] | VerseDetail | ✅ Working | Verse page |
| 17 | /khatm | Khatm | ✅ Working | Quran completion |
| 18 | /khatm/[id] | KhatmDetail | ✅ Working | |
| 19 | /scholars | Scholars | ✅ Working | Scholars list |
| 20 | /scholars/[id] | ScholarProfile | ✅ Working | Scholar detail |
| 21 | /competitions | Competitions | ✅ Working | Competition list |
| 22 | /competitions/[id] | CompetitionDetail | ✅ Working | Competition detail |
| 23 | /collections | Collections | ✅ Working | Collections list |
| 24 | /collections/[id] | CollectionDetail | ✅ Working | Collection detail |
| 25 | /collections/[id]/study | CollectionStudy | ✅ Working | Study mode |
| 26 | /community | Community | ✅ Working | Community feed |
| 27 | /community/[id] | PostDetail | ✅ Working | Post detail |
| 28 | /talks | Talks | ✅ Working | Talks/tafsir |
| 29 | /topics | Topics | ✅ Working | Topics |
| 30 | /admin | Admin | ✅ Working | Admin panel |
| 31 | /adminPanel | AdminPanel | ✅ Working | Content moderation |
| 32 | /moderation | ModerationDashboard | ✅ Working | Moderation queue |
| 33 | /assistant | Assistant | ✅ Working | AI assistant |
| 34 | /bookmarks | Bookmarks | ✅ Working | Saved videos |
| 35 | /studio | CardStudio | ✅ Working | Card creation |
| 36 | /achievements | Achievements | ✅ Working | Gamification |
| 37 | /quests | (not in views?) | ? | Check |
| 38 | /live | LiveView | ✅ Working | Live streaming |
| 39 | /live/[id] | LiveView | ✅ Working | Live detail |
| 40 | /guide | Guide | ? | Check |
| 41 | /VerseGuide | VerseGuide | ? | Check |

## API Endpoint Inventory

### Auth (/api/auth)
- GET /captcha ✅
- POST /send-otp-phone ✅
- POST /verify-otp-phone ✅
- POST /complete-profile ✅
- POST /register ✅
- POST /verify-otp ✅
- POST /resend-otp ✅
- POST /login ✅
- GET /me ✅
- PATCH /me ✅
- PUT /me ✅
- POST /reset-password-request ✅
- POST /reset-password ✅
- DELETE /me ✅

### Videos (/api/videos)
- GET / (list) ✅
- GET /:id (single) ✅
- POST / (create) ✅
- PUT /:id (update) ✅
- DELETE /:id ✅
- POST /:id/view ✅
- GET /:id/analytics ✅

### Upload (/api/integrations/upload)
- POST /upload ✅ (with transcoding)

### Competitions (/api/competitions)
- GET / (list) ✅
- GET /:id ✅
- POST / (create) ✅
- PUT /:id ✅
- DELETE /:id ✅
- GET /:id/entries ✅
- POST /:id/entries ✅
- POST /:id/entries/:entryId/vote ✅
- POST /entries/:entryId/judge ✅

### Moderation (/api/moderation)
- GET /queue ✅
- POST /:targetType/:targetId/action ✅
- GET /reports ✅
- POST /reports/:id/review ✅
- GET /audit-log ✅

### Gamification (/api/gamification)
- GET /status ✅
- GET /daily-content ✅
- POST /track-activity ✅
- POST /complete-quest ✅
- GET /leaderboard ✅

### Entities (/api/entities/:entity)
- GET /:entity ✅
- GET /:entity/:id ✅
- POST /:entity ✅
- PUT /:entity/:id ✅
- DELETE /:entity/:id ✅
- POST /:entity/filter ✅
- POST /:entity/bulk ✅
- POST /:entity/delete-many ✅

## Data Counts
- Videos: 3 (all live/competition/gathering)
- Competitions: 1
- Scholars: 5
- Collections: 2
- Topics: 4

## Critical Gaps
1. NO video transcoded HLS content (all videos use external media_url)
2. NO Shorts section content
3. NO Live content (all marked is_live but use m3u8 URLs)
4. NO channel subscriptions data (Follow model exists but no data)
5. NO user-generated content (no posts, likes, comments)
6. NO video import system from Aparat
7. NO CDN integration
8. NO adaptive bitrate streaming for uploaded videos
