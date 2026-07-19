<template>
  <div class="modification-required">
    <header class="page-header">
      <div>
        <h1>📝 Modification Required</h1>
        <p class="subtitle">Verses with no Telugu text — flagged as <strong>citation required</strong>.</p>
      </div>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Book</label>
        <select v-model="filterBook">
          <option value="">All books</option>
          <option v-for="b in books" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="filter-group grow">
        <label>Search English text</label>
        <input v-model="search" type="text" placeholder="Filter by verse text or reference…" />
      </div>
      <div class="filter-actions">
        <button class="btn-secondary" :disabled="rescanning" @click="rescan">
          {{ rescanning ? 'Rescanning…' : '↻ Rescan' }}
        </button>
      </div>
      <div class="filter-stats">
        <span class="stat-badge required">{{ items.length }} flagged</span>
        <span class="stat-badge shown">{{ filtered.length }} shown</span>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg">🎉 No verses require modification — every verse has Telugu text.</div>
    <div v-else-if="filtered.length === 0" class="state-msg">No verses match the current filter.</div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="verses-table">
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
            <td class="telugu-cell"><span class="missing-badge">missing</span></td>
            <td class="actions-cell">
              <button
                v-if="v.book_name"
                class="action-btn"
                title="Open in reading pane"
                @click="openVerse(v)"
              >Open ↗</button>
              <router-link
                class="action-btn"
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
.modification-required {
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

/* Filters */
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
.filter-group.grow { flex: 1; min-width: 200px; }

.filter-group label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.filter-group select,
.filter-group input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
}
.filter-group.grow input { width: 100%; }

.filter-actions { display: flex; align-items: flex-end; }

.filter-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.stat-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.stat-badge.required { background: #fee2e2; color: #991b1b; }
.stat-badge.shown { background: #e0e7ff; color: #3730a3; }

/* Table */
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

.ref-cell { white-space: nowrap; }
.ref-book { font-weight: 600; color: #111827; }
.ref-book.orphaned { color: #b45309; font-style: italic; }
.ref-loc { color: #6b7280; margin-left: 6px; }

.text-cell { line-height: 1.45; color: #111827; max-width: 620px; }

.telugu-cell { white-space: nowrap; }
.missing-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: #fef3c7;
  color: #92400e;
}

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

.action-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.1s, border-color 0.1s;
}
.action-btn:hover { background: #f3f4f6; border-color: #9ca3af; }

.btn-secondary {
  padding: 7px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover:not(:disabled) { background: #f9fafb; }
.btn-secondary:disabled { opacity: 0.6; cursor: default; }

/* State messages */
.state-msg {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
.state-msg.error { color: #dc2626; }

@media (max-width: 640px) {
  .modification-required { padding: 1rem; }
  .filter-stats { margin-left: 0; }
}
</style>
