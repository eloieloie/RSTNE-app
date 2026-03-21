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
  api/          # Fetch clients (books, chapters, verses, notes, links-tags, crossReferences)
  components/   # VersePicker.vue, VerseSearch.vue, Settings.vue
  views/        # Page components
    BooksView.vue          # Book library (categorised grid)
    ChaptersView.vue       # Main reading pane (continuous scroll, cross-refs, notes)
    BroadcastView.vue      # Presentation/broadcast mode
    admin/
      AdminDashboard.vue
      ManageBooks.vue
      ManageChapters.vue
      ChapterEditor.vue    # Quill rich-text editor
      FindReplace.vue
      CompareBook.vue
  router/       # Vue Router config
  utils/
    collectionReferences.ts   # All TypeScript interfaces + table name constants
    versePickerData.ts        # Static book/chapter/verse data for the picker
    db.ts
  App.vue
  main.ts
  style.css
server/
  index.mjs     # Express REST API
functions/      # Firebase Cloud Functions wrapper
mjs-scripts/    # DB migration and test scripts
```

## Backend API

Local dev: `http://localhost:3000`
Production: `https://us-central1-rstne-app-2025.cloudfunctions.net/api/api`

Key endpoints:
- `GET /api/books` — all books (1-hour cache in the Express server)
- `GET /api/books/:id/chapters` — chapters for a book
- `GET /api/chapters/:id/verses` — verses with links and notes
- `GET /api/verses/search?q=` — full-text search
- `GET /api/stats` — book and chapter counts
- `GET /api/app-version` — returns `{ min_version, max_version }` from `app_version_tbl` (id=1); used by the mobile app for forced-update checks

Vite proxies `/api/*` to `localhost:3000` in dev mode (see `vite.config.ts`).

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
- `app_version_tbl` — single row (id=1) with `min_version` and `max_version` fields (semver strings); used by the mobile app for forced-update enforcement

All type definitions and table names are in `src/utils/collectionReferences.ts`.

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

## Conventions

- All Vue files use `<script setup lang="ts">` with Composition API
- API modules in `src/api/` use plain `fetch` — no Axios
- Books are cached 1 hour in `sessionStorage` (key: `rstne_books_cache`)
- The path alias `@` maps to `./src`
- Admin routes live under `/admin/*`; no authentication is currently enforced
