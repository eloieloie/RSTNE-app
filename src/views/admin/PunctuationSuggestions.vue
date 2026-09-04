<template>
  <div class="punctuation-suggestions">
    <header class="page-header">
      <div>
        <h1>🎯 Punctuation Suggestions</h1>
        <p class="subtitle">
          Telugu verses where the local model suggests punctuation matching the English reference —
          review each side-by-side before applying. English text is shown as context only.
        </p>
      </div>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filterStatus" @change="load">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      <div class="filter-group grow">
        <label>Search</label>
        <input v-model="search" type="text" placeholder="Filter by reference or verse text…" />
      </div>
      <div class="filter-stats">
        <span class="stat-badge total">{{ total }} total{{ filterStatus ? ` ${filterStatus}` : '' }}</span>
        <span v-if="items.length < total" class="stat-badge capped" title="Only the most recent 1000 are loaded for review; approve/reject to work through the rest.">
          {{ items.length }} loaded
        </span>
        <span class="stat-badge shown">{{ filtered.length }} shown</span>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg">
      🎉 No {{ filterStatus || '' }} suggestions right now — run the punctuation_corrector tool to generate some.
    </div>
    <div v-else-if="filtered.length === 0" class="state-msg">No suggestions match the current filter.</div>

    <!-- Cards -->
    <div v-else class="suggestion-list">
      <article v-for="item in filtered" :key="item.suggestion_id" class="suggestion-card">
        <header class="card-header">
          <div class="card-ref">
            <span class="ref-book" :class="{ orphaned: !item.book_name }">
              {{ item.book_name || `Book #${item.book_id} (missing)` }}
            </span>
            <span class="ref-loc">{{ item.chapter_number }}:{{ item.verse_index ?? '—' }}</span>
            <span :class="['status-badge', item.status]">{{ item.status }}</span>
          </div>
          <div class="card-actions">
            <span class="model-tag">{{ item.model_used }}</span>
            <template v-if="item.status === 'pending'">
              <button class="action-btn approve" :disabled="busyId === item.suggestion_id" title="Apply to verses_tbl" @click="approve(item)">
                ✅ Approve
              </button>
              <button class="action-btn reject" :disabled="busyId === item.suggestion_id" title="Dismiss" @click="reject(item)">
                ❌ Reject
              </button>
            </template>
            <button class="action-btn danger" :disabled="busyId === item.suggestion_id" title="Delete permanently" @click="remove(item)">
              🗑️
            </button>
          </div>
        </header>

        <div class="card-body">
          <div class="text-block english-block">
            <span class="text-label">English <span class="text-label-note">(reference only)</span></span>
            <p class="text-content">{{ item.english_reference }}</p>
          </div>

          <div class="text-block">
            <span class="text-label">Original Telugu</span>
            <p class="text-content telugu">{{ plainText(item.original_telugu) }}</p>
          </div>

          <div class="text-block">
            <span class="text-label">Suggested Telugu</span>
            <p class="text-content telugu suggested-text">
              <span
                v-for="(seg, i) in diffSegments(item.original_telugu, item.suggested_telugu)"
                :key="i"
                :class="{ highlight: seg.changed }"
              >{{ seg.text }}</span>
            </p>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getPunctuationSuggestions,
  approvePunctuationSuggestion,
  rejectPunctuationSuggestion,
  deletePunctuationSuggestion,
  type PunctuationSuggestion,
} from '@/api/punctuationSuggestions';

const items = ref<PunctuationSuggestion[]>([]);
const total = ref(0);
const loading = ref(false);
const busyId = ref<number | null>(null);
const error = ref('');
const filterStatus = ref('pending');
const search = ref('');

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return items.value.filter((v) => {
    if (!q) return true;
    const ref = `${v.book_name ?? ''} ${v.chapter_number}:${v.verse_index ?? ''}`.toLowerCase();
    return (
      ref.includes(q) ||
      plainText(v.original_telugu).toLowerCase().includes(q) ||
      (v.english_reference ?? '').toLowerCase().includes(q)
    );
  });
});

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

// Word-boundary diff between the (tag-stripped) original and suggested Telugu text,
// so only the changed separators/punctuation are highlighted. Mirrors the tokenizer
// used by punctuation_corrector/lib/textUtils.mjs so the two agree on what a "word" is.
const WORD_RE = /[^\s,;:.!?।()]+/g;

