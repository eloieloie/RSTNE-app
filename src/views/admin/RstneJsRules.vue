<template>
  <div class="jsr-page">
    <header class="jsr-header">
      <div class="header-left">
        <router-link to="/admin" class="back-link">← Admin Dashboard</router-link>
        <h1>🧩 RSTNE Live Word Rules</h1>
      </div>
      <button class="refresh-btn" @click="loadRules" :disabled="loading">
        {{ loading ? 'Refreshing…' : '↻ Refresh' }}
      </button>
    </header>

    <p class="jsr-explainer">
      Two separate mechanisms silently rewrite verse text on a live rstne.com page, after it
      loads. <strong>rstne.com's own inline <code>&lt;script&gt;</code> blocks</strong> — sacred
      names rendered in the PaleoBora font, Hebrew transliteration standardisation, and cleanup
      passes — parsed live out of the fetched page's actual script tags. And the
      <strong>third-party "Real-time Find and Replace" app</strong> the page loads, which fetches
      ~400 more rules (e.g. Ben → Byn, Moshiach → Mashiach) from its own live API — nothing about
      those appears in the page's HTML or JavaScript at all. Both are listed together below so you
      can see everything that can make the live page differ from the database.
    </p>

    <div v-if="!loading && !error" class="toolbar">
      <div class="search-box">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search find or replace text…"
          aria-label="Search find or replace text"
        />
      </div>

      <label class="group-filter">
        Source:
        <select v-model="sourceFilter">
          <option value="">All sources</option>
          <option value="inline-script">rstne.com JavaScript</option>
          <option value="find-replace-app">Find &amp; Replace app</option>
        </select>
      </label>

      <label class="group-filter">
        Rule type:
        <select v-model="groupFilter">
          <option value="">All types</option>
          <option v-for="label in scriptLabels" :key="label" :value="label">{{ label }}</option>
        </select>
      </label>

      <span class="rule-count">
        Showing {{ filteredRules.length }} of {{ rules.length }} rules
      </span>

      <button class="bulk-btn bulk-btn-scan" :disabled="bulkScanning" @click="findAllMatches">
        {{ bulkScanning ? `🔍 Scanning ${bulkScanProgress.done}/${bulkScanProgress.total}…` : '🔍 Find All Matches' }}
      </button>
    </div>

    <p class="jsr-safety-note">
      Match counts are read-only (safe substring search). Applying a replacement always goes
      through the <router-link to="/admin/find-replace">Find &amp; Replace</router-link> tool,
      where you review and select each matching verse before anything is written — this page no
      longer auto-applies replacements in bulk.
    </p>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching &amp; parsing rstne.com's scripts…</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="loadRules">Retry</button>
    </div>

    <div v-else class="table-wrap">
      <table class="jsr-table">
        <thead>
          <tr>
            <th
              class="sortable"
              :aria-sort="sortAsc === null ? 'none' : (sortAsc ? 'ascending' : 'descending')"
              @click="toggleSort"
            >
              Find <span class="sort-caret" v-if="sortAsc !== null">{{ sortAsc ? '▲' : '▼' }}</span>
            </th>
            <th aria-hidden="true"></th>
            <th>Replace</th>
            <th>Whole word</th>
            <th>Renders as HTML</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in filteredRules" :key="rule.id">
            <td class="find-cell">
              <code v-if="rule.source === 'inline-script'">/{{ rule.find }}/{{ rule.flags }}</code>
              <code v-else>{{ rule.find }}</code>
            </td>
            <td class="arrow-cell">→</td>
            <td class="replace-cell">
              <code>{{ rule.replaceText }}</code>
              <span v-if="rule.hasHtml" class="html-hint" :title="rule.replaceRaw">raw: {{ rule.replaceRaw }}</span>
            </td>
            <td class="flag-cell">
              <span :class="['flag-badge', rule.wholeWord ? 'flag-yes' : 'flag-no']">
                {{ rule.wholeWord ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="flag-cell">
              <span :class="['flag-badge', rule.hasHtml ? 'flag-yes' : 'flag-no']">
                {{ rule.hasHtml ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="action-cell">
              <div class="match-controls">
                <span class="history-info" tabindex="0" :title="trackingTooltip(rule)" aria-label="Rule tracking history">ℹ️</span>
                <span class="match-badge" :class="matchBadgeClass(rule)">{{ matchBadgeText(rule) }}</span>
                <button
                  class="mini-action-btn"
                  :disabled="isBusy(rule)"
                  @click="onActionClick(rule)"
                >
                  {{ actionButtonLabel(rule) }}
                </button>
              </div>
              <router-link
                :to="{ path: '/admin/find-replace', query: { find: dbSearchTerm(rule), replace: rule.replaceText } }"
                class="fr-manual-link"
                :title="hasUnresolvedRegex(rule)
                  ? `This rule's find pattern uses regex syntax the DB search can't interpret — searching for the literal text \&quot;${dbSearchTerm(rule)}\&quot; may return no matches. You may need to adjust the search term manually.`
                  : `Open in Find & Replace for manual per-verse review`"
                @click="markRuleReviewed(rule.ruleHash)"
              >
                manual review ↗
                <span v-if="hasUnresolvedRegex(rule)" class="regex-warning" aria-hidden="true">⚠️</span>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredRules.length === 0" class="empty-state">
        No rules match "{{ search }}". Try a different search, source, or rule type.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { getRstneJsRules, markRuleReviewed, type RstneJsRule } from '@/api/rstneJsRules';
import { searchVerseText, type VerseTextMatch } from '@/api/verses';

// These rules are theme-wide (same on every rstne.com page), so a single
// fixed page is all that's needed to see all of them.
const SOURCE_PAGE_URL = 'https://rstne.com/pages/matthew-mattityahu';

const rules   = ref<RstneJsRule[]>([]);
const loading = ref(false);
const error   = ref('');

const search       = ref('');
const sourceFilter = ref('');
const groupFilter  = ref('');
const sortAsc      = ref<boolean | null>(null);

function toggleSort() {
  sortAsc.value = sortAsc.value === null ? true : (sortAsc.value ? false : null);
}

// The DB search is a plain substring match (LIKE '%term%'), not a real regex
// engine and NOT word-boundary aware — a short find pattern can and will match
// inside unrelated words (e.g. "ed" inside "red", "moved", "changed"). This is
// why this page never auto-applies a replacement: every replace must go through
// the Find & Replace tool, where a human reviews each matched verse first.
// `rule.find` for inline-script rules is raw JS regex source (e.g. "\bYHUH\b"), so
// searching for it literally never matches real verse text. When the pattern is
// just a word wrapped in \b...\b boundaries (rule.wholeWord), unwrap it to the
// plain word — that covers the common case.
function dbSearchTerm(rule: RstneJsRule): string {
  if (rule.source === 'inline-script' && rule.wholeWord) {
    return rule.find.slice(2, -2);
  }
  return rule.find;
}

// True when the term we're about to search for still contains regex syntax we
// didn't unwrap — the click-through will be safe but likely won't find matches.
function hasUnresolvedRegex(rule: RstneJsRule): boolean {
  if (rule.source !== 'inline-script') return false;
  return /[\\^$.|?*+()[\]{}]/.test(dbSearchTerm(rule));
}

// A JS regex 'i' flag means case-insensitive; our DB search/replace endpoints
// take a caseSensitive boolean, so this is the inverse.
function dbCaseSensitive(rule: RstneJsRule): boolean {
  return !rule.flags.includes('i');
}

function formatTrackingDate(value: string | null): string {
  if (!value) return 'never';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function trackingTooltip(rule: RstneJsRule): string {
  const lines = [`Added: ${formatTrackingDate(rule.firstSeenAt)}`, `Last reviewed: ${formatTrackingDate(rule.lastReviewedAt)}`];
  lines.push(
    rule.lastReplacedAt
      ? `Last replaced: ${formatTrackingDate(rule.lastReplacedAt)} (${rule.lastReplaceCount ?? '?'} verse(s))`
      : 'Last replaced: never'
  );
  return lines.join('\n');
}

// --- Per-rule match scanning (read-only — no replace path from this page) --

type MatchStatus = 'idle' | 'scanning' | 'scanned' | 'error';

interface MatchState {
  status: MatchStatus;
  count: number;
  results: VerseTextMatch[];
  errorMessage?: string;
}

const matchState = ref<Record<number, MatchState>>({});

function stateFor(rule: RstneJsRule): MatchState {
  if (!matchState.value[rule.id]) {
    matchState.value[rule.id] = { status: 'idle', count: 0, results: [] };
  }
  return matchState.value[rule.id];
}

async function scanRule(rule: RstneJsRule) {
  const s = stateFor(rule);
  s.status = 'scanning';
  try {
    const term = dbSearchTerm(rule);
    const results = await searchVerseText({
      searchWord: term,
      searchInEnglish: true,
      searchInTelugu: true,
      caseSensitive: dbCaseSensitive(rule),
    });
    s.results = results;
    s.count = results.length;
    s.status = 'scanned';
    markRuleReviewed(rule.ruleHash);
    rule.lastReviewedAt = new Date().toISOString();
  } catch (e) {
    s.status = 'error';
    s.errorMessage = e instanceof Error ? e.message : 'Scan failed';
  }
}

function isBusy(rule: RstneJsRule): boolean {
  return matchState.value[rule.id]?.status === 'scanning';
}

function matchBadgeClass(rule: RstneJsRule): string {
  const s = matchState.value[rule.id];
  if (!s || s.status === 'idle') return 'match-badge-idle';
  if (s.status === 'scanning') return 'match-badge-busy';
  if (s.status === 'error') return 'match-badge-error';
  return s.count > 0 ? 'match-badge-found' : 'match-badge-none';
}

function matchBadgeText(rule: RstneJsRule): string {
  const s = matchState.value[rule.id];
  if (!s || s.status === 'idle') return 'not scanned';
  if (s.status === 'scanning') return 'scanning…';
  if (s.status === 'error') return s.errorMessage ?? 'error';
  return s.count === 1 ? '1 match' : `${s.count} matches`;
}

function actionButtonLabel(rule: RstneJsRule): string {
  const s = matchState.value[rule.id];
  if (!s || s.status === 'idle') return '🔍 Scan';
  if (s.status === 'scanning') return '🔍 …';
  if (s.status === 'error') return '↻ Retry';
  return '↻ Rescan';
}

function onActionClick(rule: RstneJsRule) {
  scanRule(rule);
}

// --- Bulk: scan (read-only) every currently-filtered rule ------------------

const bulkScanning = ref(false);
const bulkScanProgress = ref({ done: 0, total: 0 });

async function findAllMatches() {
  const targets = filteredRules.value;
  bulkScanning.value = true;
  bulkScanProgress.value = { done: 0, total: targets.length };
  for (const rule of targets) {
    await scanRule(rule);
    bulkScanProgress.value.done++;
  }
  bulkScanning.value = false;
}

watch(sourceFilter, () => { groupFilter.value = ''; });

const scriptLabels = computed(() => {
  const inScope = sourceFilter.value
    ? rules.value.filter(r => r.source === sourceFilter.value)
    : rules.value;
  return [...new Set(inScope.map(r => r.scriptLabel))];
});

const filteredRules = computed(() => {
  const term = search.value.trim().toLowerCase();

  let list = rules.value.filter(r => {
    if (sourceFilter.value && r.source !== sourceFilter.value) return false;
    if (groupFilter.value && r.scriptLabel !== groupFilter.value) return false;
    if (term === '') return true;
    return r.find.toLowerCase().includes(term) || r.replaceText.toLowerCase().includes(term);
  });

  if (sortAsc.value !== null) {
    list = [...list].sort((a, b) => {
      const cmp = a.find.localeCompare(b.find, undefined, { sensitivity: 'base' });
      return sortAsc.value ? cmp : -cmp;
    });
  }

  return list;
});

async function loadRules() {
  loading.value = true;
  error.value   = '';
  try {
    const result = await getRstneJsRules(SOURCE_PAGE_URL);
    rules.value = result.rules;
  } catch (e: any) {
    error.value = e?.message ?? 'Unknown error loading JS rules';
  } finally {
    loading.value = false;
  }
}

onMounted(loadRules);
</script>

<style scoped>
.jsr-page {
  min-height: 100vh;
  background: #f0f2f5;
  font-family: 'Segoe UI', sans-serif;
}

.jsr-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.jsr-header h1 {
  margin: 0;
  font-size: 1.4rem;
}
.back-link {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  padding: 0.4rem 0.9rem;
  background: rgba(255,255,255,0.2);
  border-radius: 6px;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background 0.2s;
}
.back-link:hover { background: rgba(255,255,255,0.35); }
.back-link:focus-visible,
.refresh-btn:focus-visible,
.sortable:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.refresh-btn:hover:not(:disabled) { background: rgba(255,255,255,0.35); }
.refresh-btn:disabled { opacity: 0.6; cursor: default; }

.jsr-explainer {
  max-width: 900px;
  margin: 1.2rem auto 0;
  padding: 0 2rem;
  color: #555;
  font-size: 0.92rem;
  line-height: 1.6;
}
.jsr-explainer code {
  background: #eceef3;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85em;
}

.jsr-safety-note {
  max-width: 1200px;
  margin: 0.75rem auto 0;
  padding: 0.6rem 2rem;
  color: #856404;
  background: #fff3cd;
  font-size: 0.82rem;
  line-height: 1.5;
}
.jsr-safety-note a { color: #1565c0; font-weight: 600; }

.toolbar {
  max-width: 1200px;
  margin: 1.2rem auto 0;
  padding: 0 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1 1 260px;
  min-width: 220px;
}
.search-icon {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}
.search-box input {
  width: 100%;
  padding: 0.55rem 0.8rem 0.55rem 2.2rem;
  border: 1.5px solid #c0c7d8;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  transition: border-color 0.2s;
}
.search-box input:focus {
  outline: none;
  border-color: #667eea;
}

.group-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}
.group-filter select {
  padding: 0.45rem 0.7rem;
  border: 1.5px solid #c0c7d8;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}
.group-filter select:focus { outline: 2px solid #667eea; outline-offset: 1px; }

.rule-count {
  font-size: 0.85rem;
  color: #666;
  margin-left: auto;
  white-space: nowrap;
}

.bulk-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.bulk-btn:disabled { opacity: 0.6; cursor: default; }

.bulk-btn-scan {
  background: #e3f2fd;
  color: #1565c0;
}
.bulk-btn-scan:hover:not(:disabled) { background: #cfe8fc; }


.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: #555;
  text-align: center;
}
.error-state { color: #c0392b; }
.error-state button {
  padding: 0.5rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}
.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  padding: 3rem 1rem;
  color: #888;
}

.table-wrap {
  max-width: 1200px;
  margin: 1.2rem auto 3rem;
  padding: 0 2rem;
  overflow-x: auto;
}

.jsr-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  font-size: 0.9rem;
}
.jsr-table th, .jsr-table td {
  padding: 0.55rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid #f0f2f5;
  vertical-align: top;
}
.jsr-table thead th {
  background: #e8f4fd;
  color: #1565c0;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}
.jsr-table th.sortable {
  cursor: pointer;
  user-select: none;
}
.jsr-table th.sortable:hover { background: #d9ecfb; }
.sort-caret { font-size: 0.7rem; margin-left: 0.2rem; }

.jsr-table tbody tr:hover { background: #fafbff; }
.jsr-table tbody tr:last-child td { border-bottom: none; }

.find-cell code, .replace-cell code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.86rem;
  background: #f4f3ef;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  word-break: break-word;
}
.html-hint {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.72rem;
  color: #999;
  font-style: italic;
}
.arrow-cell {
  color: #999;
  text-align: center;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
}

.flag-cell { white-space: nowrap; }
.flag-badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}
.flag-yes { background: #e8f5e9; color: #2e7d32; }
.flag-no  { background: #f0f2f5; color: #888; }

.action-cell {
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.match-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.history-info {
  font-size: 0.85rem;
  cursor: help;
}

.match-badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.match-badge-idle  { background: #f0f2f5; color: #888; }
.match-badge-busy  { background: #fff3cd; color: #856404; }
.match-badge-error { background: #fdecea; color: #c0392b; }
.match-badge-found { background: #e3f2fd; color: #1565c0; }
.match-badge-none  { background: #f0f2f5; color: #888; }

.mini-action-btn {
  padding: 0.25rem 0.6rem;
  border: none;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: #667eea;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}
.mini-action-btn:hover:not(:disabled) { background: #5568d3; }
.mini-action-btn:disabled { opacity: 0.6; cursor: default; }

.fr-manual-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #1565c0;
  text-decoration: none;
  white-space: nowrap;
}
.fr-manual-link:hover { text-decoration: underline; }
.fr-manual-link:focus-visible { outline: 2px solid #667eea; outline-offset: 2px; }
.regex-warning { font-size: 0.8rem; }

@media (max-width: 640px) {
  .jsr-header { padding: 1rem; flex-wrap: wrap; }
  .jsr-explainer, .toolbar, .table-wrap { padding-left: 1rem; padding-right: 1rem; }
  .rule-count { margin-left: 0; }
}
</style>
