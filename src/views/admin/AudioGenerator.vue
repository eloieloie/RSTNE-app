<template>
  <div class="audio-generator admin-page">
    <header class="admin-page-header">
      <div>
        <h1 class="admin-title">🔊 Verse Audio Generator</h1>
        <p class="admin-subtitle">Generate and validate text-to-speech audio for verses before shipping playback in the app.</p>
      </div>
      <router-link to="/admin" class="admin-back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Picker -->
    <div class="filters-bar admin-toolbar">
      <div class="filter-group admin-form-group">
        <label class="admin-label">Book</label>
        <select v-model.number="selectedBookId" class="admin-select">
          <option :value="null">Select a book…</option>
          <option v-for="b in books" :key="b.book_id" :value="b.book_id">{{ b.book_name }}</option>
        </select>
      </div>
      <div class="filter-group admin-form-group">
        <label class="admin-label">Chapter</label>
        <select v-model.number="selectedChapterId" :disabled="!selectedBookId" class="admin-select">
          <option :value="null">Select a chapter…</option>
          <option v-for="c in chapters" :key="c.chapter_id" :value="c.chapter_id">{{ c.chapter_number }}</option>
        </select>
      </div>
      <div class="filter-group admin-form-group">
        <label class="admin-label">Language</label>
        <select v-model="lang" class="admin-select">
          <option value="en">English</option>
          <option value="te">Telugu</option>
        </select>
      </div>
      <div class="filter-actions">
        <label class="regen-toggle">
          <input v-model="regenerateAll" type="checkbox" />
          Regenerate already-ready verses too
        </label>
        <button class="btn-primary admin-btn admin-btn--primary" :disabled="!selectedChapterId || generatingAll || bookGenerating || rows.length === 0" @click="generateAll">
          {{ generatingAll ? `Generating ${generateProgress.done}/${generateProgress.total}…` : 'Generate All in Chapter' }}
        </button>
        <button v-if="generatingAll" class="btn-secondary admin-btn admin-btn--secondary" @click="stopRequested = true">Stop</button>
        <button class="btn-primary admin-btn admin-btn--primary" :disabled="!selectedBookId || generatingAll || bookGenerating || bookModalLoading || chapters.length === 0" @click="openBookModal">
          {{ bookGenerating ? `Ch ${bookProgress.chapterDone}/${bookProgress.chapterTotal} · Verse ${bookProgress.verseDone}/${bookProgress.verseTotal}…` : bookModalLoading ? 'Checking…' : 'Generate All in Book' }}
        </button>
        <button class="btn-primary btn-all-books admin-btn admin-btn--primary" :disabled="allBooksGenerating || allBooksModalLoading || books.length === 0" @click="openAllBooksModal">
          {{ allBooksGenerating ? `Book ${allBooksProgress.bookDone}/${allBooksProgress.bookTotal}…` : allBooksModalLoading ? 'Scanning…' : 'Generate All Books' }}
        </button>
        <button class="btn-danger admin-btn admin-btn--danger" :disabled="!selectedChapterId || resetting" @click="handleReset">
          {{ resetting ? 'Resetting…' : 'Reset All in Chapter' }}
        </button>
      </div>
    </div>

    <!-- Confirm-before-generate / progress modal -->
    <div v-if="showBookModal" class="modal-overlay admin-modal-overlay" @click.self="closeBookModal">
      <div class="modal-box admin-modal">
        <h2>Generate All in Book</h2>

        <template v-if="!bookGenerating && !bookDone">
          <p>
            <strong>{{ bookModalStats.toGenerate }}</strong> verse audio file{{ bookModalStats.toGenerate === 1 ? '' : 's' }}
            will be generated for <strong>{{ langLabel }}</strong> across
            <strong>{{ bookModalStats.chapterCount }}</strong> chapter{{ bookModalStats.chapterCount === 1 ? '' : 's' }}.
          </p>
          <p>
            <strong>{{ bookModalStats.alreadyReady }}</strong> verse{{ bookModalStats.alreadyReady === 1 ? ' is' : 's are' }}
            already generated and will be
            <strong>{{ regenerateAll ? 'regenerated' : 'skipped' }}</strong>.
          </p>
          <p v-if="bookModalStats.stale > 0" class="modal-note">
            {{ bookModalStats.stale }} verse{{ bookModalStats.stale === 1 ? '' : 's' }} {{ bookModalStats.stale === 1 ? 'has' : 'have' }} edited text since its audio was generated (stale) and will be regenerated.
          </p>
          <p v-if="bookModalStats.noText > 0" class="modal-note">
            {{ bookModalStats.noText }} verse{{ bookModalStats.noText === 1 ? '' : 's' }} have no {{ langLabel }} text and will be skipped.
          </p>
          <div class="modal-actions admin-modal-actions">
            <button class="btn-secondary admin-btn admin-btn--secondary" @click="closeBookModal">Cancel</button>
            <button class="btn-primary admin-btn admin-btn--primary" :disabled="bookModalStats.toGenerate === 0" @click="confirmGenerateAllInBook">Confirm &amp; Generate</button>
          </div>
        </template>

        <template v-else>
          <p>
            Chapter <strong>{{ bookProgress.chapterDone }}/{{ bookProgress.chapterTotal }}</strong>
            (currently chapter {{ bookProgress.currentChapterNumber ?? '—' }})
          </p>
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: chapterPercent + '%' }"></div>
          </div>
          <p>
            Verse <strong>{{ bookProgress.verseDone }}/{{ bookProgress.verseTotal }}</strong> in current chapter
          </p>
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: versePercent + '%' }"></div>
          </div>
          <p v-if="bookDone" class="modal-note success">Done! Generated {{ bookModalStats.toGenerate }} verse audio file{{ bookModalStats.toGenerate === 1 ? '' : 's' }}.</p>
          <div class="modal-actions admin-modal-actions">
            <button v-if="bookGenerating" class="btn-secondary admin-btn admin-btn--secondary" @click="bookStopRequested = true">Stop</button>
            <button v-else class="btn-primary admin-btn admin-btn--primary" @click="closeBookModal">Close</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Generate All Books modal -->
    <div v-if="showAllBooksModal" class="modal-overlay admin-modal-overlay" @click.self="closeAllBooksModal">
      <div class="modal-box modal-box--wide admin-modal">
        <h2>Generate All Books</h2>

        <template v-if="allBooksModalLoading">
          <p>Scanning all books for audio status…</p>
          <p v-if="allBooksScanning.total > 0" class="modal-scanning-progress">
            Book <strong>{{ allBooksScanning.done }}/{{ allBooksScanning.total }}</strong>
            <span v-if="allBooksScanning.currentBookName"> — {{ allBooksScanning.currentBookName }}</span>
          </p>
          <div class="progress-bar">
            <div class="progress-bar-fill progress-bar-fill--green" :style="{ width: Math.round((allBooksScanning.done / (allBooksScanning.total || 1)) * 100) + '%' }"></div>
          </div>
          <div class="modal-actions admin-modal-actions">
            <button class="btn-secondary admin-btn admin-btn--secondary" @click="closeAllBooksModal">Cancel</button>
          </div>
        </template>

        <template v-else-if="!allBooksGenerating && !allBooksDone">
          <p>
            <strong>{{ allBooksModalStats.toGenerate }}</strong> verse audio file{{ allBooksModalStats.toGenerate === 1 ? '' : 's' }}
            will be generated for <strong>{{ langLabel }}</strong> across
            <strong>{{ allBooksModalStats.bookCount }}</strong> book{{ allBooksModalStats.bookCount === 1 ? '' : 's' }} and
            <strong>{{ allBooksModalStats.chapterCount }}</strong> chapter{{ allBooksModalStats.chapterCount === 1 ? '' : 's' }}.
          </p>
          <p>
            <strong>{{ allBooksModalStats.alreadyReady }}</strong> verse{{ allBooksModalStats.alreadyReady === 1 ? ' is' : 's are' }}
            already generated and will be
            <strong>{{ regenerateAll ? 'regenerated' : 'skipped' }}</strong>.
          </p>
          <p v-if="allBooksModalStats.stale > 0" class="modal-note">
            {{ allBooksModalStats.stale }} verse{{ allBooksModalStats.stale === 1 ? '' : 's' }} {{ allBooksModalStats.stale === 1 ? 'has' : 'have' }} stale audio and will be regenerated.
          </p>
          <p v-if="allBooksModalStats.noText > 0" class="modal-note">
            {{ allBooksModalStats.noText }} verse{{ allBooksModalStats.noText === 1 ? '' : 's' }} have no {{ langLabel }} text and will be skipped.
          </p>
          <div class="modal-actions admin-modal-actions">
            <button class="btn-secondary admin-btn admin-btn--secondary" @click="closeAllBooksModal">Cancel</button>
            <button class="btn-primary admin-btn admin-btn--primary" :disabled="allBooksModalStats.toGenerate === 0" @click="confirmGenerateAllBooks">Confirm &amp; Generate</button>
          </div>
        </template>

        <template v-else>
          <p>
            Book <strong>{{ allBooksProgress.bookDone }}/{{ allBooksProgress.bookTotal }}</strong>
            <span v-if="allBooksProgress.currentBookName" class="progress-label"> — {{ allBooksProgress.currentBookName }}</span>
          </p>
          <div class="progress-bar">
            <div class="progress-bar-fill progress-bar-fill--green" :style="{ width: allBooksBookPercent + '%' }"></div>
          </div>
          <p>
            Chapter <strong>{{ allBooksProgress.chapterDone }}/{{ allBooksProgress.chapterTotal }}</strong>
            <span v-if="allBooksProgress.currentChapterNumber" class="progress-label"> — ch. {{ allBooksProgress.currentChapterNumber }}</span>
          </p>
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: allBooksChapterPercent + '%' }"></div>
          </div>
          <p>
            Verse <strong>{{ allBooksProgress.verseDone }}/{{ allBooksProgress.verseTotal }}</strong> in current chapter
          </p>
          <div class="progress-bar">
            <div class="progress-bar-fill progress-bar-fill--teal" :style="{ width: allBooksVersePercent + '%' }"></div>
          </div>
          <p v-if="allBooksDone" class="modal-note success">
            Done! Generated {{ allBooksModalStats.toGenerate }} verse audio file{{ allBooksModalStats.toGenerate === 1 ? '' : 's' }} across {{ allBooksModalStats.bookCount }} book{{ allBooksModalStats.bookCount === 1 ? '' : 's' }}.
          </p>
          <div class="modal-actions admin-modal-actions">
            <button v-if="allBooksGenerating" class="btn-secondary admin-btn admin-btn--secondary" @click="allBooksStopRequested = true">Stop</button>
            <button v-else class="btn-primary admin-btn admin-btn--primary" @click="closeAllBooksModal">Close</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Status -->
    <div v-if="loadError" class="state-msg error admin-state admin-state--error">{{ loadError }}</div>
    <div v-else-if="!selectedChapterId" class="state-msg admin-state">Pick a book and chapter to view its verses.</div>
    <div v-else-if="loading" class="state-msg admin-state">Loading verses…</div>
    <div v-else-if="rows.length === 0" class="state-msg admin-state">No verses in this chapter.</div>

    <!-- Table -->
    <div v-else class="table-wrap admin-table-wrap">
      <table class="verses-table admin-table">
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
              <span
                class="status-badge admin-badge"
                :class="row.status === 'ready' ? 'admin-badge--success' : row.status === 'stale' ? 'admin-badge--warning' : row.status === 'failed' ? 'admin-badge--error' : 'admin-badge--neutral'"
              >{{ row.status ?? 'not generated' }}</span>
              <div v-if="row.error" class="row-error" :title="row.error">{{ truncate(row.error, 80) }}</div>
            </td>
            <td class="listen-cell">
              <audio v-if="row.audioUrl" :src="row.audioUrl" controls preload="none"></audio>
              <span v-else>—</span>
            </td>
            <td class="actions-cell">
              <button
                class="action-btn admin-btn admin-btn--secondary admin-btn--sm"
                :disabled="!row.sourceText || row.generating"
                @click="generateOne(row, row.status === 'ready' || row.status === 'stale')"
              >
                {{ row.generating ? '…' : row.status === 'ready' || row.status === 'failed' || row.status === 'stale' ? 'Regenerate' : 'Generate' }}
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

