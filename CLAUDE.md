# RSTNE Web App — Claude Context

## What this project is

**Restoration Scriptures True Name Edition (RSTNE)** — a web-based Bible reading and study platform supporting English, Hebrew, and Telugu. Contains 86 books: 36 First Covenant, 19 New Covenant, 20 Restored Apocryphal, plus additional works.

The companion mobile app lives at `/Users/eloielimelech/Developer/RSTNE-mobile-app`.

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Build:** Vite 7 (dev on port 5174)
- **Language:** TypeScript 5.9 (strict mode)
- **UI:** Bootstrap 5.3 + custom CSS
- **Rich text:** Quill 2.0 (chapter editor)
- **Routing:** Vue Router 4 (HTML5 history)
- **Backend:** Express.js (`server/index.mjs`, port 3000)
- **Database:** MySQL 2 (via Express API)
- **Deployment:** Firebase Hosting (frontend) + Firebase Cloud Functions (backend)

## Project Structure

```
src/
  api/          # Fetch clients — one file per resource
    books.ts
    chapters.ts
    verses.ts
    notes.ts
    linksAndTags.ts
    crossReferences.ts
    timelineEvents.ts     # Timeline CRUD — hits rstne.eloi.in/api directly (not Firebase)
  components/   # VersePicker.vue, VerseSearch.vue, Settings.vue
  views/        # Page components
    BooksView.vue          # Book library (categorised grid); has buttons to Timeline & WeeklyReading
    ChaptersView.vue       # Main reading pane (continuous scroll, cross-refs, notes)
    BroadcastView.vue      # Presentation/broadcast mode
    TimelineView.vue       # Biblical Timeline — vertical scroll, expandable event cards
    WeeklyReadingView.vue  # 52-Week / 12-Month DSS reading plan; shows current AM year + Jubilee ref
    FeastsView.vue         # Annual Feasts / Moadeem — 12 feast cards with verse refs that deep-link into ChaptersView
    admin/
      AdminDashboard.vue
      ManageBooks.vue
      ManageChapters.vue
      ChapterEditor.vue          # Quill rich-text editor
      FindReplace.vue
      CompareBook.vue
      ManageTimelineEvents.vue   # Add / edit / delete timeline events
  router/       # Vue Router config
  utils/
    collectionReferences.ts   # All TypeScript interfaces + table name constants
    versePickerData.ts        # Static book/chapter/verse data for the picker
    db.ts
  App.vue
  main.ts
  style.css
server/
  index.mjs     # Express REST API (local dev + Firebase Functions)
functions/      # Firebase Cloud Functions wrapper
mjs-scripts/
  seed-timeline-from-dss-json.mjs  # One-time import: parses DSS calendar JSON → timeline_events_tbl
RSTNE-apis/
  index.php                        # PHP router for production (GoDaddy IIS)
  endpoints/
    timeline-events.php            # Timeline CRUD endpoint (PHP, production)
```

## Backend API

There are **two separate backends**:

### Firebase / Express (Bible reading features)
Local dev: `http://localhost:3000`
Production: `https://us-central1-rstne-app-2025.cloudfunctions.net/api/api`

Vite proxies `/api/*` → `localhost:3000` in dev mode (see `vite.config.ts`).

Key endpoints:
- `GET /api/books` — all books (1-hour cache in the Express server)
- `GET /api/books/:id/chapters` — chapters for a book
- `GET /api/chapters/:id/verses` — verses with links and notes
- `GET /api/verses/search?q=` — full-text search
- `GET /api/stats` — book and chapter counts
- `GET /api/app-version` — returns `{ min_version, max_version }` from `app_version_tbl` (id=1)
- `GET /api/timeline-events` — all timeline events (Express + Firebase)
- `GET /api/timeline-events/:id` — single event
- `POST /api/timeline-events` — create event
- `PUT /api/timeline-events/:id` — update event
- `DELETE /api/timeline-events/:id` — delete event

### PHP API (GoDaddy IIS — timeline & future features)
Production base URL: `https://rstne.eloi.in/api`
Router: `RSTNE-apis/index.php`; endpoints under `RSTNE-apis/endpoints/`

