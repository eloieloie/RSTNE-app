<template>
  <div class="jsr-page admin-page">
    <header class="jsr-header admin-page-header">
      <div class="header-left">
        <router-link to="/admin" class="back-link admin-back-link">← Admin Dashboard</router-link>
        <h1 class="admin-title">🧩 RSTNE Live Word Rules</h1>
      </div>
      <button class="refresh-btn admin-btn admin-btn--secondary" @click="loadRules" :disabled="loading">
        {{ loading ? 'Refreshing…' : '↻ Refresh' }}
      </button>
    </header>

    <p class="jsr-explainer">
      Two separate mechanisms silently rewrite verse text on a live rstne.com page, after it
      loads. <strong>rstne.com's own inline <code class="admin-mono">&lt;script&gt;</code> blocks</strong> — sacred
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
          class="admin-input"
          placeholder="Search find or replace text…"
          aria-label="Search find or replace text"
        />
      </div>

      <label class="group-filter admin-label">
        Source:
        <select v-model="sourceFilter" class="admin-select">
          <option value="">All sources</option>
          <option value="inline-script">rstne.com JavaScript</option>
          <option value="find-replace-app">Find &amp; Replace app</option>
        </select>
      </label>

      <label class="group-filter admin-label">
        Rule type:
        <select v-model="groupFilter" class="admin-select">
          <option value="">All types</option>
          <option v-for="label in scriptLabels" :key="label" :value="label">{{ label }}</option>
        </select>
      </label>

      <label class="group-filter admin-label matched-toggle">
        <input type="checkbox" v-model="showOnlyMatched" />
        Show only matched rules
      </label>

      <span class="rule-count">
        Showing {{ filteredRules.length }} of {{ rules.length }} rules
      </span>

      <button class="bulk-btn bulk-btn-scan admin-btn admin-btn--secondary" :disabled="bulkScanning" @click="findAllMatches">
        {{ bulkScanning ? `🔍 Scanning ${bulkScanProgress.done}/${bulkScanProgress.total}…` : '🔍 Scan All Filtered Rules' }}
      </button>
    </div>

    <p class="jsr-safety-note">
      Match counts are read-only (safe substring search). Applying a replacement always goes
      through the <router-link to="/admin/find-replace">Find &amp; Replace</router-link> tool,
      where you review and select each matching verse before anything is written — this page no
      longer auto-applies replacements in bulk.
    </p>

    <div v-if="loading" class="loading-state admin-state">
      <div class="spinner"></div>
      <p>Fetching &amp; parsing rstne.com's scripts…</p>
    </div>

    <div v-else-if="error" class="error-state admin-state admin-state--error">
      <p>⚠️ {{ error }}</p>
      <button class="admin-btn admin-btn--primary" @click="loadRules">Retry</button>
    </div>

    <div v-else class="table-wrap admin-table-wrap">
      <table class="jsr-table admin-table">
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
              <code v-if="rule.source === 'inline-script'" class="admin-mono">/{{ rule.find }}/{{ rule.flags }}</code>
              <code v-else class="admin-mono">{{ rule.find }}</code>
            </td>
            <td class="arrow-cell">→</td>
            <td class="replace-cell">
              <code class="admin-mono">{{ rule.replaceText }}</code>
              <span v-if="rule.hasHtml" class="html-hint" :title="rule.replaceRaw">raw: {{ rule.replaceRaw }}</span>
            </td>
            <td class="flag-cell">
              <span :class="['flag-badge admin-badge', rule.wholeWord ? 'admin-badge--success' : 'admin-badge--neutral']">
                {{ rule.wholeWord ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="flag-cell">
              <span :class="['flag-badge admin-badge', rule.hasHtml ? 'admin-badge--success' : 'admin-badge--neutral']">
                {{ rule.hasHtml ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="action-cell">
              <div class="match-controls">
                <span class="history-info" tabindex="0" :title="trackingTooltip(rule)" aria-label="Rule tracking history">ℹ️</span>
                <span class="match-badge admin-badge" :class="matchBadgeClass(rule)">{{ matchBadgeText(rule) }}</span>
                <button
                  class="mini-action-btn admin-btn admin-btn--primary admin-btn--sm"
                  :disabled="isBusy(rule)"
                  @click="onActionClick(rule)"
                >
                  {{ actionButtonLabel(rule) }}
                </button>
              </div>
              <router-link
                :to="{ path: '/admin/find-replace', query: { find: dbSearchTerm(rule), replace: rule.replaceText } }"
                class="fr-manual-link"
                target="_blank"
                rel="noopener"
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

      <div v-if="filteredRules.length === 0" class="empty-state admin-state">
        <template v-if="showOnlyMatched">
          No scanned rules currently have matches. Run "Scan All Filtered Rules" first, or turn off "Show only matched rules".
        </template>
        <template v-else>
          No rules match "{{ search }}". Try a different search, source, or rule type.
        </template>
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

const search          = ref('');
const sourceFilter    = ref('');
const groupFilter     = ref('');
const sortAsc         = ref<boolean | null>(null);
const showOnlyMatched = ref(false);

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

function hasScannedMatches(rule: RstneJsRule): boolean {
  const s = matchState.value[rule.id];
  return s?.status === 'scanned' && s.count > 0;
}

const filteredRules = computed(() => {
  const term = search.value.trim().toLowerCase();

  let list = rules.value.filter(r => {
    if (sourceFilter.value && r.source !== sourceFilter.value) return false;
    if (groupFilter.value && r.scriptLabel !== groupFilter.value) return false;
    if (showOnlyMatched.value && !hasScannedMatches(r)) return false;
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
/* Page background, text color, and font come from .admin-page (admin-ui.css);
   the old purple/blue gradient header and white-on-color chrome are
   superseded by .admin-page-header / .admin-title / .admin-back-link /
   .admin-btn. Content sections below rely on .admin-page's own outer
   padding for their horizontal gutter instead of redeclaring it. */
.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.back-link:focus-visible,
.sortable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.jsr-explainer {
  max-width: 900px;
  margin: 1.2rem auto 0;
  color: var(--color-muted-foreground);
  font-size: 0.92rem;
  line-height: 1.6;
}
.jsr-explainer code {
  background: var(--color-muted);
  padding: 0.05rem 0.35rem;
  border-radius: var(--radius-sm);
}

.jsr-safety-note {
  max-width: 1200px;
  margin: 0.75rem auto 0;
  padding: 0.6rem 1rem;
  color: var(--color-note-text);
  background: var(--color-note-bg);
  border-left: 3px solid var(--color-note-border);
  font-size: 0.82rem;
  line-height: 1.5;
}
.jsr-safety-note a { color: var(--color-primary); font-weight: 600; }

.toolbar {
  max-width: 1200px;
  margin: 1.2rem auto 0;
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
  color: var(--color-muted-foreground);
  pointer-events: none;
}
.search-box input {
  width: 100%;
  padding-left: 2.2rem;
}

.group-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.matched-toggle {
  cursor: pointer;
}
.matched-toggle input {
  cursor: pointer;
}

.rule-count {
  font-size: 0.85rem;
  color: var(--color-muted-foreground);
  margin-left: auto;
  white-space: nowrap;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}
.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap {
  max-width: 1200px;
  margin: 1.2rem auto 3rem;
}

/* Table chrome (surface, border, header style, row hover, dividers) comes
   from .admin-table-wrap / .admin-table. Only sort interaction and the
   top-aligned cells (rows can have a taller "raw:" hint line) stay here. */
.jsr-table td {
  vertical-align: top;
}
.jsr-table th.sortable {
  cursor: pointer;
  user-select: none;
}
.jsr-table th.sortable:hover { background: var(--color-muted); }
.sort-caret { font-size: 0.7rem; margin-left: 0.2rem; }

.find-cell .admin-mono,
.replace-cell .admin-mono {
  background: var(--color-muted);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-sm);
  word-break: break-word;
}
.html-hint {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.72rem;
  color: var(--color-muted-foreground);
  font-style: italic;
}
.arrow-cell {
  color: var(--color-muted-foreground);
  text-align: center;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
}

.flag-cell { white-space: nowrap; }

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

/* .match-badge's shape (padding/radius/font-size/weight) comes from the
   shared .admin-badge class added alongside it in the template; only the
   per-state colors stay here, since matchBadgeClass() (script logic) picks
   which of these state classes applies and can't be renamed to the
   admin-badge--* modifier names without touching the script block. */
.match-badge-idle,
.match-badge-none  { background: var(--color-muted); color: var(--color-muted-foreground); }
.match-badge-busy  { background: var(--color-note-bg); color: var(--color-note-text); }
.match-badge-error { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }
/* "Found" is an informational badge, so it mirrors admin-badge--info's own
   convention of using --color-cat-2 for the info semantic (not for
   book-category tagging). */
.match-badge-found { background: color-mix(in srgb, var(--color-cat-2) 16%, transparent); color: var(--color-cat-2); }

.fr-manual-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
}
.fr-manual-link:hover { text-decoration: underline; }
.fr-manual-link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.regex-warning { font-size: 0.8rem; }

@media (max-width: 640px) {
  .rule-count { margin-left: 0; }
}
</style>
