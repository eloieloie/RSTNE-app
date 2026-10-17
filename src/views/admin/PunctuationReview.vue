<template>
  <div class="punctuation-review admin-page">
    <header class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">✍️ Punctuation Review</h1>
        <p class="subtitle admin-subtitle">
          Long verses with few commas or periods, worst first (characters per punctuation mark).
          Edit the text here, or mark a verse reviewed if it is fine as it is.
        </p>
      </div>
      <router-link to="/admin" class="admin-back-link">← Back to Dashboard</router-link>
    </header>

    <div class="filters-bar admin-toolbar admin-card">
      <div class="filter-group admin-form-group">
        <label class="admin-label">Language</label>
        <select v-model="lang" class="admin-select" @change="onLangChange">
          <option value="en">English</option>
          <option value="te">Telugu</option>
        </select>
      </div>
      <div class="filter-group admin-form-group">
        <label class="admin-label">Min length (chars)</label>
        <input v-model.number="minLength" type="number" min="1" class="admin-input num" @change="load" />
      </div>
      <div class="filter-group admin-form-group">
        <label class="admin-label">Min chars per mark</label>
        <input v-model.number="minRatio" type="number" min="1" class="admin-input num" @change="load" />
      </div>
      <div class="filter-group admin-form-group">
        <label class="admin-label">Show</label>
        <select v-model="reviewedFilter" class="admin-select" @change="load">
          <option value="0">To review</option>
          <option value="1">Reviewed</option>
          <option value="all">All</option>
        </select>
      </div>
      <div class="filter-group grow admin-form-group">
        <label class="admin-label">Search</label>
        <input v-model="search" type="text" placeholder="Filter by reference or text…" class="admin-input" />
      </div>
      <div class="filter-stats">
        <span class="stat-badge admin-badge admin-badge--warning">{{ total }} flagged</span>
        <span v-if="items.length < total" class="stat-badge admin-badge admin-badge--neutral" title="Only the 1000 worst are loaded; fix or review these, then reload.">{{ items.length }} loaded</span>
        <span class="stat-badge admin-badge admin-badge--info">{{ filtered.length }} shown</span>
      </div>
    </div>

    <div v-if="loading" class="state-msg admin-state">Loading…</div>
    <div v-else-if="error" class="state-msg admin-state admin-state--error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg admin-state">🎉 No verses match these thresholds.</div>
    <div v-else-if="filtered.length === 0" class="state-msg admin-state">No verses match the current search.</div>

    <div v-else class="review-list admin-list">
      <article v-for="item in filtered" :key="item.verse_id" class="review-card admin-list-item">
        <header class="card-header">
          <div class="card-ref">
            <span class="ref-book" :class="{ orphaned: !item.book_name }">
              {{ item.book_name || `Book #${item.book_id} (missing)` }}
            </span>
            <span class="ref-loc">{{ item.chapter_number }}:{{ item.verse_index ?? '—' }}</span>
            <span class="admin-badge admin-badge--warning" :title="`${item.length} characters, ${item.punct_count} punctuation marks`">
              {{ item.ratio }} chars/mark
            </span>
            <span v-if="item.reviewed" class="admin-badge admin-badge--success">reviewed</span>
            <span v-if="rowState[item.verse_id]?.saved" class="admin-badge admin-badge--success">✓ saved</span>
          </div>
          <div class="card-actions">
            <template v-if="editingId === item.verse_id">
              <button class="admin-btn admin-btn--primary admin-btn--sm" :disabled="busyId === item.verse_id" @click="save(item)">💾 Save</button>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" :disabled="busyId === item.verse_id" @click="cancelEdit">Cancel</button>
            </template>
            <template v-else>
              <button class="admin-btn admin-btn--secondary admin-btn--sm" @click="startEdit(item)">✏️ Edit</button>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" :disabled="busyId === item.verse_id" @click="toggleReviewed(item)">
                {{ item.reviewed ? 'Unmark reviewed' : '✓ Mark reviewed' }}
              </button>
              <button v-if="item.book_name" class="admin-btn admin-btn--ghost admin-btn--sm" title="Open in reading pane" @click="openVerse(item)">Open ↗</button>
            </template>
          </div>
        </header>

        <textarea
          v-if="editingId === item.verse_id"
          v-model="draft"
          class="admin-input edit-area"
          :class="{ telugu: lang === 'te' }"
          rows="5"
        ></textarea>
        <p v-else class="verse-text" :class="{ telugu: lang === 'te' }">{{ item.text }}</p>
        <p v-if="rowState[item.verse_id]?.error" class="row-error">{{ rowState[item.verse_id]?.error }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getPunctuationReview,
  setPunctuationReviewed,
  type PunctuationLang,
  type PunctuationReviewItem,
} from '@/api/punctuationReview';
import { updateVerse } from '@/api/verses';

const router = useRouter();

// Telugu is held to a stricter default — it should carry more punctuation, so
// shorter / denser verses are flagged too. Both stay adjustable per session.
const DEFAULTS: Record<PunctuationLang, { minLength: number; minRatio: number }> = {
  en: { minLength: 150, minRatio: 120 },
  te: { minLength: 100, minRatio: 80 },
};

