<template>
  <div class="chapter-ann admin-page">
    <header class="admin-page-header">
      <div>
        <h1 class="admin-title">🔔 Chapter Announcements</h1>
        <p class="admin-subtitle">
          Generate pre-recorded audio for chapter headings (e.g. "Chapter 1" / "అధ్యాయం 1")
          played automatically when audio continues to the next chapter.
        </p>
      </div>
      <router-link to="/admin" class="admin-back-link">← Dashboard</router-link>
    </header>

    <!-- Controls -->
    <div class="controls-bar admin-toolbar">
      <div class="filter-group admin-form-group">
        <label class="admin-label">Book</label>
        <select v-model.number="selectedBookId" @change="loadBook" class="admin-select">
          <option :value="null">Select a book…</option>
          <option v-for="b in books" :key="b.book_id" :value="b.book_id">{{ b.book_name }}</option>
        </select>
      </div>

      <div v-if="rows.length" class="batch-buttons">
        <button class="btn-primary admin-btn admin-btn--primary" :disabled="batchRunning" @click="batchGenerate('en')">
          {{ batchLang === 'en' ? `EN ${batchProgress.done}/${batchProgress.total}…` : 'Generate All EN' }}
        </button>
        <button class="btn-primary te admin-btn admin-btn--primary" :disabled="batchRunning" @click="batchGenerate('te')">
          {{ batchLang === 'te' ? `TE ${batchProgress.done}/${batchProgress.total}…` : 'Generate All TE' }}
        </button>
        <button class="btn-primary he admin-btn admin-btn--primary" :disabled="batchRunning" @click="batchGenerate('he')">
          {{ batchLang === 'he' ? `HE ${batchProgress.done}/${batchProgress.total}…` : 'Generate All HE' }}
        </button>
        <button v-if="batchRunning" class="btn-secondary admin-btn admin-btn--secondary" @click="stopBatch = true">Stop</button>
        <button class="btn-danger admin-btn admin-btn--danger" :disabled="batchRunning || flushing" @click="flushAll">
          {{ flushing ? 'Clearing…' : 'Flush All' }}
        </button>
      </div>
    </div>

    <!-- Generation error banner -->
    <div v-if="lastError" class="error-banner">
      {{ lastError }}
      <button class="dismiss-btn admin-btn admin-btn--ghost admin-btn--sm" aria-label="Dismiss error" @click="lastError = ''">✕</button>
    </div>

    <!-- States -->
    <div v-if="loadError" class="state-msg error admin-state admin-state--error">{{ loadError }}</div>
    <div v-else-if="!selectedBookId" class="state-msg admin-state">Select a book above.</div>
    <div v-else-if="loadingRows" class="state-msg admin-state">Loading chapters…</div>
    <div v-else-if="rows.length === 0" class="state-msg admin-state">No chapters for this book.</div>

    <!-- Table -->
    <div v-else class="table-wrap admin-table-wrap">
      <table class="ann-table admin-table">
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
              <span v-else-if="row.en_status" class="admin-badge" :class="row.en_status === 'failed' ? 'admin-badge--error' : 'admin-badge--neutral'">{{ row.en_status }}</span>
              <span v-else class="muted">—</span>
              <div v-if="row.en_error" class="row-error" :title="row.en_error">{{ truncate(row.en_error, 60) }}</div>
            </td>
            <td>
              <audio v-if="row.en_audio_url" :src="row.en_audio_url" controls preload="none" class="mini-audio"></audio>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <button
                class="btn-xs admin-btn admin-btn--primary admin-btn--sm"
                :aria-label="row.en_status === 'ready' ? `Regenerate English announcement for chapter ${row.chapter_number}` : `Generate English announcement for chapter ${row.chapter_number}`"
                :disabled="batchRunning || busyMap[row.chapter_id]"
                @click="generateOne(row.chapter_id, 'en')"
              >
                {{ busyMap[row.chapter_id] === 'en' ? '…' : row.en_status === 'ready' ? '↺' : '▶' }}
              </button>
            </td>

            <!-- Telugu -->
            <td>
              <span v-if="row.te_status === 'ready'" class="dot ready" title="Ready"></span>
              <span v-else-if="row.te_status" class="admin-badge" :class="row.te_status === 'failed' ? 'admin-badge--error' : 'admin-badge--neutral'">{{ row.te_status }}</span>
              <span v-else class="muted">—</span>
              <div v-if="row.te_error" class="row-error" :title="row.te_error">{{ truncate(row.te_error, 60) }}</div>
            </td>
            <td>
              <audio v-if="row.te_audio_url" :src="row.te_audio_url" controls preload="none" class="mini-audio"></audio>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <button
                class="btn-xs te admin-btn admin-btn--primary admin-btn--sm"
                :aria-label="row.te_status === 'ready' ? `Regenerate Telugu announcement for chapter ${row.chapter_number}` : `Generate Telugu announcement for chapter ${row.chapter_number}`"
                :disabled="batchRunning || busyMap[row.chapter_id]"
                @click="generateOne(row.chapter_id, 'te')"
              >
                {{ busyMap[row.chapter_id] === 'te' ? '…' : row.te_status === 'ready' ? '↺' : '▶' }}
              </button>
            </td>

            <!-- Hebrew -->
            <td>
              <span v-if="row.he_status === 'ready'" class="dot ready" title="Ready"></span>
              <span v-else-if="row.he_status" class="admin-badge" :class="row.he_status === 'failed' ? 'admin-badge--error' : 'admin-badge--neutral'">{{ row.he_status }}</span>
              <span v-else class="muted">—</span>
              <div v-if="row.he_error" class="row-error" :title="row.he_error">{{ truncate(row.he_error, 60) }}</div>
            </td>
            <td>
              <audio v-if="row.he_audio_url" :src="row.he_audio_url" controls preload="none" class="mini-audio"></audio>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <button
                class="btn-xs he admin-btn admin-btn--primary admin-btn--sm"
                :aria-label="row.he_status === 'ready' ? `Regenerate Hebrew announcement for chapter ${row.chapter_number}` : `Generate Hebrew announcement for chapter ${row.chapter_number}`"
                :disabled="batchRunning || busyMap[row.chapter_id]"
                @click="generateOne(row.chapter_id, 'he')"
              >
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
/* Layout, colors, fonts, buttons, table, and badge chrome come from the shared
   .admin-page / .admin-btn / .admin-table / .admin-badge classes
   (src/assets/admin-ui.css). Only this page's own compact-table tweaks
   (status dot, mini audio players, per-language accent colors) live here. */