**Important**: GoDaddy IIS does not support `PUT`/`DELETE` HTTP methods. The frontend
tunnels them using `POST` with the `X-HTTP-Method-Override` header set to `PUT` or `DELETE`.
The PHP router reads this header and dispatches accordingly.

Timeline endpoints (consumed by `src/api/timelineEvents.ts`):
- `GET  /api/timeline-events` — fetch all events, ordered by `am_year ASC`
- `GET  /api/timeline-events/:id` — single event
- `POST /api/timeline-events` — create; returns `{ id, message }`
- `POST /api/timeline-events/:id` + `X-HTTP-Method-Override: PUT` — update
- `POST /api/timeline-events/:id` + `X-HTTP-Method-Override: DELETE` — delete

`TimelineEventsEndpoint::ensureTable()` runs on every request: it creates
`timeline_events_tbl` if absent and seeds 18 key events when the table is empty.
All 230+ DSS calendar events were bulk-imported via `mjs-scripts/seed-timeline-from-dss-json.mjs`.

## Database Schema

Main tables (MySQL):
- `books_tbl` — 86 books, `category_id` 1/2/3
- `book_categories_tbl` — 3 categories
- `chapters_tbl` — chapters per book
- `verses_tbl` — verse content (English + Telugu)
- `notes_tbl` / `verse_notes_tbl` — user notes
- `verse_links_tbl` — cross-references between verses
- `tags_tbl` / `verse_tags_tbl` — topic tags
- `cross_references_tbl` — imported cross-reference data
- `app_version_tbl` — single row (id=1) with `min_version` and `max_version` fields (semver strings)
- `timeline_events_tbl` — 230+ biblical timeline events (see below)

### timeline_events_tbl columns

| Column | Type | Notes |
|--------|------|-------|
| `event_id` | INT PK AUTO_INCREMENT | |
| `title` | VARCHAR(255) | |
| `description` | TEXT NULL | |
| `am_year` | INT | Anno Mundi year (Creation = AM 1 = 3925 BC) |
| `bc_ad_year` | INT NULL | Gregorian year number |
| `is_bc` | TINYINT(1) | 1 = BC, 0 = AD |
| `month_name` | VARCHAR(50) NULL | Hebrew month (Nisan, Iyar, …) |
| `day_number` | INT NULL | Day of Hebrew month |
| `is_shemittah` | TINYINT(1) | 1 if the AM year is a Shemittah year |
| `is_jubilee` | TINYINT(1) | 1 if the AM year is a Jubilee year |
| `jubilee_ref` | VARCHAR(50) NULL | e.g. `Y1 S1 J10 O12` — year-in-shemittah, shemittah, jubilee, onah |
| `category` | VARCHAR(100) NULL | One of: creation, patriarchs, kings, covenant, exodus, temple, judgment, messiah, israel, prophecy |
| `bible_ref` | VARCHAR(255) NULL | e.g. `Genesis 7:11` |
| `sort_order` | INT NULL | Optional manual ordering within same am_year |
| `dt_added` | DATETIME | |
| `dt_modified` | DATETIME | |

**Jubilee ref formula** (AM year → `Y{y} S{s} J{j} O{o}`):
```
onah      = ceil(am / 500)
inOnah    = am - (onah - 1) * 500
jubilee   = ceil(inOnah / 50)
inJubilee = inOnah - (jubilee - 1) * 50
if inJubilee == 50 → "J{jubilee} O{onah}"   (Jubilee year itself)
else: shemittah = ceil(inJubilee / 7); y = inJubilee - (shemittah-1)*7
      → "Y{y} S{shemittah} J{jubilee} O{onah}"
```

All TypeScript interfaces (`TimelineEvent`, `TimelineEventInsert`, `TimelineEventUpdate`) and table name constants are in `src/utils/collectionReferences.ts`.

## Dev Workflow

```bash
npm run dev        # Vite only (frontend, port 5174)
npm run server     # Express server only (port 3000)
npm run dev:all    # Both concurrently
npm run build      # TypeScript check + Vite build → dist/
```

