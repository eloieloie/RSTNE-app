# CLAUDE.md — RSTNE App

## Project Overview

**RSTNE** (Restored Scripture Text - New Epoch) is a full-stack Bible/Scripture reading and study application. It allows users to browse, search, and read biblical texts across multiple translations, including apocryphal books. Features include notes, cross-references, tagging, verse linking, broadcast/presentation mode, and an admin panel for content management.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API), TypeScript, Vite, Bootstrap 5 |
| Backend (dev) | Express 5, Node.js |
| Backend (prod) | Firebase Cloud Functions (Express) |
| Database | MySQL (remote: `n1nlmysql41plsk.secureserver.net`) |
| Hosting | Firebase Hosting (`eat-rstne-26.web.app`) |
| Rich Text | Quill 2.0 |
| Router | Vue Router 4 |

## Commands

```bash
# Full-stack development (Express server + Vite dev server in parallel)
npm run dev:all

# Frontend only (Vite, port 5174)
npm run dev

# Backend only (Express, port 3000)
npm run server

# Production build (TypeScript compile → Vite bundle → dist/)
npm run build

# Preview production build locally
npm run preview
```

**Firebase Functions (separate):**
```bash
cd functions
npm run serve    # Local emulator
npm run deploy   # Deploy to Firebase
npm run logs     # View function logs
```

## Architecture

### Frontend (`src/`)
- `src/main.ts` — App entry point, mounts Vue 3 with Bootstrap
- `src/App.vue` — Root component with RouterView
- `src/router/index.ts` — Vue Router routes
- `src/views/` — Page-level components (BooksView, ChaptersView, BroadcastView, admin/)
- `src/components/` — Shared components (VersePicker, VerseSearch, Settings)
- `src/api/` — API client modules (one file per resource: books, chapters, verses, notes, etc.)
- `src/utils/` — Utilities and TypeScript types (`collectionReferences.ts`)

### Backend
- `server/index.mjs` — Express dev server on port 3000
- `functions/index.js` — Firebase Cloud Functions (same Express API for production)

### API Endpoints
- `/api/books` — CRUD for books
- `/api/books/:id/chapters` — Chapters by book
- `/api/chapters` — All chapters
- `/api/verses` — Verse data
- `/api/notes` — User notes
- `/api/verse-links` — Verse references/links
- `/api/tags` — Tagging system
- `/api/cross-references` — Cross-references
- `/api/book-categories` — Category management

### Database Schema
10 tables: `books_tbl`, `chapters_tbl`, `verses_tbl`, `notes_tbl`, `verse_notes_tbl`, `verse_links_tbl`, `tags_tbl`, `verse_tags_tbl`, `cross_references_tbl`, `book_categories_tbl`

**Content:**
- 86 books total: First Covenant (36), New Covenant (19), Restored Apocryphal (20+)
- Multilingual: English, Hebrew, Telugu translations

## Key Conventions

- Vue 3 Composition API with `<script setup>` throughout
- TypeScript strict mode enabled
- Module alias: `@/*` → `./src/*`
- API modules in `src/api/` abstract all backend calls
- Books list is cached in `sessionStorage` for 1 hour to reduce API calls
- Admin panel lives under `src/views/admin/`

## Environment Setup

Copy `.env.example` to `.env` and fill in MySQL credentials. The dev server reads DB config from environment variables.

## Deployment

1. `npm run build` — outputs to `dist/`
2. Firebase Hosting serves `dist/` at `https://eat-rstne-26.web.app`
3. Cloud Functions at `https://us-central1-rstne-app-2025.cloudfunctions.net/api/api`
4. SPA rewrites configured in `firebase.json` for Vue Router

## Notable Files

| File | Purpose |
|---|---|
| `src/views/ChaptersView.vue` | Main reading view (~3415 lines, largest file) |
| `src/utils/collectionReferences.ts` | TypeScript types and schemas |
| `src/utils/versePickerData.ts` | Large static dataset (~3.5MB) |
| `functions/index.js` | Production API (~39KB) |
| `mjs-scripts/` | 117 database migration/seed scripts |
| `CATEGORIZATION-SUMMARY.md` | Book categorization documentation |