function diffSegments(originalHtml: string, suggestedHtml: string): { text: string; changed: boolean }[] {
  const original = plainText(originalHtml);
  const suggested = plainText(suggestedHtml);

  const wordsOf = (s: string) => [...s.matchAll(WORD_RE)].map((m) => ({ text: m[0], start: m.index!, end: m.index! + m[0].length }));
  const ow = wordsOf(original);
  const nw = wordsOf(suggested);

  if (ow.length !== nw.length || ow.some((w, i) => w.text !== nw[i].text)) {
    return [{ text: suggested, changed: true }];
  }

  const seps = (text: string, words: { start: number; end: number }[]) => {
    const out: string[] = [];
    let cur = 0;
    for (const w of words) { out.push(text.slice(cur, w.start)); cur = w.end; }
    out.push(text.slice(cur));
    return out;
  };
  const oldSeps = seps(original, ow);
  const newSeps = seps(suggested, nw);

  const segments: { text: string; changed: boolean }[] = [];
  for (let i = 0; i <= nw.length; i++) {
    if (newSeps[i]) segments.push({ text: newSeps[i], changed: newSeps[i] !== oldSeps[i] });
    if (i < nw.length) segments.push({ text: nw[i].text, changed: false });
  }
  return segments;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const page = await getPunctuationSuggestions(filterStatus.value || undefined);
    items.value = page.results;
    total.value = page.total;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load suggestions';
  } finally {
    loading.value = false;
  }
}

async function approve(item: PunctuationSuggestion) {
  busyId.value = item.suggestion_id;
  try {
    await approvePunctuationSuggestion(item.suggestion_id);
    await load();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to approve suggestion';
  } finally {
    busyId.value = null;
  }
}

async function reject(item: PunctuationSuggestion) {
  busyId.value = item.suggestion_id;
  try {
    await rejectPunctuationSuggestion(item.suggestion_id);
    await load();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to reject suggestion';
  } finally {
    busyId.value = null;
  }
}

async function remove(item: PunctuationSuggestion) {
  if (!confirm('Delete this suggestion permanently?')) return;
  busyId.value = item.suggestion_id;
  try {
    await deletePunctuationSuggestion(item.suggestion_id);
    await load();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to delete suggestion';
  } finally {
    busyId.value = null;
  }
}

onMounted(load);
</script>

<style scoped>
.punctuation-suggestions {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: inherit;
  text-align: left;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.page-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
.subtitle { margin: 0.35rem 0 0; color: #6b7280; font-size: 0.95rem; max-width: 640px; }

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
.stat-badge.total { background: #fee2e2; color: #991b1b; }
.stat-badge.capped { background: #fef3c7; color: #92400e; }
.stat-badge.shown { background: #e0e7ff; color: #3730a3; }

/* Suggestion cards */
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.card-ref {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ref-book { font-weight: 700; font-size: 15px; color: #111827; }
.ref-book.orphaned { color: #b45309; font-style: italic; }
.ref-loc { color: #6b7280; font-size: 14px; }

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.model-tag {
  color: #6b7280;
  font-size: 12px;
  padding: 4px 8px;
  background: #eef2ff;
  border-radius: 6px;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.approved { background: #d1fae5; color: #065f46; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }

.action-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 12px;
  min-height: 32px;
  border-radius: 6px;
  transition: background 0.1s, border-color 0.1s;
}
.action-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
.action-btn:disabled { opacity: 0.5; cursor: default; }

.action-btn.approve { border-color: #10b981; color: #065f46; }
.action-btn.approve:hover:not(:disabled) { background: #d1fae5; }
.action-btn.reject { border-color: #f59e0b; color: #92400e; }
.action-btn.reject:hover:not(:disabled) { background: #fef3c7; }
.action-btn.danger { border-color: #ef4444; color: #991b1b; }
.action-btn.danger:hover:not(:disabled) { background: #fee2e2; }

/* Stacked English → Original → Suggested text blocks */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.text-block { display: flex; flex-direction: column; gap: 6px; }

.text-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}
.text-label-note { font-weight: 500; text-transform: none; letter-spacing: 0; }

.text-content {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #111827;
}
.text-content.telugu { font-size: 17px; }

.english-block .text-content { color: #4b5563; font-style: italic; }

.suggested-text :deep(.highlight) {
  background: #d1fae5;
  color: #065f46;
  font-weight: 700;
  border-radius: 3px;
  padding: 0 2px;
}

/* State messages */
.state-msg {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
.state-msg.error { color: #dc2626; }

@media (max-width: 640px) {
  .punctuation-suggestions { padding: 1rem; }
  .filter-stats { margin-left: 0; }
}
</style>