const bookGenerating = ref(false);
const bookStopRequested = ref(false);
const bookProgress = ref({
  chapterDone: 0,
  chapterTotal: 0,
  verseDone: 0,
  verseTotal: 0,
  currentChapterNumber: null as number | null,
});

const showBookModal = ref(false);
const bookModalLoading = ref(false);
const bookDone = ref(false);
const bookModalStats = ref({
  chapterCount: 0,
  toGenerate: 0,
  alreadyReady: 0,
  stale: 0,
  noText: 0,
});

const chapterPercent = computed(() =>
  bookProgress.value.chapterTotal === 0 ? 0 : Math.round((bookProgress.value.chapterDone / bookProgress.value.chapterTotal) * 100)
);
const versePercent = computed(() =>
  bookProgress.value.verseTotal === 0 ? 0 : Math.round((bookProgress.value.verseDone / bookProgress.value.verseTotal) * 100)
);

// ── All-books generation ──────────────────────────────────────────────
const allBooksGenerating = ref(false);
const allBooksStopRequested = ref(false);
const showAllBooksModal = ref(false);
const allBooksModalLoading = ref(false);
const allBooksDone = ref(false);
const allBooksScanning = ref({ done: 0, total: 0, currentBookName: '' });
const allBooksModalStats = ref({
  bookCount: 0,
  chapterCount: 0,
  toGenerate: 0,
  alreadyReady: 0,
  stale: 0,
  noText: 0,
});
const allBooksProgress = ref({
  bookDone: 0,
  bookTotal: 0,
  chapterDone: 0,
  chapterTotal: 0,
  verseDone: 0,
  verseTotal: 0,
  currentBookName: null as string | null,
  currentChapterNumber: null as number | null,
});

