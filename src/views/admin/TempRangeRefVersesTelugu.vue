<template>
  <div class="range-ref-audio admin-page">
    <header class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">🩹 Range-Ref Audio — Telugu (TEMP)</h1>
        <p class="subtitle admin-subtitle">
          Already-generated (<strong>ready</strong>) Telugu audio whose source text has an inline
          cross-reference with a range, like <code>#Gene9 11-17</code>, generated before the fix for
          the "-17" tail being spoken/cut off incorrectly. Regenerate below. Temporary QA page —
          delete once every row here has been regenerated.
        </p>
      </div>
      <router-link to="/admin" class="back-link admin-back-link">← Back to Dashboard</router-link>
    </header>

    <div class="filters-bar">
      <div class="filter-group grow admin-form-group">
        <label class="admin-label">Search</label>
        <input v-model="search" type="text" placeholder="Filter by verse text or reference…" class="admin-input" />
      </div>
      <div class="filter-actions">
        <button class="btn-primary admin-btn admin-btn--primary" :disabled="regenerating || pendingItems.length === 0" @click="regenerateAll">
          {{ regenerating ? `Regenerating ${progress.done}/${progress.total}…` : `Regenerate All (${pendingItems.length})` }}
        </button>
        <button v-if="regenerating" class="btn-secondary admin-btn admin-btn--secondary" @click="stopRequested = true">Stop</button>
      </div>
      <div class="filter-stats">
        <span class="stat-badge admin-badge admin-badge--error">{{ items.length }} flagged</span>
        <span class="stat-badge admin-badge admin-badge--success">{{ fixedCount }} regenerated</span>
        <span class="stat-badge admin-badge admin-badge--info">{{ filtered.length }} shown</span>
      </div>
    </div>

    <div v-if="loading" class="state-msg admin-state">Loading…</div>
    <div v-else-if="error" class="state-msg error admin-state admin-state--error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg admin-state">🎉 No affected Telugu audio found.</div>
    <div v-else-if="filtered.length === 0" class="state-msg admin-state">No rows match the current filter.</div>

    <div v-else class="table-wrap admin-table-wrap">
      <table class="verses-table admin-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Telugu Text</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.audio_id" class="verse-row">
            <td class="ref-cell">
              <span class="ref-book" :class="{ orphaned: !row.book_name }">
                {{ row.book_name || `Book #${row.book_id} (missing)` }}
              </span>
              <span class="ref-loc">{{ row.chapter_number }}:{{ row.verse_index ?? '—' }}</span>
            </td>
            <td class="text-cell" v-html="highlight(row.text)"></td>
            <td class="status-cell">
              <span v-if="row.state === 'fixed'" class="admin-badge admin-badge--success">✓ regenerated</span>
              <span v-else-if="row.state === 'regenerating'" class="admin-badge admin-badge--info">regenerating…</span>
              <span v-else-if="row.state === 'error'" class="admin-badge admin-badge--error" :title="row.errorMessage ?? undefined">failed</span>
              <span v-else class="admin-badge admin-badge--warning">pending</span>
            </td>
            <td class="actions-cell">
              <button
                class="action-btn admin-btn admin-btn--ghost admin-btn--sm"
                :disabled="row.state === 'regenerating' || regenerating"
                @click="regenerateOne(row)"
              >{{ row.state === 'fixed' ? 'Regenerate Again' : 'Regenerate' }}</button>
              <button
                v-if="row.book_name"
                class="action-btn admin-btn admin-btn--ghost admin-btn--sm"
                title="Open in reading pane"
                @click="openVerse(row)"
              >Open ↗</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getRangeRefAudioCount, generateVerseAudio, type RangeRefAudioItem } from '@/api/verseAudio';

type RowState = 'pending' | 'regenerating' | 'fixed' | 'error';
interface Row extends RangeRefAudioItem {
  state: RowState;
  errorMessage: string | null;
}

const LANG = 'te' as const;

const router = useRouter();

const items = ref<Row[]>([]);
const loading = ref(false);
const error = ref('');
const search = ref('');
const regenerating = ref(false);
const stopRequested = ref(false);
const progress = ref({ done: 0, total: 0 });

const fixedCount = computed(() => items.value.filter(r => r.state === 'fixed').length);
const pendingItems = computed(() => items.value.filter(r => r.state === 'pending' || r.state === 'error'));

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter(row => {
    const ref = `${row.book_name ?? ''} ${row.chapter_number}:${row.verse_index ?? ''}`.toLowerCase();
    return row.text.toLowerCase().includes(q) || ref.includes(q);
  });
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const rangeRefPattern = /#[a-zA-Z]{4}\d+\s+\d+-\d+/g;

function highlight(text: string): string {
  return escapeHtml(text).replace(rangeRefPattern, (match) => `<mark class="range-ref-hit">${match}</mark>`);
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const result = await getRangeRefAudioCount();
    items.value = result.audio[LANG].map(a => ({ ...a, state: 'pending' as RowState, errorMessage: null }));
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load affected audio';
  } finally {
    loading.value = false;
  }
}

async function regenerateOne(row: Row) {
  row.state = 'regenerating';
  row.errorMessage = null;
  try {
    await generateVerseAudio(row.verse_id, LANG, true);
    row.state = 'fixed';
  } catch (e: unknown) {
    row.state = 'error';
    row.errorMessage = e instanceof Error ? e.message : 'Regeneration failed';
  }
}

async function regenerateAll() {
  regenerating.value = true;
  stopRequested.value = false;
  const targets = pendingItems.value;
  progress.value = { done: 0, total: targets.length };
  for (const row of targets) {
    if (stopRequested.value) break;
    await regenerateOne(row);
    progress.value.done++;
  }
  regenerating.value = false;
}

function openVerse(row: Row) {
  router.push({
    name: 'book-chapter-verse',
    params: {
      bookName: (row.book_name as string).replace(/ /g, '-'),
      chapterNumber: String(row.chapter_number),
      ...(row.verse_index != null ? { verseNumber: String(row.verse_index) } : {}),
    },
  });
}

onMounted(load);
</script>

<style scoped>
/* Colors, fonts, page header, table, badges, buttons, form fields, and state
   messages come from the shared .admin-page / .admin-table / .admin-badge /
   .admin-btn / .admin-form-group / .admin-state classes (src/assets/admin-ui.css).
   Only this page's own layout sizing and highlight-mark styling live here. */

.range-ref-audio {
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.filters-bar {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-group.grow { flex: 1; min-width: 200px; }
.filter-group.grow input { width: 100%; }

.filter-actions { display: flex; align-items: flex-end; gap: 8px; }

.filter-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.verse-row { transition: background 0.1s; }
.verse-row:hover { background: var(--color-background-alt); }

.ref-cell { white-space: nowrap; }
.ref-book { font-weight: 600; color: var(--color-foreground); }
.ref-book.orphaned { color: var(--color-warning); font-style: italic; }
.ref-loc { color: var(--color-muted-foreground); margin-left: 6px; }

.text-cell { line-height: 1.45; color: var(--color-foreground); max-width: 560px; }

.text-cell :deep(.range-ref-hit) {
  background: var(--color-warning-background, #fef3c7);
  color: var(--color-warning, #92400e);
  border-radius: 4px;
  padding: 0 3px;
  font-weight: 600;
}

.status-cell { white-space: nowrap; }

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .filter-stats { margin-left: 0; }
}
</style>
