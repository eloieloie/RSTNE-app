<template>
  <div class="punctuation-suggestions admin-page">
    <header class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">🎯 Punctuation Suggestions</h1>
        <p class="subtitle admin-subtitle">
          Telugu verses where the local model suggests punctuation matching the English reference —
          review each side-by-side before applying. English text is shown as context only.
        </p>
      </div>
      <router-link to="/admin" class="admin-back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Filters -->
    <div class="filters-bar admin-toolbar admin-card">
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filterStatus" class="admin-select" @change="load">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      <div class="filter-group grow">
        <label>Search</label>
        <input v-model="search" type="text" placeholder="Filter by reference or verse text…" class="admin-input" />
      </div>
      <div class="filter-stats">
        <span class="stat-badge total admin-badge admin-badge--neutral">{{ total }} total{{ filterStatus ? ` ${filterStatus}` : '' }}</span>
        <span v-if="items.length < total" class="stat-badge capped admin-badge admin-badge--warning" title="Only the most recent 1000 are loaded for review; approve/reject to work through the rest.">
          {{ items.length }} loaded
        </span>
        <span class="stat-badge shown admin-badge admin-badge--info">{{ filtered.length }} shown</span>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-msg admin-state">Loading…</div>
    <div v-else-if="error" class="state-msg admin-state admin-state--error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg admin-state">
      🎉 No {{ filterStatus || '' }} suggestions right now — run the punctuation_corrector tool to generate some.
    </div>
    <div v-else-if="filtered.length === 0" class="state-msg admin-state">No suggestions match the current filter.</div>

    <!-- Cards -->
    <div v-else class="suggestion-list admin-list">
      <article v-for="item in filtered" :key="item.suggestion_id" class="suggestion-card admin-list-item">
        <header class="card-header">
          <div class="card-ref">
            <span class="ref-book" :class="{ orphaned: !item.book_name }">
              {{ item.book_name || `Book #${item.book_id} (missing)` }}
            </span>
            <span class="ref-loc">{{ item.chapter_number }}:{{ item.verse_index ?? '—' }}</span>
            <span :class="['status-badge', item.status, 'admin-badge', item.status === 'approved' ? 'admin-badge--success' : item.status === 'rejected' ? 'admin-badge--error' : 'admin-badge--warning']">{{ item.status }}</span>
          </div>
          <div class="card-actions">
            <span class="model-tag">{{ item.model_used }}</span>
            <template v-if="item.status === 'pending'">
              <button class="action-btn approve admin-btn admin-btn--primary admin-btn--sm" :disabled="busyId === item.suggestion_id" title="Apply to verses_tbl" @click="approve(item)">
                ✅ Approve
              </button>
              <button class="action-btn reject admin-btn admin-btn--danger admin-btn--sm" :disabled="busyId === item.suggestion_id" title="Dismiss" @click="reject(item)">
                ❌ Reject
              </button>
            </template>
            <button class="action-btn danger admin-btn admin-btn--danger admin-btn--sm" :disabled="busyId === item.suggestion_id" title="Delete permanently" @click="remove(item)">
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
/* Layout, colors, fonts, list items, badges, buttons, and form fields come from
   the shared .admin-page / .admin-list / .admin-badge / .admin-btn / .admin-input
   classes (src/assets/admin-ui.css). Only this page's stacked text-comparison
   layout and diff-highlight styling live here. */

.punctuation-suggestions {
  max-width: 1200px;
  margin: 0 auto;
}

.subtitle { max-width: 640px; }

/* Filters */
.filters-bar {
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.filter-group.grow { flex: 1; min-width: 200px; }
.filter-group.grow .admin-input { width: 100%; }

.filter-group label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted-foreground);
}

.filter-stats {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-left: auto;
}

/* Suggestion cards */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: calc(var(--space-4) * -1) calc(var(--space-4) * -1) var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-background-alt);
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--radius-default) var(--radius-default) 0 0;
}

.card-ref {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.ref-book { font-weight: 700; }
.ref-book.orphaned { color: var(--color-warning); font-style: italic; }
.ref-loc { color: var(--color-muted-foreground); font-size: var(--font-size-sm); }

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.model-tag {
  color: var(--color-muted-foreground);
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  background: var(--color-primary-light);
  border-radius: var(--radius-default);
  white-space: nowrap;
}

/* Stacked English → Original → Suggested text blocks */
.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.text-block { display: flex; flex-direction: column; gap: var(--space-2); }

.text-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted-foreground);
}
.text-label-note { font-weight: 500; text-transform: none; letter-spacing: 0; }

.text-content {
  margin: 0;
  font-size: var(--font-size-md);
  line-height: 1.7;
}
.text-content.telugu { font-size: var(--font-size-lg); }

.english-block .text-content { color: var(--color-muted-foreground); font-style: italic; }

.suggested-text :deep(.highlight) {
  background: color-mix(in srgb, var(--color-success) 20%, transparent);
  color: var(--color-success);
  font-weight: 700;
  border-radius: var(--radius-sm);
  padding: 0 2px;
}

@media (max-width: 640px) {
  .filter-stats { margin-left: 0; }
}
</style>