Env vars (`.env`): `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

## Deployment

```bash
firebase deploy --only hosting   # Deploy frontend
firebase deploy --only functions # Deploy backend
```

Firebase project: `rstne-app-2025`, hosting site: `eat-rstne-26`

## Book Categories

| ID | Name | Color theme |
|----|------|-------------|
| 1  | First Covenant (OT + extra) | Brown `#8B4513` |
| 2  | New Covenant (NT) | Blue `#1E40AF` |
| 3  | Restored Apocryphal | Purple `#6B21A8` |

## Routes

| Path | Name | Component |
|------|------|-----------|
| `/` | `books` | BooksView |
| `/timeline` | `timeline` | TimelineView |
| `/feasts` | `feasts` | FeastsView |
| `/weekly-reading` | `weekly-reading` | WeeklyReadingView |
| `/admin/timeline-events` | `admin-timeline-events` | ManageTimelineEvents |
| `/admin` | `admin` | AdminDashboard |
| … (books/chapters/etc.) | | |

## Timeline Feature

- **TimelineView** (`src/views/TimelineView.vue`): Vertical scrolling timeline. Events are grouped into 8 colour-coded eras (Creation → Modern). Each event renders as a three-column row: `[AM year | spine dot | card]`. Clicking a card expands it inline to show full details (BC/AD year, Hebrew date, Jubilee ref, Scripture). A sticky era section header shows as you scroll. Filters (category, jubilee-only, shemittah-only) and era navigation are in a modal opened from the header filter button.
- **ManageTimelineEvents** (`src/views/admin/ManageTimelineEvents.vue`): Two-panel admin — searchable list on left, add/edit form on right. All 12 fields are editable including Hebrew month, is_jubilee, is_shemittah, jubilee_ref.
- **API client** (`src/api/timelineEvents.ts`): Hits `https://rstne.eloi.in/api` directly (not the Firebase/Express API). PUT/DELETE are tunneled as `POST` with `X-HTTP-Method-Override` header.
- **Seed script** (`mjs-scripts/seed-timeline-from-dss-json.mjs`): Run once to bulk-import from `/Volumes/Expansion/Documents/RSTNE/dss_calendar_events.json`. Parses ~233 DSS calendar sub-events, enriches with jubilee_ref / category / bible_ref, skips duplicates.

## Annual Feasts Feature

- **FeastsView** (`src/views/FeastsView.vue`): 12 feast cards grouped into four seasons (Spring, Summer, Fall, Other). Each card shows Hebrew name, date on the DSS calendar, a description, and clickable verse-reference pills. Clicking a pill navigates to `book-chapter-verse` route with bookName slug, chapterNumber, and optional verseNumber — which ChaptersView uses to scroll to the exact verse. Unlinked books (1st/2nd Maccabees — not yet in DB) display as greyed non-clickable pills. Accessible from BooksView header "Annual Feasts" button. No API calls — all data is static in the component.

## Weekly Reading Feature

- **WeeklyReadingView** (`src/views/WeeklyReadingView.vue`): DSS 364-day solar calendar reading plan. Shows current DSS/AM year, Jubilee ref (`getJubileeRef(currentDSSYear)`), DSS today badge (month/day/week), 52-week grid, and by-month view. `DSS_YEAR_OFFSET = 3925` so DSS year equals AM year.

## Conventions

- All Vue files use `<script setup lang="ts">` with Composition API
- API modules in `src/api/` use plain `fetch` — no Axios
- Books are cached 1 hour in `sessionStorage` (key: `rstne_books_cache`)
- The path alias `@` maps to `./src`
- Admin routes live under `/admin/*`; no authentication is currently enforced
- **Two API base URLs**: Firebase/Express for Bible reading; `https://rstne.eloi.in/api` (PHP/GoDaddy) for timeline events
- GoDaddy IIS limitation: PUT/DELETE not supported — always use `POST` + `X-HTTP-Method-Override` header for mutating timeline requests
