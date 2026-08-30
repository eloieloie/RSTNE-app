<template>
  <div class="audio-generator">
    <header class="page-header">
      <div>
        <h1>🔊 Verse Audio Generator</h1>
        <p class="subtitle">Generate and validate text-to-speech audio for verses before shipping playback in the app.</p>
      </div>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Picker -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Book</label>
        <select v-model.number="selectedBookId">
          <option :value="null">Select a book…</option>
          <option v-for="b in books" :key="b.book_id" :value="b.book_id">{{ b.book_name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Chapter</label>
        <select v-model.number="selectedChapterId" :disabled="!selectedBookId">
          <option :value="null">Select a chapter…</option>
          <option v-for="c in chapters" :key="c.chapter_id" :value="c.chapter_id">{{ c.chapter_number }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Language</label>
        <select v-model="lang">
          <option value="en">English</option>
          <option value="te">Telugu</option>
        </select>
      </div>
      <div class="filter-actions">
        <label class="regen-toggle">
          <input v-model="regenerateAll" type="checkbox" />
          Regenerate already-ready verses too
        </label>
        <button class="btn-primary" :disabled="!selectedChapterId || generatingAll || rows.length === 0" @click="generateAll">
          {{ generatingAll ? `Generating ${generateProgress.done}/${generateProgress.total}…` : 'Generate All in Chapter' }}
        </button>
        <button v-if="generatingAll" class="btn-secondary" @click="stopRequested = true">Stop</button>
        <button class="btn-danger" :disabled="!selectedChapterId || resetting" @click="handleReset">
          {{ resetting ? 'Resetting…' : 'Reset All in Chapter' }}
        </button>
      </div>
    </div>

    <!-- Status -->
    <div v-if="loadError" class="state-msg error">{{ loadError }}</div>
    <div v-else-if="!selectedChapterId" class="state-msg">Pick a book and chapter to view its verses.</div>
    <div v-else-if="loading" class="state-msg">Loading verses…</div>
    <div v-else-if="rows.length === 0" class="state-msg">No verses in this chapter.</div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="verses-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Text sent to TTS</th>
            <th>Status</th>
            <th>Listen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.verse_id" class="verse-row">
            <td class="idx-cell">{{ row.verse_index ?? '—' }}</td>
            <td class="text-cell">
              <div v-if="!row.sourceText" class="no-text">No {{ langLabel }} text for this verse</div>
              <div v-else>{{ row.previewText }}</div>
            </td>
            <td class="status-cell">
              <span class="status-badge" :class="row.status ?? 'none'">{{ row.status ?? 'not generated' }}</span>
              <div v-if="row.error" class="row-error" :title="row.error">{{ truncate(row.error, 80) }}</div>
            </td>
            <td class="listen-cell">
              <audio v-if="row.audioUrl" :src="row.audioUrl" controls preload="none"></audio>
              <span v-else>—</span>
            </td>
            <td class="actions-cell">
              <button
                class="action-btn"
                :disabled="!row.sourceText || row.generating"
                @click="generateOne(row, row.status === 'ready')"
              >
                {{ row.generating ? '…' : row.status === 'ready' || row.status === 'failed' ? 'Regenerate' : 'Generate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { getAllBooks } from '@/api/books';
import { getChaptersByBookId } from '@/api/chapters';
import { getVersesByChapterId, type VerseWithLinks } from '@/api/verses';
import { getChapterAudio, generateVerseAudio, resetVerseAudioData } from '@/api/verseAudio';
import { stripHtmlKeepPaleo } from '@/utils/paleoBora';
import type { Book, Chapter, VerseAudioLanguage, VerseAudioStatus } from '@/utils/collectionReferences';

interface Row {
  verse_id: number;
  verse_index: number | null;
  sourceText: string | null; // raw HTML-bearing text for the selected language
  previewText: string;       // stripped, human-readable preview
  status: VerseAudioStatus | null;
  audioUrl: string | null;
  error: string | null;
  generating: boolean;
}

const books = ref<Book[]>([]);
const chapters = ref<Chapter[]>([]);
const selectedBookId = ref<number | null>(null);
const selectedChapterId = ref<number | null>(null);
const lang = ref<VerseAudioLanguage>('en');
const regenerateAll = ref(false);

const rows = ref<Row[]>([]);
const loading = ref(false);
const loadError = ref('');

const generatingAll = ref(false);
const stopRequested = ref(false);
const generateProgress = ref({ done: 0, total: 0 });
const resetting = ref(false);

async function handleReset() {
  if (!selectedChapterId.value) return;
  if (!confirm(`This clears tracked audio rows for this chapter (${langLabel.value}) in the database. It does not delete files from disk. Continue?`)) {
    return;
  }
  resetting.value = true;
  try {
    await resetVerseAudioData({ chapterId: selectedChapterId.value, language: lang.value });
    await loadRows();
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Reset failed';
  } finally {
    resetting.value = false;
  }
}

const langLabel = computed(() => (lang.value === 'en' ? 'English' : 'Telugu'));

async function loadBooks() {
  books.value = await getAllBooks();
}

watch(selectedBookId, async (bookId) => {
  chapters.value = [];
  selectedChapterId.value = null;
  rows.value = [];
  if (bookId == null) return;
  chapters.value = await getChaptersByBookId(bookId);
});

watch([selectedChapterId, lang], loadRows);

// Mirrors VerseAudioEndpoint::stripInlineVerseRefs() in RSTNE-apis/endpoints/verse-audio.php —
// drops inline cross-reference shorthand like "#Yoch1 3" so the preview matches what's
// actually sent to TTS (that shorthand is otherwise turned into a clickable link by
// formatVerseWithPaleoBora() in ChaptersView.vue, using the same underlying pattern).
function stripInlineVerseRefs(text: string): string {
  return text
    .replace(/;?\s*#[a-zA-Z]{4}\d+\s+\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// The audio URL is content-hash-keyed, so it only changes when the underlying
// text (or the pipeline version) changes. That's the right long-term caching
// behavior, but during iterative admin testing a "Regenerate" can rewrite the
// file at the exact same URL — appending the generation timestamp as a query
// param forces the browser to re-fetch instead of serving its cached copy.
function withCacheBust(url: string | null, version: string | null): string | null {
  if (!url) return null;
  if (!version) return url;
  return `${url}?v=${encodeURIComponent(version)}`;
}

function buildRow(verse: VerseWithLinks): Row {
  const sourceText = lang.value === 'en' ? verse.verse : verse.telugu_verse;
  return {
    verse_id: verse.verse_id,
    verse_index: verse.verse_index,
    sourceText: sourceText ?? null,
    previewText: sourceText ? stripInlineVerseRefs(stripHtmlKeepPaleo(sourceText)) : '',
    status: null,
    audioUrl: null,
    error: null,
    generating: false,
  };
}

async function loadRows() {
  if (!selectedChapterId.value) {
    rows.value = [];
    return;
  }
  loading.value = true;
  loadError.value = '';
  try {
    const [verses, audio] = await Promise.all([
      getVersesByChapterId(selectedChapterId.value),
      getChapterAudio(selectedChapterId.value, lang.value),
    ]);
    const audioByVerse = new Map(audio.map((a) => [a.verse_id, a]));
    rows.value = verses
      .sort((a, b) => (a.verse_index ?? 0) - (b.verse_index ?? 0))
      .map((v) => {
        const row = buildRow(v);
        const a = audioByVerse.get(v.verse_id);
        if (a) {
          row.status = a.status;
          row.audioUrl = withCacheBust(a.audio_url, a.dt_generated);
        }
        return row;
      });
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load verses';
  } finally {
    loading.value = false;
  }
}

async function generateOne(row: Row, force: boolean) {
  if (!row.sourceText) return;
  row.generating = true;
  row.error = null;
  try {
    const result = await generateVerseAudio(row.verse_id, lang.value, force);
    row.status = result.status;
    row.audioUrl = withCacheBust(result.audio_url, result.dt_generated);
    row.error = result.error_message;
  } catch (e: unknown) {
    row.error = e instanceof Error ? e.message : 'Generation failed';
    row.status = 'failed';
  } finally {
    row.generating = false;
  }
}

async function generateAll() {
  generatingAll.value = true;
  stopRequested.value = false;
  const targets = rows.value.filter((r) => r.sourceText && (regenerateAll.value || r.status !== 'ready'));
  generateProgress.value = { done: 0, total: targets.length };
  for (const row of targets) {
    if (stopRequested.value) break;
    await generateOne(row, regenerateAll.value);
    generateProgress.value.done++;
  }
  generatingAll.value = false;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

onMounted(loadBooks);
</script>

<style scoped>
.audio-generator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: inherit;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
.subtitle { margin: 0.35rem 0 0; color: #6b7280; font-size: 0.95rem; }

.back-link {
  color: #6b7280;
  text-decoration: none;
  font-size: 0.9rem;
  white-space: nowrap;
}
.back-link:hover { color: #1E40AF; }

.btn-danger {
  padding: 7px 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-danger:hover:not(:disabled) { background: #fee2e2; }
.btn-danger:disabled { opacity: 0.6; cursor: default; }

.filters-bar {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.filter-group select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 160px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex-wrap: wrap;
}

.regen-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.btn-primary {
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: #5568d3; }
.btn-primary:disabled { opacity: 0.6; cursor: default; }

.btn-secondary {
  padding: 7px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }

.state-msg {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
.state-msg.error { color: #dc2626; }

.table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: auto;
}

.verses-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.verses-table thead th {
  text-align: left;
  padding: 10px 14px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  white-space: nowrap;
}

.verse-row { transition: background 0.1s; }
.verse-row:hover { background: #f9fafb; }

.verses-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.idx-cell { white-space: nowrap; color: #6b7280; font-weight: 600; }
.text-cell { line-height: 1.45; color: #111827; max-width: 480px; }
.no-text { color: #9ca3af; font-style: italic; }

.status-cell { white-space: nowrap; }
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.status-badge.ready { background: #dcfce7; color: #166534; }
.status-badge.pending { background: #e0e7ff; color: #3730a3; }
.status-badge.stale { background: #fef3c7; color: #92400e; }
.status-badge.failed { background: #fee2e2; color: #991b1b; }
.status-badge.none { background: #f3f4f6; color: #6b7280; }
.row-error {
  margin-top: 4px;
  font-size: 11px;
  color: #dc2626;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.listen-cell audio { height: 32px; max-width: 220px; }

.actions-cell { white-space: nowrap; }
.action-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  transition: background 0.1s, border-color 0.1s;
}
.action-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
.action-btn:disabled { opacity: 0.5; cursor: default; }

@media (max-width: 640px) {
  .audio-generator { padding: 1rem; }
  .filter-actions { margin-left: 0; }
}
</style>
