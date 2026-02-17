<template>
  <div v-if="isOpen" class="search-overlay" @click="close">
    <div class="search-modal" @click.stop>
      <div class="search-header">
        <h3>Search Verses</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <div class="search-body">
        <div class="search-input-container">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Enter search terms (e.g., not My people)"
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button class="search-btn" @click="performSearch" :disabled="isSearching || !searchQuery.trim()">
            {{ isSearching ? 'Searching...' : 'Search' }}
          </button>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="results-header">
            Found {{ searchResults.length }} verse{{ searchResults.length !== 1 ? 's' : '' }}
          </div>
          <div class="results-list">
            <div
              v-for="result in searchResults"
              :key="result.verse_id"
              class="result-item"
              @click="selectVerse(result)"
            >
              <div class="result-reference">
                {{ result.book_name }} {{ result.chapter_number }}:{{ result.verse_index }}
              </div>
              <div class="result-text" v-html="highlightSearchTerms(result.verse)"></div>
              <div v-if="result.telugu_verse" class="result-telugu" v-html="highlightSearchTerms(result.telugu_verse)"></div>
              <div v-if="result.note_content" class="result-note">
                <span class="note-label">Note:</span>
                <span v-html="highlightSearchTerms(result.note_content)"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="hasSearched && !isSearching" class="no-results">
          No verses found matching "{{ searchQuery }}"
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface SearchResult {
  verse_id: number;
  book_id: number;
  chapter_id: number;
  book_name: string;
  chapter_number: string;
  verse_index: number;
  verse: string;
  telugu_verse?: string | null;
  note_content?: string | null;
}

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  select: [bookId: number, chapterId: number, verseId: number, searchResults?: SearchResult[]];
}>();

const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const errorMessage = ref('');

// Watch for modal opening to focus input
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // Check if there's an initial search query passed from parent
    const initialQuery = (window as any).initialSearchQuery;
    if (initialQuery) {
      searchQuery.value = initialQuery;
      (window as any).initialSearchQuery = null; // Clear it
      await nextTick();
      performSearch(); // Auto-search
    }
    
    await nextTick();
    searchInput.value?.focus();
  }
});

async function performSearch() {
  if (!searchQuery.value.trim()) return;
  
  isSearching.value = true;
  hasSearched.value = true;
  errorMessage.value = '';
  searchResults.value = [];
  
  try {
    // Send the search query directly - backend will build the pattern
    const query = searchQuery.value.trim();
    
    console.log('Searching for:', query);
    const url = `https://api-kua4u2vhxa-uc.a.run.app/api/verses/text-search?q=${encodeURIComponent(query)}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    searchResults.value = data.results || [];
    
    console.log('Search results:', searchResults.value.length);
    
  } catch (error) {
    console.error('Search error:', error);
    errorMessage.value = 'Failed to search verses. Please try again.';
  } finally {
    isSearching.value = false;
  }
}

function highlightSearchTerms(verseText: string): string {
  if (!verseText) return '';
  
  // First, apply PaleoBora formatting for Hebrew names
  const paleoboraPatterns = [
    { search: /HWHY/g, replace: '<span class="paleobora-text">HWHY</span>' },
    { search: /hwhy/g, replace: '<span class="paleobora-text">hwhy</span>' },
    { search: /OSWHY/g, replace: '<span class="paleobora-text">OSWHY</span>' },
    { search: /oswhy/g, replace: '<span class="paleobora-text">oswhy</span>' },
    { search: /MYHLA/g, replace: '<span class="paleobora-text">MYHLA</span>' },
    { search: /Myhla/g, replace: '<span class="paleobora-text">Myhla</span>' },
    { search: /myhla/g, replace: '<span class="paleobora-text">myhla</span>' }
  ];
  
  let highlighted = verseText;
  paleoboraPatterns.forEach(pattern => {
    highlighted = highlighted.replace(pattern.search, pattern.replace);
  });
  
  // Then, highlight search terms
  const terms = searchQuery.value.trim().split(/\s+/);
  terms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });
  
  return highlighted;
}

function selectVerse(result: SearchResult) {
  console.log('Selected verse:', result);
  emit('select', result.book_id, result.chapter_id, result.verse_id, searchResults.value);
  close();
}

function close() {
  emit('close');
}
</script>

<style scoped>
/* Touch optimizations */
* {
  -webkit-tap-highlight-color: transparent;
}

.search-modal {
  touch-action: pan-y pinch-zoom;
}

.close-btn,
.search-btn,
.result-item {
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  /* Padding in element styles ensures sufficient touch target size */
}

.close-btn:active,
.search-btn:active,
.result-item:active {
  opacity: 0.7;
  transform: scale(0.98);
}

/* Remove hover effects on touch devices */
@media (hover: none) {
  .close-btn:hover,
  .search-btn:hover,
  .result-item:hover {
    transform: none;
    box-shadow: none;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.search-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.search-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.search-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.search-input-container {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
}

.search-btn {
  padding: 0.75rem 1.5rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: #35a372;
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.search-results {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-header {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.result-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8f8f8;
}

.result-reference {
  font-weight: 600;
  color: #42b983;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.result-text {
  color: #2c3e50;
  line-height: 1.6;
  text-align: left;
}

.result-telugu {
  color: #555;
  line-height: 1.6;
  margin-top: 0.5rem;
  text-align: left;
}

.result-note {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-left: 3px solid #42b983;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.note-label {
  font-weight: 600;
  color: #42b983;
  margin-right: 0.5rem;
}

.result-text :deep(mark),
.result-telugu :deep(mark),
.result-note :deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0.1em 0.2em;
  border-radius: 3px;
  font-weight: 600;
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
  font-size: 1rem;
}

.result-text :deep(.paleobora-text),
.result-telugu :deep(.paleobora-text),
.result-note :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif;
  font-weight: normal;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .search-modal {
    max-height: 95vh;
  }
  
  .search-input-container {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
}
</style>
