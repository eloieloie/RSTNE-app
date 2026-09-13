<template>
  <div class="compare-page admin-page">
    <header class="compare-header admin-page-header">
      <div class="header-left">
        <router-link to="/admin" class="back-link admin-back-link">← Admin Dashboard</router-link>
        <h1 class="admin-title">📑 Compare Book with RSTNE Page</h1>
      </div>
      <div class="header-right">
        <button class="ignore-btn admin-btn admin-btn--secondary" @click="showIgnorePanel = !showIgnorePanel">
          🚫 Ignore List ({{ ignorePairs.length }})
        </button>
      </div>
    </header>

    <!-- Ignore list panel -->
    <div v-if="showIgnorePanel" class="ignore-panel admin-card">
      <div class="ignore-panel-header">
        <strong>Ignored word pairs</strong>
        <span class="ignore-hint">
          These substitutions are treated as identical and won't be highlighted as differences.
          Click a red word on the left, then its green counterpart on the right, to add a pair.
        </span>
      </div>
      <ul class="ignore-list">
        <li v-for="(pair, idx) in ignorePairs" :key="pair.pair_id">
          <span class="ignore-word">{{ pair.left }}</span>
          <span class="ignore-arrow">↔</span>
          <span class="ignore-word">{{ pair.right }}</span>
          <button class="ignore-remove admin-btn admin-btn--danger admin-btn--sm" @click="removeIgnorePair(idx)" title="Remove">✕</button>
        </li>
        <li v-if="ignorePairsLoading" class="ignore-empty">Loading…</li>
        <li v-else-if="ignorePairs.length === 0" class="ignore-empty">No ignored pairs yet.</li>
      </ul>
      <div class="ignore-add-form">
        <input v-model="newIgnoreLeft" class="admin-input" placeholder="DB word (e.g. HWHY)" @keyup.enter="addManualIgnorePair" />
        <span>↔</span>
        <input v-model="newIgnoreRight" class="admin-input" placeholder="RSTNE word (e.g. YHUH)" @keyup.enter="addManualIgnorePair" />
        <button class="admin-btn admin-btn--primary admin-btn--sm" @click="addManualIgnorePair">Add</button>
      </div>
    </div>

    <!-- Picking-a-pair banner -->
    <div v-if="pendingIgnoreLeft" class="pending-ignore-banner">
      Picking pair for “{{ pendingIgnoreLeft }}” — click the matching word on the RSTNE side to ignore this difference.
      <button class="admin-btn admin-btn--secondary admin-btn--sm" @click="pendingIgnoreLeft = null">Cancel</button>
    </div>

    <!-- Book Selector -->
    <div class="selector-bar">
      <div class="selector-inner">
        <label for="book-select" class="admin-label">Select a Book:</label>
        <select id="book-select" class="admin-select" v-model="selectedBookId" @change="onBookChange" :disabled="loadingBooks">
          <option value="">-- Choose a book --</option>
          <option
            v-for="book in booksWithLink"
            :key="book.book_id"
            :value="book.book_id"
          >
            #{{ book.book_index }} — {{ book.book_name }}
          </option>
        </select>
        <span v-if="loadingBooks" class="inline-spinner">Loading books…</span>
        <span v-if="booksWithLink.length === 0 && !loadingBooks" class="warning-text">
          No books have a <code class="admin-mono">book_link</code> set yet.
        </span>
        <span v-else-if="!loadingBooks" class="link-coverage-text">
          {{ booksWithLink.length }} of {{ allBooks.length }} books have a <code class="admin-mono">book_link</code> —
          missing #s: {{ missingBookIndexes }}
        </span>
      </div>

      <!-- Stats bar when loaded -->
      <div v-if="selectedBook && !loading" class="stats-bar">
        <span class="stat admin-badge admin-badge--neutral">📖 {{ selectedBook.book_name }}</span>
        <span class="stat admin-badge admin-badge--neutral">Chapters: {{ dbChapters.length }}</span>
        <span class="stat admin-badge total-diff" :class="{ 'has-diff': totalDiffCount > 0 }">
          Differences: {{ totalDiffCount }}
        </span>
        <span class="stat admin-badge matched-stat">✅ Matched: {{ totalMatchedCount }}</span>
        <label class="hide-matched-toggle">
          <input type="checkbox" v-model="hideMatched" />
          Hide matched verses
        </label>
        <a v-if="selectedBook.book_link" :href="selectedBook.book_link" target="_blank" class="rstne-link">
          Open RSTNE Page ↗
        </a>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state admin-state">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state admin-state admin-state--error">
      <p>⚠️ {{ error }}</p>
      <button class="admin-btn admin-btn--primary" @click="loadComparison">Retry</button>
    </div>

    <!-- Comparison View -->
    <div v-if="!loading && !error && displayedChapters.length > 0" class="compare-container">
      <!-- Column headers -->
      <div class="compare-columns-header">
        <div class="col-header db-header">🗄️ Database</div>
        <div class="col-header rstne-header">🌐 RSTNE Page</div>
      </div>

      <!-- Chapter groups -->
      <div v-for="chapter in displayedChapters" :key="chapter.chapterNumber" class="chapter-block">
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
                @click="part.type === 'removed' && onClickRemoved(part.text)"
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
                @click="part.type === 'added' && onClickAdded(part.text)"
              >{{ part.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state after selection -->
    <div v-if="!loading && !error && selectedBookId && dbChapters.length === 0" class="empty-state admin-state">
      No chapters found in database for this book.
    </div>
    <div v-if="!loading && !error && dbChapters.length > 0 && displayedChapters.length === 0" class="empty-state admin-state">
      All verses match — nothing to show with "Hide matched verses" enabled.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { API_HEADERS } from '@/api/client';
import { getAllBooks } from '@/api/books';
import { getChaptersByBookId } from '@/api/chapters';
import { getVersesByChapterId } from '@/api/verses';
import { getIgnorePairs, createIgnorePair, deleteIgnorePair } from '@/api/compareIgnorePairs';
import type { Book, Chapter, Verse } from '@/utils/collectionReferences';

const API_URL = 'https://rstne.eloi.in/api';

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

interface IgnorePair { pair_id: number; left: string; right: string }

// ─── Ignore list (word substitutions treated as identical) ───────────────────
// Stored in compare_ignore_pairs_tbl via the PHP API — shared across admins/devices.

const ignorePairs        = ref<IgnorePair[]>([]);
const ignorePairsLoading = ref(false);
const showIgnorePanel    = ref(false);
const newIgnoreLeft      = ref('');
const newIgnoreRight     = ref('');
const pendingIgnoreLeft  = ref<string | null>(null);

async function loadIgnorePairs() {
  ignorePairsLoading.value = true;
  try {
    const rows = await getIgnorePairs();
    ignorePairs.value = rows.map(r => ({ pair_id: r.pair_id, left: r.left_word, right: r.right_word }));
  } catch {
    // leave list empty if the API is unreachable
  } finally {
    ignorePairsLoading.value = false;
  }
}

function isIgnoredPair(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  return ignorePairs.value.some(p => (p.left === al && p.right === bl) || (p.left === bl && p.right === al));
}

async function addIgnorePair(left: string, right: string) {
  const l = left.trim().toLowerCase();
  const r = right.trim().toLowerCase();
  if (!l || !r || l === r || isIgnoredPair(l, r)) return;
  try {
    const created = await createIgnorePair(l, r);
    ignorePairs.value.push({ pair_id: created.pair_id, left: l, right: r });
  } catch {
    // ignore write failure; list stays as-is
  }
}

async function removeIgnorePair(index: number) {
  const pair = ignorePairs.value[index];
  if (!pair) return;
  ignorePairs.value.splice(index, 1);
  try {
    await deleteIgnorePair(pair.pair_id);
  } catch {
    // re-insert on failure so the UI stays truthful
    ignorePairs.value.splice(index, 0, pair);
  }
}

function addManualIgnorePair() {
  addIgnorePair(newIgnoreLeft.value, newIgnoreRight.value);
  newIgnoreLeft.value  = '';
  newIgnoreRight.value = '';
}

function onClickRemoved(text: string) {
  pendingIgnoreLeft.value = text.trim();
}

function onClickAdded(text: string) {
  if (!pendingIgnoreLeft.value) return;
  addIgnorePair(pendingIgnoreLeft.value, text.trim());
  pendingIgnoreLeft.value = null;
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

// Compact list of book_index numbers that have no book_link yet, e.g. "19-77, 79-83"
const missingBookIndexes = computed(() => {
  const present = new Set(booksWithLink.value.map(b => b.book_index));
  const missing = allBooks.value
    .map(b => b.book_index)
    .filter((n): n is number => n != null && !present.has(n))
    .sort((a, b) => a - b);

  if (missing.length === 0) return 'none';

  const ranges: string[] = [];
  let start = missing[0];
  let prev = missing[0];

  for (let i = 1; i < missing.length; i++) {
    if (missing[i] === prev + 1) {
      prev = missing[i];
      continue;
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = missing[i];
    prev = missing[i];
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);

  return ranges.join(', ');
});

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

    const dbVerses   = dbRaw.map(v => ({ verseNumber: v.verse_index ?? 0, text: stripParens(stripHtml(v.verse)) }));
    const rstneVerses = rstneRaw.map(v => ({ ...v, text: stripParens(v.text) }));

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

const totalMatchedCount = computed(() =>
  mergedChapters.value.reduce(
    (acc, ch) => acc + ch.verseRows.filter(r => !r.hasDiff).length,
    0
  )
);

// ─── Hide/show matched verses ─────────────────────────────────────────────────

const hideMatched = ref(false);

const displayedChapters = computed<MergedChapter[]>(() => {
  if (!hideMatched.value) return mergedChapters.value;

  return mergedChapters.value
    .map(ch => ({ ...ch, verseRows: ch.verseRows.filter(r => r.hasDiff) }))
    .filter(ch => ch.verseRows.length > 0);
});

// ─── Word diff (LCS) ─────────────────────────────────────────────────────────

function isWhitespace(word: string): boolean {
  return /^\s+$/.test(word);
}

function wordsMatch(a: string, b: string): boolean {
  if (isWhitespace(a) && isWhitespace(b)) return true;
  return a.toLowerCase() === b.toLowerCase() || isIgnoredPair(a, b);
}

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
      if (wordsMatch(lWords[i - 1], rWords[j - 1])) {
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
    if (i > 0 && j > 0 && wordsMatch(lWords[i - 1], rWords[j - 1])) {
      tempLeft.unshift({ type: 'same', word: lWords[i - 1] });
      tempRight.unshift({ type: 'same', word: rWords[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // A stray whitespace-only insertion (e.g. an extra/missing space around
      // punctuation) is a formatting quirk, not a real content difference.
      const word = rWords[j - 1];
      tempRight.unshift({ type: isWhitespace(word) ? 'same' : 'added', word });
      j--;
    } else {
      const word = lWords[i - 1];
      tempLeft.unshift({ type: isWhitespace(word) ? 'same' : 'removed', word });
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

  const hasDiff = tempLeft.some(t => t.type !== 'same') || tempRight.some(t => t.type !== 'same');

  return {
    left:    merge(tempLeft),
    right:   merge(tempRight),
    hasDiff
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

/** Remove parenthetical annotations like "(12 years)" or "(Evil Chanoch)" */
function stripParens(text: string): string {
  return text.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

/** Tokenize preserving whitespace as tokens so we can reconstruct the text. */
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
  loadIgnorePairs();
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
        batch.map(ch => fetchVersesWithRetry(ch.chapter_id))
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

// The shared GoDaddy host occasionally drops a request under a burst of
// concurrent connections (10 chapters fetched in parallel per batch above),
// which surfaces in the browser as a CORS/network failure even though the
// server itself is configured correctly. Retry transient failures instead of
// aborting the whole comparison.
async function fetchVersesWithRetry(chapterId: number, attempts = 3): Promise<Verse[]> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await getVersesByChapterId(chapterId);
    } catch (e) {
      if (attempt === attempts) throw e;
      await new Promise(resolve => setTimeout(resolve, 300 * attempt));
    }
  }
  throw new Error('unreachable');
}

async function fetchRstnePage(url: string): Promise<{ chapters: RstneChapter[] }> {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${API_URL}/proxy-rstne?url=${encoded}`, { headers: API_HEADERS, cache: 'no-store' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }
  return response.json();
}
</script>

<style scoped>
/* Page background, text color, and font come from .admin-page (admin-ui.css).
   The old purple/blue gradient header and white-on-color chrome are
   superseded by .admin-page-header / .admin-title / .admin-back-link /
   .admin-btn. This page keeps its full-bleed toolbar layout (header,
   selector bar, ignore panel span the full width rather than the shared
   1200px centered column), so .admin-page's own padding is zeroed out here
   and each bar keeps its own horizontal padding instead. */
.compare-page.admin-page {
  padding: 0;
}

.compare-header {
  max-width: none;
  margin: 0;
  padding: 1.2rem 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-right {
  display: flex;
  align-items: center;
}

/* ── Ignore list panel ──────────────────────────────────────────────────── */
.ignore-panel {
  margin: 0 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ignore-panel-header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.ignore-hint {
  font-size: 0.82rem;
  color: var(--color-muted-foreground);
}

.ignore-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.ignore-list li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--color-muted);
  border-radius: var(--radius-default);
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
}
.ignore-word { font-weight: 600; }
.ignore-arrow { color: var(--color-muted-foreground); }
.ignore-empty { color: var(--color-muted-foreground); font-style: italic; background: transparent; }

.ignore-add-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.ignore-add-form input {
  font-size: 0.85rem;
}

/* ── Pending-pick banner ─────────────────────────────────────────────────── */
.pending-ignore-banner {
  background: var(--color-note-bg);
  color: var(--color-note-text);
  border-left: 3px solid var(--color-note-border);
  padding: 0.6rem 2rem;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Selector bar ────────────────────────────────────────────────────────── */
.selector-bar {
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
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

#book-select {
  min-width: 260px;
}

.inline-spinner {
  color: var(--color-muted-foreground);
  font-size: 0.9rem;
  font-style: italic;
}
.warning-text {
  color: var(--color-error);
  font-size: 0.9rem;
}
.link-coverage-text {
  color: var(--color-muted-foreground);
  font-size: 0.85rem;
}
.warning-text code,
.link-coverage-text code {
  background: var(--color-muted);
  padding: 0.05rem 0.3rem;
  border-radius: var(--radius-sm);
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}
.stat.total-diff.has-diff {
  background: var(--color-note-bg);
  color: var(--color-note-text);
}
.stat.matched-stat {
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
  color: var(--color-success);
}
.hide-matched-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--color-muted-foreground);
  cursor: pointer;
  user-select: none;
}
.hide-matched-toggle input {
  cursor: pointer;
}
.rstne-link {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}
.rstne-link:hover { text-decoration: underline; }

/* ── Loading / error ───────────────────────────────────────────────────────
   Color/padding/text-align come from .admin-state / .admin-state--error;
   this keeps only the flex centering layout and the spinner, which aren't
   part of the shared class. */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
  border-radius: var(--radius-default);
  letter-spacing: 0.02em;
}
/* Database = blue / RSTNE Page = green is a two-source brand color-code
   reused across this header, the chapter-title bars, the "Matched" stat
   pill, and the missing-on-RSTNE row highlight below. Left as literal hex
   rather than tokenized: the app's blue/green-adjacent tokens (--color-cat-2,
   --color-success) are reserved for book-category tagging and generic
   success states elsewhere in the app, so reusing them here would blur
   those meanings, and tokenizing only some of the repeated usages would
   break the intentional visual pairing between them. */
.db-header    { background: #e8f4fd; color: #1565c0; }
.rstne-header { background: #e8f5e9; color: #2e7d32; }

/* ── Chapter block ───────────────────────────────────────────────────────── */
.chapter-block {
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-card);
  box-shadow: var(--shadow-sm);
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
  color: var(--color-muted-foreground);
}
.count-mismatch {
  font-size: 0.8rem;
  color: var(--color-warning);
  font-weight: 600;
}

/* ── Verse rows ──────────────────────────────────────────────────────────── */
.verse-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--color-border);
  transition: background 0.1s;
}

.verse-row.verse-identical:hover {
  background: var(--color-background-alt);
}
.verse-row.verse-different {
  background: var(--color-note-bg);
}
.verse-row.verse-missing-db {
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
}
.verse-row.verse-missing-rstne {
  /* Matches the RSTNE-column brand green above — see note-block comment. */
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
.db-cell    { border-right: 1px solid var(--color-border); }
.rstne-cell { background: transparent; }

.verse-num {
  font-weight: 700;
  color: var(--color-muted-foreground);
  font-size: 0.78rem;
  flex-shrink: 0;
  min-width: 1.8rem;
  padding-top: 2px;
}

.verse-text {
  flex: 1;
  color: var(--color-foreground);
}

.missing-tag {
  color: var(--color-muted-foreground);
  font-style: italic;
  font-size: 0.88rem;
}

/* ── Diff highlights ──────────────────────────────────────────────────────
   Insertions/deletions map cleanly onto the success/error tokens. */
.diff-same    { color: var(--color-foreground); }
.diff-removed { background: color-mix(in srgb, var(--color-error) 20%, transparent); color: var(--color-error); border-radius: 3px; padding: 0 1px; cursor: pointer; }
.diff-added   { background: color-mix(in srgb, var(--color-success) 20%, transparent); color: var(--color-success); border-radius: 3px; padding: 0 1px; cursor: pointer; }
.diff-removed:hover, .diff-added:hover { outline: 2px solid var(--color-primary); outline-offset: 1px; }
</style>
