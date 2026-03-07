<template>
  <div class="compare-page">
    <header class="compare-header">
      <div class="header-left">
        <router-link to="/admin" class="back-link">← Admin Dashboard</router-link>
        <h1>📑 Compare Book with RSTNE Page</h1>
      </div>
    </header>

    <!-- Book Selector -->
    <div class="selector-bar">
      <div class="selector-inner">
        <label for="book-select">Select a Book:</label>
        <select id="book-select" v-model="selectedBookId" @change="onBookChange" :disabled="loadingBooks">
          <option value="">-- Choose a book --</option>
          <option
            v-for="book in booksWithLink"
            :key="book.book_id"
            :value="book.book_id"
          >
            {{ book.book_name }}
          </option>
        </select>
        <span v-if="loadingBooks" class="inline-spinner">Loading books…</span>
        <span v-if="booksWithLink.length === 0 && !loadingBooks" class="warning-text">
          No books have a <code>book_link</code> set yet.
        </span>
      </div>

      <!-- Stats bar when loaded -->
      <div v-if="selectedBook && !loading" class="stats-bar">
        <span class="stat">📖 {{ selectedBook.book_name }}</span>
        <span class="stat">Chapters: {{ dbChapters.length }}</span>
        <span class="stat total-diff" :class="{ 'has-diff': totalDiffCount > 0 }">
          Differences: {{ totalDiffCount }}
        </span>
        <a v-if="selectedBook.book_link" :href="selectedBook.book_link" target="_blank" class="rstne-link">
          Open RSTNE Page ↗
        </a>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="loadComparison">Retry</button>
    </div>

    <!-- Comparison View -->
    <div v-if="!loading && !error && dbChapters.length > 0" class="compare-container">
      <!-- Column headers -->
      <div class="compare-columns-header">
        <div class="col-header db-header">🗄️ Database</div>
        <div class="col-header rstne-header">🌐 RSTNE Page</div>
      </div>

      <!-- Chapter groups -->
      <div v-for="chapter in mergedChapters" :key="chapter.chapterNumber" class="chapter-block">
        <div class="chapter-title-row">
          <div class="chapter-title db-chapter-title">
            Chapter {{ chapter.chapterNumber }}
            <span class="verse-count">({{ chapter.dbVerses.length }} verses)</span>
          </div>
          <div class="chapter-title rstne-chapter-title">
            Chapter {{ chapter.chapterNumber }}
            <span class="verse-count">({{ chapter.rstneVerses.length }} verses)</span>
            <span v-if="chapter.dbVerses.length !== chapter.rstneVerses.length" class="count-mismatch">
              ⚠️ Count mismatch
            </span>
          </div>
        </div>

        <div
          v-for="verseRow in chapter.verseRows"
          :key="verseRow.verseNumber"
          class="verse-row"
          :class="{
            'verse-missing-db': !verseRow.dbVerse,
            'verse-missing-rstne': !verseRow.rstneVerse,
            'verse-different': verseRow.hasDiff && verseRow.dbVerse && verseRow.rstneVerse,
            'verse-identical': !verseRow.hasDiff && verseRow.dbVerse && verseRow.rstneVerse
          }"
        >
          <!-- DB side -->
          <div class="verse-cell db-cell">
            <span class="verse-num">{{ verseRow.verseNumber }}</span>
            <span v-if="!verseRow.dbVerse" class="missing-tag">— not in DB —</span>
            <span v-else class="verse-text">
              <span
                v-for="(part, i) in verseRow.dbDiff"
                :key="i"
                :class="{
                  'diff-removed': part.type === 'removed',
                  'diff-same': part.type === 'same'
                }"
              >{{ part.text }}</span>
            </span>
          </div>

          <!-- RSTNE side -->
          <div class="verse-cell rstne-cell">
            <span class="verse-num">{{ verseRow.verseNumber }}</span>
            <span v-if="!verseRow.rstneVerse" class="missing-tag">— not on RSTNE page —</span>
            <span v-else class="verse-text">
              <span
                v-for="(part, i) in verseRow.rstneDiff"
                :key="i"
                :class="{
                  'diff-added': part.type === 'added',
                  'diff-same': part.type === 'same'
                }"
              >{{ part.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state after selection -->
    <div v-if="!loading && !error && selectedBookId && dbChapters.length === 0" class="empty-state">
      No chapters found in database for this book.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAllBooks } from '@/api/books';
import { getChaptersByBookId } from '@/api/chapters';
import { getVersesByChapterId } from '@/api/verses';
import type { Book, Chapter, Verse } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RstneVerse   { verseNumber: number; text: string }
interface RstneChapter { chapterNumber: number; verses: RstneVerse[] }

interface DiffPart { type: 'same' | 'removed' | 'added'; text: string }

interface VerseRow {
  verseNumber: number;
  dbVerse:    string | null;
  rstneVerse: string | null;
  dbDiff:     DiffPart[];
  rstneDiff:  DiffPart[];
  hasDiff:    boolean;
}

interface MergedChapter {
  chapterNumber: number;
  dbVerses:    { verseNumber: number; text: string }[];
  rstneVerses: RstneVerse[];
  verseRows:   VerseRow[];
}

// ─── State ────────────────────────────────────────────────────────────────────

const allBooks       = ref<Book[]>([]);
const loadingBooks   = ref(false);
const selectedBookId = ref<number | ''>('');
const loading        = ref(false);
const loadingMessage = ref('');
const error          = ref('');
const dbChapters     = ref<Chapter[]>([]);
const rstneChapters  = ref<RstneChapter[]>([]);
// Map chapterId → verses array
const dbVerseMap     = ref<Map<number, Verse[]>>(new Map());

// ─── Computed ─────────────────────────────────────────────────────────────────

const booksWithLink = computed(() =>
  allBooks.value.filter(b => b.book_link && b.book_link.trim() !== '')
);

const selectedBook = computed<Book | null>(() =>
  allBooks.value.find(b => b.book_id === selectedBookId.value) ?? null
);

const mergedChapters = computed<MergedChapter[]>(() => {
  const result: MergedChapter[] = [];

  // Build rstne lookup by chapterNumber
  const rstneMap = new Map<number, RstneVerse[]>();
  for (const rc of rstneChapters.value) {
    rstneMap.set(rc.chapterNumber, rc.verses);
  }

  for (const ch of dbChapters.value) {
    const chNum = parseInt(ch.chapter_number, 10);
    if (isNaN(chNum)) continue;

    const dbRaw   = dbVerseMap.value.get(ch.chapter_id) ?? [];
    const rstneRaw = rstneMap.get(chNum) ?? [];

    const dbVerses   = dbRaw.map(v => ({ verseNumber: v.verse_index ?? 0, text: stripHtml(v.verse) }));
    const rstneVerses = rstneRaw;

    // Build verse row map
    const allNums = new Set([
      ...dbVerses.map(v => v.verseNumber),
      ...rstneVerses.map(v => v.verseNumber)
    ]);

    const dbByNum    = new Map(dbVerses.map(v => [v.verseNumber, v.text]));
    const rstneByNum = new Map(rstneVerses.map(v => [v.verseNumber, v.text]));

    const verseRows: VerseRow[] = [];
    for (const num of [...allNums].sort((a, b) => a - b)) {
      const dbText    = dbByNum.get(num) ?? null;
      const rstneText = rstneByNum.get(num) ?? null;

      let dbDiff: DiffPart[]    = [];
      let rstneDiff: DiffPart[] = [];
      let hasDiff = false;

      if (dbText && rstneText) {
        const d = wordDiff(dbText, rstneText);
        dbDiff    = d.left;
        rstneDiff = d.right;
        hasDiff   = d.hasDiff;
      } else if (dbText) {
        dbDiff  = [{ type: 'same', text: dbText }];
        hasDiff = true;
      } else if (rstneText) {
        rstneDiff = [{ type: 'same', text: rstneText }];
        hasDiff   = true;
      }

      verseRows.push({ verseNumber: num, dbVerse: dbText, rstneVerse: rstneText, dbDiff, rstneDiff, hasDiff });
    }

    result.push({ chapterNumber: chNum, dbVerses, rstneVerses, verseRows });
  }

  return result;
});

const totalDiffCount = computed(() =>
  mergedChapters.value.reduce(
    (acc, ch) => acc + ch.verseRows.filter(r => r.hasDiff).length,
    0
  )
);

// ─── Word diff (LCS) ─────────────────────────────────────────────────────────

function wordDiff(left: string, right: string): { left: DiffPart[]; right: DiffPart[]; hasDiff: boolean } {
  const lWords = tokenize(left);
  const rWords = tokenize(right);

  if (lWords.join('') === rWords.join('')) {
    return {
      left:  [{ type: 'same', text: left }],
      right: [{ type: 'same', text: right }],
      hasDiff: false
    };
  }

  // LCS table
  const m = lWords.length;
  const n = rWords.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lWords[i - 1].toLowerCase() === rWords[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  let i = m, j = n;

  const tempLeft:  { type: 'same' | 'removed' | 'added'; word: string }[] = [];
  const tempRight: { type: 'same' | 'removed' | 'added'; word: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lWords[i - 1].toLowerCase() === rWords[j - 1].toLowerCase()) {
      tempLeft.unshift({ type: 'same', word: lWords[i - 1] });
      tempRight.unshift({ type: 'same', word: rWords[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempRight.unshift({ type: 'added', word: rWords[j - 1] });
      j--;
    } else {
      tempLeft.unshift({ type: 'removed', word: lWords[i - 1] });
      i--;
    }
  }

  // Merge consecutive same-type parts
  const merge = (arr: { type: string; word: string }[]): DiffPart[] => {
    const out: DiffPart[] = [];
    for (const item of arr) {
      if (out.length > 0 && out[out.length - 1].type === item.type) {
        out[out.length - 1].text += item.word;
      } else {
        out.push({ type: item.type as DiffPart['type'], text: item.word });
      }
    }
    return out;
  };

  return {
    left:    merge(tempLeft),
    right:   merge(tempRight),
    hasDiff: true
  };
}

/** Strip HTML tags and decode common HTML entities */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize preserving whitespace as tokens so we can reconstruct the text */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter(t => t.length > 0);
}

// ─── API calls ────────────────────────────────────────────────────────────────

onMounted(async () => {
  loadingBooks.value = true;
  try {
    allBooks.value = await getAllBooks();
  } finally {
    loadingBooks.value = false;
  }
});

function onBookChange() {
  if (!selectedBookId.value) {
    dbChapters.value = [];
    rstneChapters.value = [];
    dbVerseMap.value = new Map();
    error.value = '';
    return;
  }
  loadComparison();
}

async function loadComparison() {
  if (!selectedBookId.value || !selectedBook.value?.book_link) return;

  loading.value = true;
  error.value   = '';
  dbChapters.value = [];
  rstneChapters.value = [];
  dbVerseMap.value = new Map();

  try {
    loadingMessage.value = 'Fetching chapters and RSTNE page…';

    // Parallel: DB chapters + RSTNE proxy
    const [chapters, rstneData] = await Promise.all([
      getChaptersByBookId(selectedBookId.value as number),
      fetchRstnePage(selectedBook.value!.book_link!)
    ]);

    dbChapters.value    = chapters;
    rstneChapters.value = rstneData.chapters ?? [];

    loadingMessage.value = `Loading verses for ${chapters.length} chapters…`;

    // Fetch all verses in parallel (batched to avoid too many concurrent requests)
    const BATCH_SIZE = 10;
    const newMap = new Map<number, Verse[]>();

    for (let b = 0; b < chapters.length; b += BATCH_SIZE) {
      const batch = chapters.slice(b, b + BATCH_SIZE);
      loadingMessage.value = `Loading verses… (${Math.min(b + BATCH_SIZE, chapters.length)} / ${chapters.length})`;
      const results = await Promise.all(
        batch.map(ch => getVersesByChapterId(ch.chapter_id))
      );
      batch.forEach((ch, idx) => newMap.set(ch.chapter_id, results[idx]));
    }

    dbVerseMap.value = newMap;
  } catch (e: any) {
    error.value = e?.message ?? 'Unknown error loading comparison';
  } finally {
    loading.value = false;
  }
}

async function fetchRstnePage(url: string): Promise<{ chapters: RstneChapter[] }> {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${API_URL}/proxy-rstne?url=${encoded}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }
  return response.json();
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.compare-page {
  min-height: 100vh;
  background: #f0f2f5;
  font-family: 'Segoe UI', sans-serif;
}

.compare-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.2rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.compare-header h1 {
  margin: 0;
  font-size: 1.6rem;
}

.back-link {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  padding: 0.4rem 0.9rem;
  background: rgba(255,255,255,0.2);
  border-radius: 6px;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background 0.2s;
}
.back-link:hover { background: rgba(255,255,255,0.35); }

/* ── Selector bar ────────────────────────────────────────────────────────── */
.selector-bar {
  background: white;
  border-bottom: 1px solid #dde1e9;
  padding: 1rem 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
}

.selector-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.selector-inner label {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

#book-select {
  padding: 0.45rem 0.8rem;
  border: 1.5px solid #c0c7d8;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 260px;
  background: #fafbff;
  cursor: pointer;
  transition: border-color 0.2s;
}
#book-select:focus { outline: none; border-color: #667eea; }

.inline-spinner {
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
}
.warning-text {
  color: #c0392b;
  font-size: 0.9rem;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}
.stat {
  font-size: 0.9rem;
  color: #555;
  background: #f0f2f5;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
}
.stat.total-diff.has-diff {
  background: #fff3cd;
  color: #856404;
  font-weight: 600;
}
.rstne-link {
  font-size: 0.85rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}
.rstne-link:hover { text-decoration: underline; }

/* ── Loading / error ─────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  gap: 1rem;
  color: #555;
}
.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  gap: 1rem;
  color: #c0392b;
}
.error-state button {
  padding: 0.5rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #888;
}

/* ── Compare columns ─────────────────────────────────────────────────────── */
.compare-container {
  padding: 1.5rem 2rem 4rem;
  max-width: 1600px;
  margin: 0 auto;
}

.compare-columns-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.col-header {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
}
.db-header    { background: #e8f4fd; color: #1565c0; }
.rstne-header { background: #e8f5e9; color: #2e7d32; }

/* ── Chapter block ───────────────────────────────────────────────────────── */
.chapter-block {
  margin-bottom: 1rem;
  border: 1px solid #dde1e9;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.chapter-title-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.chapter-title {
  padding: 0.55rem 1rem;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.db-chapter-title    { background: #e8f4fd; color: #1565c0; }
.rstne-chapter-title { background: #e8f5e9; color: #2e7d32; }

.verse-count {
  font-weight: 400;
  font-size: 0.82rem;
  color: #888;
}
.count-mismatch {
  font-size: 0.8rem;
  color: #e65100;
  font-weight: 600;
}

/* ── Verse rows ──────────────────────────────────────────────────────────── */
.verse-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #f0f2f5;
  transition: background 0.1s;
}

.verse-row.verse-identical:hover {
  background: #fafbff;
}
.verse-row.verse-different {
  background: #fffde7;
}
.verse-row.verse-missing-db {
  background: #fce4ec;
}
.verse-row.verse-missing-rstne {
  background: #e8f5e9;
}

.verse-cell {
  padding: 0.5rem 1rem 0.5rem 0.75rem;
  font-size: 0.93rem;
  line-height: 1.7;
  display: flex;
  gap: 0.4rem;
  align-items: flex-start;
  text-align: left;
}
.db-cell    { border-right: 1px solid #e8eaf0; }
.rstne-cell { background: transparent; }

.verse-num {
  font-weight: 700;
  color: #999;
  font-size: 0.78rem;
  flex-shrink: 0;
  min-width: 1.8rem;
  padding-top: 2px;
}

.verse-text {
  flex: 1;
  color: #2c2c2c;
}

.missing-tag {
  color: #bbb;
  font-style: italic;
  font-size: 0.88rem;
}

/* ── Diff highlights ─────────────────────────────────────────────────────── */
.diff-same    { color: #2c2c2c; }
.diff-removed { background: #ffcdd2; color: #b71c1c; border-radius: 3px; padding: 0 1px; }
.diff-added   { background: #c8e6c9; color: #1b5e20; border-radius: 3px; padding: 0 1px; }
</style>