.chapter-ann { max-width: 1200px; margin: 0 auto; }

.controls-bar {
  align-items: flex-end;
  padding: var(--space-4);
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
}
.filter-group select { min-width: 200px; }

.batch-buttons { display: flex; gap: 0.5rem; align-items: flex-end; flex-wrap: wrap; }

.btn-primary.te { background: var(--color-success); }
.btn-primary.te:hover:not(:disabled) { filter: brightness(0.9); }
.btn-primary.he { background: var(--color-primary-hover); }

.btn-danger { margin-left: auto; }

.error-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: var(--space-2) var(--space-4); margin-bottom: var(--space-4);
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-default);
  color: var(--color-error);
  font-size: 0.85rem;
}
.dismiss-btn { color: var(--color-error); }
.dismiss-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--color-error) 16%, transparent); }

.table-wrap { overflow-x: auto; }
.ann-table tr.row-busy td { background: color-mix(in srgb, var(--color-warning) 12%, transparent); }
.sub-header th { font-weight: 500; font-size: 0.75rem; color: var(--color-muted-foreground); background: var(--color-muted); }

.ch-cell { font-weight: 700; color: var(--color-foreground); }

.dot {
  display: inline-block; width: 10px; height: 10px; border-radius: 50%;
}
.dot.ready { background: var(--color-success); }

.row-error { font-size: 0.7rem; color: var(--color-error); margin-top: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.mini-audio { height: 28px; width: 160px; }
.muted { color: var(--color-muted-foreground); }

.btn-xs.te { background: var(--color-success); }
.btn-xs.he { background: var(--color-primary-hover); }

.summary { margin-top: 0.75rem; font-size: 0.8rem; color: var(--color-muted-foreground); text-align: right; }
</style>