const allBooksBookPercent = computed(() =>
  allBooksProgress.value.bookTotal === 0 ? 0 : Math.round((allBooksProgress.value.bookDone / allBooksProgress.value.bookTotal) * 100)
);
const allBooksChapterPercent = computed(() =>
  allBooksProgress.value.chapterTotal === 0 ? 0 : Math.round((allBooksProgress.value.chapterDone / allBooksProgress.value.chapterTotal) * 100)
);
const allBooksVersePercent = computed(() =>
  allBooksProgress.value.verseTotal === 0 ? 0 : Math.round((allBooksProgress.value.verseDone / allBooksProgress.value.verseTotal) * 100)
);

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

// Mirrors VerseAudioEndpoint::stripBracketedText() in RSTNE-apis/endpoints/verse-audio.php —
// drops any text wrapped in (), [], or {} (e.g. translator notes/asides) so the
// preview matches what's actually sent to TTS — that text is meant to be read
// silently, not spoken aloud.
function stripBracketedText(text: string): string {
  return text
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, '')
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
    previewText: sourceText ? stripInlineVerseRefs(stripBracketedText(stripHtmlKeepPaleo(sourceText))) : '',
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

async function openBookModal() {
  if (!selectedBookId.value || chapters.value.length === 0) return;
  bookModalLoading.value = true;
  try {
    let toGenerate = 0;
    let alreadyReady = 0;
    let stale = 0;
    let noText = 0;
    for (const chapter of chapters.value) {
      const [verses, audio] = await Promise.all([
        getVersesByChapterId(chapter.chapter_id),
        getChapterAudio(chapter.chapter_id, lang.value),
      ]);
      const audioByVerse = new Map(audio.map((a) => [a.verse_id, a]));
      for (const v of verses) {
        const sourceText = lang.value === 'en' ? v.verse : v.telugu_verse;
        if (!sourceText) {
          noText++;
          continue;
        }
        const status = audioByVerse.get(v.verse_id)?.status ?? null;
        if (status === 'stale') {
          stale++;
          toGenerate++;
        } else if (status === 'ready') {
          alreadyReady++;
          if (regenerateAll.value) toGenerate++;
        } else {
          toGenerate++;
        }
      }
    }
    bookModalStats.value = { chapterCount: chapters.value.length, toGenerate, alreadyReady, stale, noText };
    showBookModal.value = true;
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Failed to check book verses';
  } finally {
    bookModalLoading.value = false;
  }
}

