<template>
  <div class="strongs-codes admin-page">
    <header class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">🔢 Strong's Codes</h1>
        <p class="subtitle admin-subtitle">
          Verses containing Strong's numbers (H6086, G1557…) that are bare or in (round) / {curly}
          brackets. Converting them to [square brackets] keeps them tappable and makes audio generation
          skip them. Adjacent codes share one bracket; parentheses holding other text are left alone.
          Saved verses are archived to history and their audio is marked stale.
        </p>
      </div>
      <router-link to="/admin" class="admin-back-link">← Back to Dashboard</router-link>
    </header>

    <div class="filters-bar admin-toolbar admin-card">
      <div class="filter-group admin-form-group">
        <label class="admin-label">Language</label>
        <select v-model="lang" class="admin-select" @change="load">
          <option value="en">English</option>
          <option value="te">Telugu</option>
        </select>
      </div>
      <div class="filter-group grow admin-form-group">
        <label class="admin-label">Search</label>
        <input v-model="search" type="text" placeholder="Filter by reference or text…" class="admin-input" />
      </div>
      <div class="filter-stats">
        <span class="stat-badge admin-badge admin-badge--warning">{{ total }} to fix</span>
        <span v-if="items.length < total" class="stat-badge admin-badge admin-badge--neutral" title="Only the first 1000 are loaded; apply these, then reload.">{{ items.length }} loaded</span>
        <span class="stat-badge admin-badge admin-badge--info">{{ filtered.length }} shown</span>
        <button
          class="admin-btn admin-btn--primary"
          :disabled="bulkBusy || filtered.length === 0"
          @click="applyAll"
        >
          {{ bulkBusy ? 'Applying…' : `Bracket all ${filtered.length} shown` }}
        </button>
      </div>
    </div>

    <div v-if="bulkMsg" class="state-msg admin-state">{{ bulkMsg }}</div>
    <div v-if="loading" class="state-msg admin-state">Loading…</div>
    <div v-else-if="error" class="state-msg admin-state admin-state--error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg admin-state">🎉 No verses have unbracketed Strong's codes.</div>
    <div v-else-if="filtered.length === 0" class="state-msg admin-state">No verses match the current search.</div>

    <div v-else class="review-list admin-list">
      <article v-for="item in filtered" :key="item.verse_id" class="review-card admin-list-item">
        <header class="card-header">
          <div class="card-ref">
            <span class="ref-book" :class="{ orphaned: !item.book_name }">
              {{ item.book_name || `Book #${item.book_id} (missing)` }}
            </span>
            <span class="ref-loc">{{ item.chapter_number }}:{{ item.verse_index ?? '—' }}</span>
          </div>
          <div class="card-actions">
            <button class="admin-btn admin-btn--primary admin-btn--sm" :disabled="busyId === item.verse_id || bulkBusy" @click="apply(item)">
              ✓ Add brackets
            </button>
            <button v-if="item.book_name" class="admin-btn admin-btn--ghost admin-btn--sm" title="Open in reading pane" @click="openVerse(item)">Open ↗</button>
          </div>
        </header>

        <p class="verse-text" :class="{ telugu: lang === 'te' }">
          <template v-for="(seg, i) in segments(item.proposed)" :key="i">
            <mark v-if="seg.code" class="code">{{ seg.text }}</mark>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
        <p v-if="rowError[item.verse_id]" class="row-error">{{ rowError[item.verse_id] }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getStrongsCodes,
  bracketStrongsCodes,
  type StrongsLang,
  type StrongsCodeItem,
} from '@/api/strongsCodes';

const router = useRouter();

const lang = ref<StrongsLang>('en');
const search = ref('');
const items = ref<StrongsCodeItem[]>([]);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const busyId = ref<number | null>(null);
const bulkBusy = ref(false);
const bulkMsg = ref('');
const rowError = ref<Record<number, string>>({});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter((v) => {
    const ref = `${v.book_name ?? ''} ${v.chapter_number}:${v.verse_index ?? ''}`.toLowerCase();
    return v.text.toLowerCase().includes(q) || ref.includes(q);
  });
});

// Splits the proposed text so the newly bracketed codes can be highlighted.
// Markup is stripped for display only — nothing here is saved.
function segments(proposed: string): { text: string; code: boolean }[] {
  const plain = proposed.replace(/<[^>]*>/g, '');
  const out: { text: string; code: boolean }[] = [];
  let last = 0;
  for (const m of plain.matchAll(/\[[HG]\d{1,4}[a-z]?(?:[\s,;/]+[HG]\d{1,4}[a-z]?)*\]/g)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: plain.slice(last, start), code: false });
    out.push({ text: m[0], code: true });
    last = start + m[0].length;
  }
  if (last < plain.length) out.push({ text: plain.slice(last), code: false });
  return out;
}

async function load() {
  loading.value = true;
  error.value = '';
  bulkMsg.value = '';
  rowError.value = {};
  try {
    const page = await getStrongsCodes(lang.value);
    items.value = page.results;
    total.value = page.total;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load verses';
  } finally {
    loading.value = false;
  }
}

function drop(ids: number[]) {
  const gone = new Set(ids);
  items.value = items.value.filter((v) => !gone.has(v.verse_id));
  total.value = Math.max(0, total.value - ids.length);
}

async function apply(item: StrongsCodeItem) {
  busyId.value = item.verse_id;
  delete rowError.value[item.verse_id];
  try {
    await bracketStrongsCodes(lang.value, [item.verse_id]);
    drop([item.verse_id]);
  } catch (e: unknown) {
    rowError.value[item.verse_id] = e instanceof Error ? e.message : 'Save failed';
  } finally {
    busyId.value = null;
  }
}

async function applyAll() {
  const ids = filtered.value.map((v) => v.verse_id);
  if (!window.confirm(`Add brackets to Strong's codes in ${ids.length} verse(s)? Their audio will be marked stale.`)) return;
  bulkBusy.value = true;
  bulkMsg.value = '';
  try {
    const { updated } = await bracketStrongsCodes(lang.value, ids);
    bulkMsg.value = `Updated ${updated} verse(s).`;
    drop(ids);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Bulk update failed';
  } finally {
    bulkBusy.value = false;
  }
}

function openVerse(item: StrongsCodeItem) {
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

.strongs-codes {
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

.filter-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
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

.code {
  background: var(--color-warning-bg, rgba(217, 119, 6, 0.15));
  color: inherit;
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 600;
}

.telugu { line-height: 1.9; }

.row-error { color: var(--color-error, #b91c1c); margin: 0.5rem 0 0; font-size: 0.875rem; }

@media (max-width: 640px) {
  .filter-stats { margin-left: 0; }
}
</style>
