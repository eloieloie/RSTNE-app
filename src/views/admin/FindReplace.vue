<template>
  <div class="find-replace-page admin-page">
    <div class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">Find & Replace</h1>
        <p class="page-description admin-subtitle">Search and replace words in verses</p>
      </div>
      <router-link to="/admin" class="back-link admin-back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Dashboard
      </router-link>
    </div>

    <div class="search-section admin-card">
      <div class="search-controls">
        <div class="input-group admin-form-group">
          <label class="admin-label">Search Word</label>
          <input
            v-model="searchWord"
            type="text"
            placeholder="Enter word to search"
            class="admin-input"
            @keyup.enter="searchVerses"
          />
        </div>

        <div class="input-group admin-form-group">
          <label class="admin-label">Replace With</label>
          <input
            v-model="replaceWord"
            type="text"
            placeholder="Enter replacement word"
            class="admin-input"
          />
        </div>

        <div class="checkbox-group">
          <label>
            <input type="checkbox" v-model="searchInEnglish" />
            Search in English verses
          </label>
          <label>
            <input type="checkbox" v-model="searchInTelugu" />
            Search in Telugu verses
          </label>
          <label>
            <input type="checkbox" v-model="caseSensitive" />
            Case sensitive
          </label>
          <label>
            <input type="checkbox" v-model="wholeWord" />
            Whole word only
          </label>
        </div>

        <button
          @click="searchVerses"
          class="btn btn-primary admin-btn admin-btn--primary"
          :disabled="!searchWord || searching"
        >
          {{ searching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <div v-if="searchResults.length > 0" class="results-summary">
        <p>Found {{ searchResults.length }} verse(s) containing "{{ lastSearchWord }}"</p>
        <button
          @click="replaceAll"
          class="btn btn-danger admin-btn admin-btn--danger"
          :disabled="!replaceWord || replacing || selectedCount === 0"
        >
          {{ replacing ? 'Replacing...' : `Replace Selected (${selectedCount})` }}
        </button>
      </div>
    </div>

    <div v-if="searching" class="loading admin-state">
      Searching verses...
    </div>

    <div v-else-if="searchResults.length > 0" class="results-section admin-list">
      <div class="select-all-container admin-list-item">
        <label class="select-all-label">
          <input
            type="checkbox"
            v-model="selectAll"
            @change="toggleSelectAll"
          />
          <span>Select All</span>
        </label>
      </div>

      <div
        v-for="result in searchResults"
        :key="`${result.verse_id}-${result.field}`"
        class="result-item admin-list-item"
      >
        <div class="result-checkbox">
          <input
            type="checkbox"
            v-model="result.selected"
            @change="updateSelectAll"
          />
        </div>
        <div class="result-content-wrapper">
          <div class="result-header">
            <span class="book-chapter">
              {{ result.book_name }} {{ result.chapter_number }}:{{ result.verse_index }}
            </span>
            <span class="field-type admin-badge admin-badge--info">{{ result.field === 'verse' ? 'English' : 'Telugu' }}</span>
          </div>
          <div class="result-content" v-html="highlightMatch(result.content, searchWord)"></div>
        </div>
      </div>
    </div>

    <div v-else-if="searched && searchResults.length === 0" class="no-results admin-state">
      No verses found containing "{{ lastSearchWord }}"
    </div>

    <div v-if="replaceSuccess" class="success-message">
      ✓ Successfully replaced {{ replaceCount }} occurrence(s)
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { API_HEADERS } from '@/api/client';

const route = useRoute();

const API_BASE_URL = 'https://rstne.eloi.in';

interface SearchResult {
  verse_id: number;
  book_name: string;
  chapter_number: string;
  verse_index: number;
  content: string;
  field: 'verse' | 'telugu_verse';
  selected?: boolean;
}

const searchWord = ref('');
const replaceWord = ref('');
const searchInEnglish = ref(true);
const searchInTelugu = ref(true);
const caseSensitive = ref(false);
const wholeWord = ref(true);
const searching = ref(false);
const replacing = ref(false);
const searched = ref(false);
const lastSearchWord = ref('');
const searchResults = ref<SearchResult[]>([]);
const replaceSuccess = ref(false);
const replaceCount = ref(0);
const selectAll = ref(false);

async function searchVerses() {
  if (!searchWord.value) return;

  searching.value = true;
  searched.value = false;
  searchResults.value = [];
  replaceSuccess.value = false;
  lastSearchWord.value = searchWord.value;

  try {
    const params = new URLSearchParams({
      searchWord: searchWord.value,
      searchInEnglish: String(searchInEnglish.value),
      searchInTelugu: String(searchInTelugu.value),
      caseSensitive: String(caseSensitive.value),
      wholeWord: String(wholeWord.value)
    });

    const response = await fetch(`${API_BASE_URL}/api/verses/search-text?${params}`, { headers: API_HEADERS });
    
    if (!response.ok) {
      throw new Error('Failed to search verses');
    }

    const results = await response.json();
    searchResults.value = results.map((r: SearchResult) => ({ ...r, selected: true }));
    selectAll.value = true;
    searched.value = true;
  } catch (error) {
    console.error('Error searching verses:', error);
    alert('Error searching verses. Please try again.');
  } finally {
    searching.value = false;
  }
}

async function replaceAll() {
  const selectedResults = searchResults.value.filter(r => r.selected);
  
  if (!replaceWord.value || selectedResults.length === 0) return;

  const confirmed = window.confirm(
    `Are you sure you want to replace "${searchWord.value}" with "${replaceWord.value}" in ${selectedResults.length} selected verse(s)?\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  replacing.value = true;
  replaceSuccess.value = false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/verses/replace-text`, {
      method: 'POST',
      headers: {
        ...API_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchWord: searchWord.value,
        replaceWord: replaceWord.value,
        verseIds: selectedResults.map(r => ({ verse_id: r.verse_id, field: r.field })),
        caseSensitive: caseSensitive.value,
        wholeWord: wholeWord.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to replace text');
    }

    const data = await response.json();
    replaceCount.value = data.replacedCount;
    replaceSuccess.value = true;
    
    // Clear results and search word after successful replace
    searchResults.value = [];
    searchWord.value = '';
    replaceWord.value = '';
    searched.value = false;

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      replaceSuccess.value = false;
    }, 5000);
  } catch (error) {
    console.error('Error replacing text:', error);
    alert('Error replacing text. Please try again.');
  } finally {
    replacing.value = false;
  }
}

function highlightMatch(text: string, search: string): string {
  if (!search) return text;

  const flags = caseSensitive.value ? 'gu' : 'giu';
  const escaped = escapeRegex(search);
  const pattern = wholeWord.value
    ? `(?<![\\p{L}\\p{N}_])(${escaped})(?![\\p{L}\\p{N}_])`
    : `(${escaped})`;
  const regex = new RegExp(pattern, flags);
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toggleSelectAll() {
  searchResults.value.forEach(r => r.selected = selectAll.value);
}

function updateSelectAll() {
  selectAll.value = searchResults.value.every(r => r.selected);
}

const selectedCount = computed(() => searchResults.value.filter(r => r.selected).length);

// Arriving from another admin page (e.g. RSTNE Live Word Rules "Find & Replace" action)
// with ?find=...&replace=... prefills the form and runs the search immediately.
onMounted(() => {
  const find = route.query.find;
  const replace = route.query.replace;
  if (typeof find === 'string' && find) {
    searchWord.value = find;
    if (typeof replace === 'string') replaceWord.value = replace;
    searchVerses();
  }
});
</script>

<style scoped>
/* Colors, fonts, page header, card surface, buttons, form fields, list rows,
   and state messages come from the shared .admin-page / .admin-card /
   .admin-btn / .admin-form-group / .admin-list / .admin-state classes
   (src/assets/admin-ui.css). Only this page's own layout remains here. */

.find-replace-page {
  max-width: 1200px;
  margin: 0 auto;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-foreground);
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.search-section {
  margin-bottom: 2rem;
}

.results-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-muted);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.results-summary p {
  margin: 0;
  font-weight: 600;
  color: var(--color-foreground);
}

.select-all-container {
  border-left: 4px solid var(--color-primary);
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--color-foreground);
  cursor: pointer;
  font-size: 1rem;
}

.select-all-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.select-all-label span {
  user-select: none;
}

.result-item {
  border-left: 4px solid var(--color-primary);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.result-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 0.25rem;
}

.result-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.result-content-wrapper {
  flex: 1;
  min-width: 0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.book-chapter {
  font-weight: 700;
  color: var(--color-foreground);
  font-size: 1.1rem;
}

.result-content {
  color: var(--color-foreground);
  line-height: 1.6;
  font-size: 1rem;
  text-align: left;
}

.result-content :deep(mark) {
  background: var(--color-highlight-from);
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
  font-weight: 600;
}

.success-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--color-success);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .search-section {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .results-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .success-message {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