function closeBookModal() {
  if (bookGenerating.value) return;
  showBookModal.value = false;
  bookDone.value = false;
}

async function confirmGenerateAllInBook() {
  bookDone.value = false;
  await generateAllInBook();
}

async function generateAllInBook() {
  if (!selectedBookId.value || chapters.value.length === 0) return;
  bookGenerating.value = true;
  bookStopRequested.value = false;
  const orderedChapters = [...chapters.value].sort((a, b) => Number(a.chapter_number ?? 0) - Number(b.chapter_number ?? 0));
  bookProgress.value = {
    chapterDone: 0,
    chapterTotal: orderedChapters.length,
    verseDone: 0,
    verseTotal: 0,
    currentChapterNumber: null,
  };
  try {
    for (const chapter of orderedChapters) {
      if (bookStopRequested.value) break;
      bookProgress.value.currentChapterNumber = chapter.chapter_number != null ? Number(chapter.chapter_number) : null;

      // Keep the on-screen chapter/table in sync as we work through the book.
      const isCurrentlySelected = selectedChapterId.value === chapter.chapter_id;
      if (!isCurrentlySelected) {
        selectedChapterId.value = chapter.chapter_id;
      }
      await loadRows();

      const targets = rows.value.filter((r) => r.sourceText && (regenerateAll.value || r.status !== 'ready'));
      bookProgress.value.verseDone = 0;
      bookProgress.value.verseTotal = targets.length;
      for (const row of targets) {
        if (bookStopRequested.value) break;
        await generateOne(row, regenerateAll.value);
        bookProgress.value.verseDone++;
      }
      bookProgress.value.chapterDone++;
    }
  } finally {
    bookGenerating.value = false;
    bookDone.value = true;
  }
}

