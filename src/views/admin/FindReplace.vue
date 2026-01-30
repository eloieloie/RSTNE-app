<template>
  <div class="find-replace-page">
    <div class="page-header">
      <router-link to="/admin" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Dashboard
      </router-link>
      <h1>Find & Replace</h1>
      <p class="page-description">Search and replace words in verses</p>
    </div>

    <div class="search-section">
      <div class="search-controls">
        <div class="input-group">
          <label>Search Word</label>
          <input 
            v-model="searchWord" 
            type="text" 
            placeholder="Enter word to search"
            @keyup.enter="searchVerses"
          />
        </div>

        <div class="input-group">
          <label>Replace With</label>
          <input 
            v-model="replaceWord" 
            type="text" 
            placeholder="Enter replacement word"
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
        </div>

        <button 
          @click="searchVerses" 
          class="btn btn-primary"
          :disabled="!searchWord || searching"
        >
          {{ searching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <div v-if="searchResults.length > 0" class="results-summary">
        <p>Found {{ searchResults.length }} verse(s) containing "{{ lastSearchWord }}"</p>
        <button 
          @click="replaceAll" 
          class="btn btn-danger"
          :disabled="!replaceWord || replacing || selectedCount === 0"
        >
          {{ replacing ? 'Replacing...' : `Replace Selected (${selectedCount})` }}
        </button>
      </div>
    </div>

    <div v-if="searching" class="loading">
      Searching verses...
    </div>

    <div v-else-if="searchResults.length > 0" class="results-section">
      <div class="select-all-container">
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
        class="result-item"
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
            <span class="field-type">{{ result.field === 'verse' ? 'English' : 'Telugu' }}</span>
          </div>
          <div class="result-content" v-html="highlightMatch(result.content, searchWord)"></div>
        </div>
      </div>
    </div>

    <div v-else-if="searched && searchResults.length === 0" class="no-results">
      No verses found containing "{{ lastSearchWord }}"
    </div>

    <div v-if="replaceSuccess" class="success-message">
      ✓ Successfully replaced {{ replaceCount }} occurrence(s)
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const API_BASE_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api';

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
      caseSensitive: String(caseSensitive.value)
    });

    const response = await fetch(`${API_BASE_URL}/api/verses/search-text?${params}`);
    
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchWord: searchWord.value,
        replaceWord: replaceWord.value,
        verseIds: selectedResults.map(r => ({ verse_id: r.verse_id, field: r.field })),
        caseSensitive: caseSensitive.value
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
  
  const flags = caseSensitive.value ? 'g' : 'gi';
  const regex = new RegExp(`(${escapeRegex(search)})`, flags);
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
</script>

<style scoped>
.find-replace-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #359670;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #666;
  margin: 0;
}

.search-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 600;
  color: #2c3e50;
}

.input-group input[type="text"] {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-group input[type="text"]:focus {
  outline: none;
  border-color: #42b983;
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
  color: #2c3e50;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #359670;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.results-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.results-summary p {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.select-all-container {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: #2c3e50;
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
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #42b983;
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
  color: #2c3e50;
  font-size: 1.1rem;
}

.field-type {
  background: #42b983;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.result-content {
  color: #333;
  line-height: 1.6;
  font-size: 1rem;
  text-align: left;
}

.result-content :deep(mark) {
  background: #ffeb3b;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
  font-weight: 600;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.success-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #28a745;
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
  .find-replace-page {
    padding: 1rem;
  }

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
