<template>
  <div class="modification-required admin-page">
    <header class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">📝 Modification Required</h1>
        <p class="subtitle admin-subtitle">Verses with no Telugu text — flagged as <strong>citation required</strong>.</p>
      </div>
      <router-link to="/admin" class="back-link admin-back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group admin-form-group">
        <label class="admin-label">Book</label>
        <select v-model="filterBook" class="admin-select">
          <option value="">All books</option>
          <option v-for="b in books" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="filter-group grow admin-form-group">
        <label class="admin-label">Search English text</label>
        <input v-model="search" type="text" placeholder="Filter by verse text or reference…" class="admin-input" />
      </div>
      <div class="filter-actions">
        <button class="btn-secondary admin-btn admin-btn--secondary" :disabled="rescanning" @click="rescan">
          {{ rescanning ? 'Rescanning…' : '↻ Rescan' }}
        </button>
      </div>
      <div class="filter-stats">
        <span class="stat-badge required admin-badge admin-badge--error">{{ items.length }} flagged</span>
        <span class="stat-badge shown admin-badge admin-badge--info">{{ filtered.length }} shown</span>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-msg admin-state">Loading…</div>
    <div v-else-if="error" class="state-msg error admin-state admin-state--error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg admin-state">🎉 No verses require modification — every verse has Telugu text.</div>
    <div v-else-if="filtered.length === 0" class="state-msg admin-state">No verses match the current filter.</div>

    <!-- Table -->
    <div v-else class="table-wrap admin-table-wrap">
      <table class="verses-table admin-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>English Text</th>
            <th>Telugu</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filtered" :key="v.verse_id" class="verse-row">
            <td class="ref-cell">
              <span class="ref-book" :class="{ orphaned: !v.book_name }">
                {{ v.book_name || `Book #${v.book_id} (missing)` }}
              </span>
              <span class="ref-loc">{{ v.chapter_number }}:{{ v.verse_index ?? '—' }}</span>
            </td>
            <td class="text-cell">{{ truncate(v.verse, 160) }}</td>
            <td class="telugu-cell"><span class="missing-badge admin-badge admin-badge--warning">missing</span></td>
            <td class="actions-cell">
              <button
                v-if="v.book_name"
                class="action-btn admin-btn admin-btn--ghost admin-btn--sm"
                title="Open in reading pane"
                @click="openVerse(v)"
              >Open ↗</button>
              <router-link
                class="action-btn admin-btn admin-btn--ghost admin-btn--sm"
                title="Edit chapter"
                :to="`/admin/chapters/${v.chapter_id}`"
              >Edit</router-link>
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
import { API_URL as API_BASE, API_HEADERS } from '@/api/client';

interface CitationVerse {
  verse_id: number;
  chapter_id: number;
  verse_index: number | null;
  verse: string;
  telugu_verse: string | null;
  chapter_number: string;
  book_id: number;
  book_name: string | null;
  book_index: number | null;
}

const router = useRouter();

const items = ref<CitationVerse[]>([]);
const loading = ref(false);
const rescanning = ref(false);
const error = ref('');
const filterBook = ref('');
const search = ref('');

const books = computed(() => {
  const set = new Set<string>();
  for (const v of items.value) if (v.book_name) set.add(v.book_name);
  return [...set];
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return items.value.filter(v => {
    if (filterBook.value && v.book_name !== filterBook.value) return false;
    if (!q) return true;
    const ref = `${v.book_name ?? ''} ${v.chapter_number}:${v.verse_index ?? ''}`.toLowerCase();
    return v.verse.toLowerCase().includes(q) || ref.includes(q);
  });
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/verses/citation-required`, { headers: API_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    items.value = data.results ?? data;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load verses';
  } finally {
    loading.value = false;
  }
}

async function rescan() {
  rescanning.value = true;
  try {
    const res = await fetch(`${API_BASE}/verses/rescan-citations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...API_HEADERS },
      body: '{}',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await load();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Rescan failed';
  } finally {
    rescanning.value = false;
  }
}

function openVerse(v: CitationVerse) {
  router.push({
    name: 'book-chapter-verse',
    params: {
      bookName: v.book_name.replace(/ /g, '-'),
      chapterNumber: String(v.chapter_number),
      ...(v.verse_index != null ? { verseNumber: String(v.verse_index) } : {}),
    },
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

onMounted(load);
</script>

<style scoped>
/* Colors, fonts, page header, table, badges, buttons, form fields, and state
   messages come from the shared .admin-page / .admin-table / .admin-badge /
   .admin-btn / .admin-form-group / .admin-state classes (src/assets/admin-ui.css).
   Only this page's own layout sizing remains here. */

.modification-required {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

/* Filters */
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

.filter-actions { display: flex; align-items: flex-end; }

.filter-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

/* Table */
.verse-row { transition: background 0.1s; }
.verse-row:hover { background: var(--color-background-alt); }

.ref-cell { white-space: nowrap; }
.ref-book { font-weight: 600; color: var(--color-foreground); }
.ref-book.orphaned { color: var(--color-warning); font-style: italic; }
.ref-loc { color: var(--color-muted-foreground); margin-left: 6px; }

.text-cell { line-height: 1.45; color: var(--color-foreground); max-width: 620px; }

.telugu-cell { white-space: nowrap; }

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

/* State messages */
@media (max-width: 640px) {
  .filter-stats { margin-left: 0; }
}
</style>