async function openAllBooksModal() {
  if (books.value.length === 0) return;
  allBooksModalLoading.value = true;
  allBooksDone.value = false;
  showAllBooksModal.value = true;
  allBooksScanning.value = { done: 0, total: books.value.length, currentBookName: '' };
  try {
    let totalChapters = 0;
    let toGenerate = 0;
    let alreadyReady = 0;
    let stale = 0;
    let noText = 0;
    for (const book of books.value) {
      if (!showAllBooksModal.value) break;
      allBooksScanning.value.currentBookName = book.book_name;
      const bookChapters = await getChaptersByBookId(book.book_id);
      totalChapters += bookChapters.length;
      for (const chapter of bookChapters) {
        if (!showAllBooksModal.value) break;
        const [verses, audio] = await Promise.all([
          getVersesByChapterId(chapter.chapter_id),
          getChapterAudio(chapter.chapter_id, lang.value),
        ]);
        const audioByVerse = new Map(audio.map((a) => [a.verse_id, a]));
        for (const v of verses) {
          const sourceText = lang.value === 'en' ? v.verse : v.telugu_verse;
          if (!sourceText) { noText++; continue; }
          const status = audioByVerse.get(v.verse_id)?.status ?? null;
          if (status === 'stale') { stale++; toGenerate++; }
          else if (status === 'ready') { alreadyReady++; if (regenerateAll.value) toGenerate++; }
          else { toGenerate++; }
        }
      }
      allBooksScanning.value.done++;
    }
    if (showAllBooksModal.value) {
      allBooksModalStats.value = { bookCount: books.value.length, chapterCount: totalChapters, toGenerate, alreadyReady, stale, noText };
    }
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Failed to scan books';
    showAllBooksModal.value = false;
  } finally {
    allBooksModalLoading.value = false;
  }
}

function closeAllBooksModal() {
  if (allBooksGenerating.value) return;
  showAllBooksModal.value = false;
  allBooksModalLoading.value = false;
  allBooksDone.value = false;
}

async function confirmGenerateAllBooks() {
  allBooksDone.value = false;
  await generateAllBooks();
}

