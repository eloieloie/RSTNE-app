<template>
  <div class="chapter-ann">
    <header class="page-header">
      <div>
        <h1>🔔 Chapter Announcements</h1>
        <p class="subtitle">
          Generate pre-recorded audio for chapter headings (e.g. "Chapter 1" / "అధ్యాయం 1")
          played automatically when audio continues to the next chapter.
        </p>
      </div>
      <router-link to="/admin" class="back-link">← Dashboard</router-link>
    </header>

    <!-- Controls -->
    <div class="controls-bar">
      <div class="filter-group">
        <label>Book</label>
        <select v-model.number="selectedBookId" @change="loadBook">
          <option :value="null">Select a book…</option>
          <option v-for="b in books" :key="b.book_id" :value="b.book_id">{{ b.book_name }}</option>
        </select>
      </div>

      <div v-if="rows.length" class="batch-buttons">
        <button class="btn-primary" :disabled="batchRunning" @click="batchGenerate('en')">
          {{ batchLang === 'en' ? `EN ${batchProgress.done}/${batchProgress.total}…` : 'Generate All EN' }}
        </button>
        <button class="btn-primary te" :disabled="batchRunning" @click="batchGenerate('te')">
          {{ batchLang === 'te' ? `TE ${batchProgress.done}/${batchProgress.total}…` : 'Generate All TE' }}
        </button>
        <button class="btn-primary he" :disabled="batchRunning" @click="batchGenerate('he')">
          {{ batchLang === 'he' ? `HE ${batchProgress.done}/${batchProgress.total}…` : 'Generate All HE' }}
        </button>
        <button v-if="batchRunning" class="btn-secondary" @click="stopBatch = true">Stop</button>
        <button class="btn-danger" :disabled="batchRunning || flushing" @click="flushAll">
          {{ flushing ? 'Clearing…' : 'Flush All' }}
        </button>
      </div>
    </div>

    <!-- Generation error banner -->
    <div v-if="lastError" class="error-banner">
      {{ lastError }}
      <button class="dismiss-btn" @click="lastError = ''">✕</button>
    </div>

    <!-- States -->
    <div v-if="loadError" class="state-msg error">{{ loadError }}</div>
    <div v-else-if="!selectedBookId" class="state-msg">Select a book above.</div>
    <div v-else-if="loadingRows" class="state-msg">Loading chapters…</div>
    <div v-else-if="rows.length === 0" class="state-msg">No chapters for this book.</div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="ann-table">
        <thead>
          <tr>
            <th>Ch</th>
            <th colspan="3">English</th>
            <th colspan="3">Telugu</th>
            <th colspan="3">Hebrew</th>
          </tr>
          <tr class="sub-header">
            <th></th>
            <th>Status</th><th>Preview</th><th></th>
            <th>Status</th><th>Preview</th><th></th>
            <th>Status</th><th>Preview</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.chapter_id" :class="{ 'row-busy': busyMap[row.chapter_id] }">
            <td class="ch-cell">{{ row.chapter_number }}</td>

            <!-- English -->
            <td>
              <span v-if="row.en_status === 'ready'" class="dot ready" title="Ready"></span>
              <span v-else-if="row.en_status" class="badge" :class="row.en_status">{{ row.en_status }}</span>
              <span v-else class="muted">—</span>
              <div v-if="row.en_error" class="row-error" :title="row.en_error">{{ truncate(row.en_error, 60) }}</div>
            </td>
            <td>
              <audio v-if="row.en_audio_url" :src="row.en_audio_url" controls preload="none" class="mini-audio"></audio>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <button class="btn-xs" :disabled="batchRunning || busyMap[row.chapter_id]" @click="generateOne(row.chapter_id, 'en')">
                {{ busyMap[row.chapter_id] === 'en' ? '…' : row.en_status === 'ready' ? '↺' : '▶' }}
              </button>
            </td>

            <!-- Telugu -->
            <td>
              <span v-if="row.te_status === 'ready'" class="dot ready" title="Ready"></span>
              <span v-else-if="row.te_status" class="badge" :class="row.te_status">{{ row.te_status }}</span>
              <span v-else class="muted">—</span>
              <div v-if="row.te_error" class="row-error" :title="row.te_error">{{ truncate(row.te_error, 60) }}</div>
            </td>
            <td>
              <audio v-if="row.te_audio_url" :src="row.te_audio_url" controls preload="none" class="mini-audio"></audio>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <button class="btn-xs te" :disabled="batchRunning || busyMap[row.chapter_id]" @click="generateOne(row.chapter_id, 'te')">
                {{ busyMap[row.chapter_id] === 'te' ? '…' : row.te_status === 'ready' ? '↺' : '▶' }}
              </button>
            </td>

            <!-- Hebrew -->
            <td>
              <span v-if="row.he_status === 'ready'" class="dot ready" title="Ready"></span>
              <span v-else-if="row.he_status" class="badge" :class="row.he_status">{{ row.he_status }}</span>
              <span v-else class="muted">—</span>
              <div v-if="row.he_error" class="row-error" :title="row.he_error">{{ truncate(row.he_error, 60) }}</div>
            </td>
            <td>
              <audio v-if="row.he_audio_url" :src="row.he_audio_url" controls preload="none" class="mini-audio"></audio>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <button class="btn-xs he" :disabled="batchRunning || busyMap[row.chapter_id]" @click="generateOne(row.chapter_id, 'he')">
                {{ busyMap[row.chapter_id] === 'he' ? '…' : row.he_status === 'ready' ? '↺' : '▶' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        EN ready: {{ enReady }}/{{ rows.length }} &nbsp;|&nbsp;
        TE ready: {{ teReady }}/{{ rows.length }} &nbsp;|&nbsp;
        HE ready: {{ heReady }}/{{ rows.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAllBooks } from '@/api/books';
import type { Book } from '@/utils/collectionReferences';
import type { VerseAudioLanguage } from '@/utils/collectionReferences';
import {
  listChapterAnnouncements,
  generateChapterAnnouncement,
  flushChapterAnnouncements,
  type ChapterAnnouncementSummary,
} from '@/api/chapterAnnouncements';

const books = ref<Book[]>([]);
const selectedBookId = ref<number | null>(null);
const rows = ref<ChapterAnnouncementSummary[]>([]);
const loadingRows = ref(false);
const loadError = ref('');

const busyMap = ref<Record<number, VerseAudioLanguage | false>>({});
const lastError = ref('');
const flushing = ref(false);

const batchRunning = ref(false);
const batchLang = ref<VerseAudioLanguage | null>(null);
const stopBatch = ref(false);
const batchProgress = ref({ done: 0, total: 0 });

const enReady = computed(() => rows.value.filter(r => r.en_status === 'ready').length);
const teReady = computed(() => rows.value.filter(r => r.te_status === 'ready').length);
const heReady = computed(() => rows.value.filter(r => r.he_status === 'ready').length);

onMounted(async () => {
  try {
    books.value = await getAllBooks();
  } catch {
    loadError.value = 'Failed to load books';
  }
});

async function loadBook() {
  if (!selectedBookId.value) { rows.value = []; return; }
  loadingRows.value = true;
  loadError.value = '';
  try {
    rows.value = await listChapterAnnouncements(selectedBookId.value);
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Load failed';
  } finally {
    loadingRows.value = false;
  }
}

async function flushAll() {
  if (!confirm('Delete ALL announcement audio files and clear the database table? This cannot be undone.')) return;
  flushing.value = true;
  lastError.value = '';
  try {
    await flushChapterAnnouncements();
    rows.value = rows.value.map(r => ({
      ...r,
      en_status: null, en_audio_url: null, en_dt_generated: null, en_error: null,
      te_status: null, te_audio_url: null, te_dt_generated: null, te_error: null,
      he_status: null, he_audio_url: null, he_dt_generated: null, he_error: null,
    }));
  } catch (e: unknown) {
    lastError.value = e instanceof Error ? e.message : 'Flush failed';
  } finally {
    flushing.value = false;
  }
}

async function generateOne(chapterId: number, lang: VerseAudioLanguage, force = true) {
  busyMap.value = { ...busyMap.value, [chapterId]: lang };
  const idx = rows.value.findIndex(r => r.chapter_id === chapterId);
  try {
    const result = await generateChapterAnnouncement(chapterId, lang, force);
    if (idx !== -1) {
      const row = { ...rows.value[idx] };
      // Append cache-buster so the audio element reloads the new file
      const ts = result.audio_url ? `?v=${Date.now()}` : '';
      if (lang === 'en') {
        row.en_status = result.status;
        row.en_audio_url = result.audio_url ? result.audio_url + ts : null;
        row.en_dt_generated = result.dt_generated ?? null;
        row.en_error = result.error_message ?? null;
      } else if (lang === 'te') {
        row.te_status = result.status;
        row.te_audio_url = result.audio_url ? result.audio_url + ts : null;
        row.te_dt_generated = result.dt_generated ?? null;
        row.te_error = result.error_message ?? null;
      } else {
        row.he_status = result.status;
        row.he_audio_url = result.audio_url ? result.audio_url + ts : null;
        row.he_dt_generated = result.dt_generated ?? null;
        row.he_error = result.error_message ?? null;
      }
      rows.value.splice(idx, 1, row);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed';
    lastError.value = `Ch ${chapterId} ${lang.toUpperCase()}: ${msg}`;
    if (idx !== -1) {
      const row = { ...rows.value[idx] };
      if (lang === 'en') row.en_error = msg;
      else if (lang === 'te') row.te_error = msg;
      else row.he_error = msg;
      rows.value.splice(idx, 1, row);
    }
  } finally {
    const m = { ...busyMap.value };
    delete m[chapterId];
    busyMap.value = m;
  }
}

async function batchGenerate(lang: VerseAudioLanguage) {
  if (batchRunning.value) return;
  const pending = rows.value.filter(r => {
    const status = lang === 'en' ? r.en_status : lang === 'te' ? r.te_status : r.he_status;
    return status !== 'ready';
  });
  if (!pending.length) return;

  batchRunning.value = true;
  batchLang.value = lang;
  stopBatch.value = false;
  batchProgress.value = { done: 0, total: pending.length };

  for (const row of pending) {
    if (stopBatch.value) break;
    await generateOne(row.chapter_id, lang, false);
    batchProgress.value.done++;
  }

  batchRunning.value = false;
  batchLang.value = null;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
</script>

<style scoped>
.chapter-ann { max-width: 960px; margin: 0 auto; padding: 1.5rem; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; margin-bottom: 1.5rem;
}
.page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
.subtitle { color: #666; font-size: 0.875rem; margin: 0; }
.back-link { color: #666; text-decoration: none; font-size: 0.875rem; white-space: nowrap; }
.back-link:hover { color: #333; }

.controls-bar {
  display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem;
  margin-bottom: 1.5rem; padding: 1rem;
  background: #f8f8f8; border-radius: 8px;
}
.filter-group { display: flex; flex-direction: column; gap: 0.25rem; }
.filter-group label { font-size: 0.75rem; font-weight: 600; color: #555; text-transform: uppercase; }
.filter-group select { padding: 0.45rem 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.875rem; min-width: 200px; }

.batch-buttons { display: flex; gap: 0.5rem; align-items: flex-end; flex-wrap: wrap; }

.btn-primary {
  padding: 0.45rem 1rem; background: #8B4513; color: white;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500;
}
.btn-primary.te { background: #1a6b3c; }
.btn-primary.he { background: #1d4e7a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-secondary {
  padding: 0.45rem 0.9rem; background: #eee; border: 1px solid #ccc;
  border-radius: 6px; font-size: 0.875rem; cursor: pointer;
}
.btn-danger {
  padding: 0.45rem 0.9rem; background: #dc3545; color: white;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500;
  margin-left: auto;
}
.btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }

.error-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 0.6rem 1rem; margin-bottom: 1rem;
  background: #fff0f0; border: 1px solid #f5c6cb; border-radius: 6px;
  color: #721c24; font-size: 0.85rem;
}
.dismiss-btn {
  background: none; border: none; cursor: pointer; color: #721c24;
  font-size: 0.85rem; padding: 0 0.25rem; line-height: 1;
}

.state-msg { padding: 2rem; text-align: center; color: #888; }
.state-msg.error { color: #c00; }

.table-wrap { overflow-x: auto; }
.ann-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.ann-table th { padding: 0.4rem 0.6rem; background: #f0f0f0; text-align: left; border-bottom: 1px solid #ddd; font-weight: 600; }
.ann-table td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; vertical-align: middle; }
.ann-table tr.row-busy td { background: #fafae8; }
.sub-header th { font-weight: 500; font-size: 0.75rem; color: #666; background: #f7f7f7; }

.ch-cell { font-weight: 700; color: #333; }

.dot {
  display: inline-block; width: 10px; height: 10px; border-radius: 50%;
}
.dot.ready { background: #28a745; }

.badge {
  display: inline-block; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
}
.badge.failed { background: #f8d7da; color: #721c24; }
.badge.pending { background: #e9ecef; color: #555; }

.row-error { font-size: 0.7rem; color: #c00; margin-top: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.mini-audio { height: 28px; width: 160px; }
.muted { color: #aaa; }

.btn-xs {
  padding: 0.2rem 0.55rem; font-size: 0.75rem; border-radius: 4px; cursor: pointer;
  background: #8B4513; color: white; border: none; font-weight: 600;
  transition: opacity 0.13s;
}
.btn-xs.te { background: #1a6b3c; }
.btn-xs.he { background: #1d4e7a; }
.btn-xs:disabled { opacity: 0.4; cursor: not-allowed; }

.summary { margin-top: 0.75rem; font-size: 0.8rem; color: #666; text-align: right; }
</style>