const lang = ref<PunctuationLang>('en');
const minLength = ref(DEFAULTS.en.minLength);
const minRatio = ref(DEFAULTS.en.minRatio);
const reviewedFilter = ref<'0' | '1' | 'all'>('0');
const search = ref('');

const items = ref<PunctuationReviewItem[]>([]);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const busyId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const draft = ref('');
const rowState = ref<Record<number, { saved?: boolean; error?: string }>>({});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter((v) => {
    const ref = `${v.book_name ?? ''} ${v.chapter_number}:${v.verse_index ?? ''}`.toLowerCase();
    return v.text.toLowerCase().includes(q) || ref.includes(q);
  });
});

// Mirrors VersesEndpoint::punctuationReview() so a saved row re-scores in place.
function measure(text: string): { length: number; punct: number; ratio: number } {
  const clean = text
    .replace(/<[^>]*>/g, '')
    .replace(/#[A-Za-z]{4}\d+(?:\s+\d+(?:-\d+)?)?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const punct = (clean.match(/[,;:.?!।—–]/g) ?? []).length;
  const length = [...clean].length;
  return { length, punct, ratio: Math.round(length / Math.max(1, punct)) };
}

function onLangChange() {
  minLength.value = DEFAULTS[lang.value].minLength;
  minRatio.value = DEFAULTS[lang.value].minRatio;
  load();
}

async function load() {
  loading.value = true;
  error.value = '';
  editingId.value = null;
  rowState.value = {};
  try {
    const page = await getPunctuationReview({
      lang: lang.value,
      minLength: minLength.value || 150,
      minRatio: minRatio.value || 120,
      reviewed: reviewedFilter.value,
    });
    items.value = page.results;
    total.value = page.total;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load verses';
  } finally {
    loading.value = false;
  }
}

function startEdit(item: PunctuationReviewItem) {
  editingId.value = item.verse_id;
  draft.value = item.text;
}

function cancelEdit() {
  editingId.value = null;
}

async function save(item: PunctuationReviewItem) {
  busyId.value = item.verse_id;
  rowState.value[item.verse_id] = {};
  try {
    const payload = lang.value === 'te' ? { telugu_verse: draft.value } : { verse: draft.value };
    await updateVerse(item.verse_id, payload);
    const m = measure(draft.value);
    item.text = draft.value;
    item.length = m.length;
    item.punct_count = m.punct;
    item.ratio = m.ratio;
    rowState.value[item.verse_id] = { saved: true };
    editingId.value = null;
  } catch (e: unknown) {
    rowState.value[item.verse_id] = { error: e instanceof Error ? e.message : 'Save failed' };
  } finally {
    busyId.value = null;
  }
}

async function toggleReviewed(item: PunctuationReviewItem) {
  busyId.value = item.verse_id;
  rowState.value[item.verse_id] = {};
  try {
    const next = !item.reviewed;
    await setPunctuationReviewed(item.verse_id, lang.value, next);
    item.reviewed = next;
    // Drop the row once it no longer belongs in the current view.
    if (reviewedFilter.value !== 'all') {
      items.value = items.value.filter((v) => v.verse_id !== item.verse_id);
      total.value = Math.max(0, total.value - 1);
    }
  } catch (e: unknown) {
    rowState.value[item.verse_id] = { error: e instanceof Error ? e.message : 'Update failed' };
  } finally {
    busyId.value = null;
  }
}

function openVerse(item: PunctuationReviewItem) {
  router.push({
    name: 'book-chapter-verse',
    params: {
      bookName: (item.book_name as string).replace(/ /g, '-'),
      chapterNumber: String(item.chapter_number),
      ...(item.verse_index != null ? { verseNumber: String(item.verse_index) } : {}),
    },
  });
}

onMounted(load);
</script>

<style scoped>
/* Colors, header, badges, buttons, form fields and state messages come from the
   shared admin-ui.css classes; only this page's layout lives here. */

.punctuation-review {
  max-width: 1100px;
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
  gap: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-group.grow { flex: 1; min-width: 200px; }
.filter-group.grow input { width: 100%; }
.admin-input.num { width: 110px; }

.filter-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.review-list { display: flex; flex-direction: column; gap: 12px; }
.review-card { padding: 1rem 1.25rem; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

.card-ref { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ref-book { font-weight: 600; color: var(--color-foreground); }
.ref-book.orphaned { color: var(--color-warning); font-style: italic; }
.ref-loc { color: var(--color-muted-foreground); }

.card-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.verse-text {
  margin: 0;
  line-height: 1.6;
  color: var(--color-foreground);
  white-space: pre-wrap;
}

.edit-area { width: 100%; line-height: 1.6; resize: vertical; }
.telugu { line-height: 1.9; }

.row-error { color: var(--color-error, #b91c1c); margin: 0.5rem 0 0; font-size: 0.875rem; }

@media (max-width: 640px) {
  .filter-stats { margin-left: 0; }
}
</style>