async function generateAllBooks() {
  if (books.value.length === 0) return;
  allBooksGenerating.value = true;
  allBooksStopRequested.value = false;
  allBooksProgress.value = {
    bookDone: 0,
    bookTotal: books.value.length,
    chapterDone: 0,
    chapterTotal: 0,
    verseDone: 0,
    verseTotal: 0,
    currentBookName: null,
    currentChapterNumber: null,
  };
  try {
    for (const book of books.value) {
      if (allBooksStopRequested.value) break;
      allBooksProgress.value.currentBookName = book.book_name;
      const bookChapters = await getChaptersByBookId(book.book_id);
      const orderedChapters = [...bookChapters].sort((a, b) => Number(a.chapter_number ?? 0) - Number(b.chapter_number ?? 0));
      allBooksProgress.value.chapterDone = 0;
      allBooksProgress.value.chapterTotal = orderedChapters.length;
      for (const chapter of orderedChapters) {
        if (allBooksStopRequested.value) break;
        allBooksProgress.value.currentChapterNumber = chapter.chapter_number != null ? Number(chapter.chapter_number) : null;
        if (selectedChapterId.value !== chapter.chapter_id) {
          selectedChapterId.value = chapter.chapter_id;
        }
        await loadRows();
        const targets = rows.value.filter((r) => r.sourceText && (regenerateAll.value || r.status !== 'ready'));
        allBooksProgress.value.verseDone = 0;
        allBooksProgress.value.verseTotal = targets.length;
        for (const row of targets) {
          if (allBooksStopRequested.value) break;
          await generateOne(row, regenerateAll.value);
          allBooksProgress.value.verseDone++;
        }
        allBooksProgress.value.chapterDone++;
      }
      allBooksProgress.value.bookDone++;
    }
  } finally {
    allBooksGenerating.value = false;
    allBooksDone.value = true;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

onMounted(loadBooks);
</script>

<style scoped>
/* Layout, colors, fonts, buttons, table, badges, and modal chrome come from the
   shared .admin-page / .admin-btn / .admin-table / .admin-badge / .admin-modal
   classes (src/assets/admin-ui.css). Only this page's own layout tweaks and
   the progress-bar styling (unique to this page) live here. */

.audio-generator {
  max-width: 1200px;
  margin: 0 auto;
}

.filters-bar {
  align-items: flex-end;
  gap: var(--space-4);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}

.filter-group {
  margin-bottom: 0;
}

.filter-group select {
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
  color: var(--color-foreground);
  white-space: nowrap;
}

.btn-all-books {
  background: var(--color-success);
}
.btn-all-books:hover:not(:disabled) { filter: brightness(0.9); }

.modal-box p {
  margin: 0 0 0.75rem;
  line-height: 1.5;
  color: var(--color-foreground);
}

.modal-note {
  font-size: 0.85rem;
  color: var(--color-note-title);
  background: var(--color-note-bg);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-default);
}
.modal-note.success {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-4);
}
.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--ease-default);
}
.progress-bar-fill--green { background: var(--color-success); }
.progress-bar-fill--teal { background: var(--color-primary-hover); }

.modal-box--wide { max-width: 540px; }
.modal-scanning-progress { color: var(--color-foreground); font-size: 0.9rem; margin-bottom: 0.25rem !important; }
.progress-label { color: var(--color-muted-foreground); font-size: 0.875rem; }

.verses-table thead th {
  white-space: nowrap;
}

.verse-row { transition: background var(--duration-fast) var(--ease-default); }

.verses-table td {
  vertical-align: top;
}

.idx-cell { white-space: nowrap; color: var(--color-muted-foreground); font-weight: 600; }
.text-cell { line-height: 1.45; color: var(--color-foreground); max-width: 480px; text-align: left; }
.no-text { color: var(--color-muted-foreground); font-style: italic; }

.status-cell { white-space: nowrap; }

.row-error {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-error);
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.listen-cell audio { height: 32px; max-width: 220px; }

.actions-cell { white-space: nowrap; }

@media (max-width: 640px) {
  .filter-actions { margin-left: 0; }
}
</style>
