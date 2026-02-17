<template>
  <div class="chapters-page">
    <!-- Initial Loading -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="content-wrapper">
      <div class="content-layout">
        <nav class="top-nav">
          <div class="nav-container">
            <button class="search-icon" @click="showSearchModal = true" title="Search Verses">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

            <button class="verse-picker-button" @click="showVersePicker = true">
            <div class="book-names">
              <span v-if="displayHebrewBookName" class="hebrew-book-name">{{ displayHebrewBookName }}</span>
              <span class="book-name">{{ displayBookName }}</span>
            </div>
            <span v-if="displayChapterNumber" class="chapter-verse">
              {{ displayChapterNumber }}{{ displayVerseNumber }}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

            <button class="settings-icon" @click="showSettingsModal = true" title="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </nav>

        <main class="chapter-content">
          <!-- Loading spinner for verse navigation -->
          <div v-if="isNavigatingToVerseRef" class="content-loading-overlay">
            <div class="loading-spinner"></div>
            <p>Loading verse...</p>
          </div>
          
          <div v-if="chapters.length === 0" class="select-prompt">
            No chapters available for this book.
          </div>
          
          <div v-else-if="!selectedChapter" class="select-prompt">
            Please select a chapter from the dropdown above.
          </div>
          
          <div v-else class="continuous-scroll-container">
            <!-- Navigation Buttons -->
            <div class="chapter-nav-buttons top">
              <button 
                v-if="getPreviousChapter(Array.from(loadedChapters.keys()).sort((a, b) => {
                  const chA = chapters.find(ch => ch.chapter_id === a);
                  const chB = chapters.find(ch => ch.chapter_id === b);
                  return parseInt(chA?.chapter_number || '0') - parseInt(chB?.chapter_number || '0');
                })[0])"
                @click="loadPreviousChapterManually"
                class="nav-btn prev-btn"
                :disabled="isLoadingChapter"
                title="Load Previous Chapter"
              >
                <i class="bi bi-chevron-up"></i>
              </button>
            </div>
            <!-- Book Header (Introduction) -->
            <div v-if="book?.book_header" class="book-header-section">
              <div 
                class="book-header-content"
                :class="{ 'hide-superscript': !showSuperscript }"
                :style="{ fontSize: fontSize + 'px' }"
                v-html="formatVerseWithPaleoBora(book.book_header)"
              ></div>
            </div>

            <!-- Render loaded chapters in order -->
            <div 
              v-for="chapterData in orderedLoadedChapters" 
              :key="chapterData.chapter.chapter_id"
              :id="`chapter-${chapterData.chapter.chapter_id}`"
              :ref="el => setChapterRef(chapterData.chapter.chapter_id, el as HTMLElement)"
              :data-chapter-id="chapterData.chapter.chapter_id"
              class="chapter-section"
            >
              <div class="book-header">
                <h1>
                  <span class="chapter-indicator">Chapter {{ chapterData.chapter.chapter_number }}</span>
                </h1>
                <p v-if="chapterData.chapter.chapter_description" class="book-description">
                  {{ chapterData.chapter.chapter_description }}
                </p>
              </div>

              <div v-if="chapterData.verses.length === 0" class="no-verses">
                No verses found for this chapter.
              </div>
              
              <div v-else class="verses-list">
                <div 
                  v-for="verse in chapterData.verses" 
                  :key="verse.verse_id"
                  :id="`verse-${verse.verse_id}`"
                  :data-verse-id="verse.verse_id"
                  class="verse-item"
                  @pointerdown="handleVerseLongPressStart($event, verse)"
                  @pointerup="handleVerseLongPressEnd"
                  @pointercancel="handleVerseLongPressEnd"
                  @click="handleVerseTap"
                >
                  <div class="verse-main">
                    <span class="verse-number">{{ verse.verse_index }}</span>
                    <span v-if="showEnglish" class="verse-text" :class="{ 'hide-superscript': !showSuperscript, 'bold-text': boldVerseText }" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.verse)"></span>
                  </div>
                  
                  <div v-if="showTelugu && verse.telugu_verse" class="verse-telugu" :class="{ 'hide-superscript': !showSuperscript, 'bold-text': boldVerseText }" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
                  
                  <div v-if="verse.links && verse.links.length > 0" class="verse-links">
                      <a 
                        v-for="link in verse.links" 
                        :key="link.target_verse_id"
                        href="#"
                        class="link-badge"
                        :title="`Go to ${link.target_book_name} ${link.target_chapter_number}:${link.target_verse_index}`"
                        @pointerup.prevent="navigateToVerse(link.target_book_id, link.target_chapter_id, link.target_verse_id)"
                      >
                        {{ link.target_book_name }} {{ link.target_chapter_number }}:{{ link.target_verse_index }}
                      </a>
                    </div>
                    
                    <div v-if="showCrossReferences && verse.crossReferences && verse.crossReferences.length > 0" class="verse-cross-references">
                      <a 
                        v-for="crossRef in (expandedCrossRefs.has(verse.verse_id) ? verse.crossReferences : verse.crossReferences.slice(0, 10))" 
                        :key="crossRef.cross_ref_id"
                        href="#"
                        class="cross-ref-badge"
                        :title="`Preview ${crossRef.to_book_name} ${crossRef.to_chapter}:${crossRef.to_verse} (${crossRef.votes} votes)`"
                        @pointerup="showCrossRefTooltip($event, crossRef)"
                      >
                        {{ crossRef.to_book_abbr || crossRef.to_book_name }} {{ crossRef.to_chapter }}:{{ crossRef.to_verse }}
                      </a>
                      <span 
                        v-if="verse.crossReferences.length > 10" 
                        class="cross-ref-more"
                        @click="toggleCrossRefs(verse.verse_id)"
                      >
                        {{ expandedCrossRefs.has(verse.verse_id) ? 'show less' : `+${verse.crossReferences.length - 10} more` }}
                      </span>
                    </div>
                    
                    <div v-if="showNotes && verse.notes && verse.notes.length > 0" class="verse-notes">
                      <div v-for="note in verse.notes" :key="note.note_id" class="note-item">
                        <div v-if="note.note_title" class="note-title" :class="{ 'hide-superscript': !showSuperscript }" v-html="formatVerseWithPaleoBora(note.note_title)"></div>
                        <div class="note-content" :class="{ 'hide-superscript': !showSuperscript }" v-html="formatVerseWithPaleoBora(note.note_content)"></div>
                      </div>
                    </div>
                </div>
              </div>
            </div>

            <!-- Book Footer (Conclusion) -->
            <div v-if="book?.book_footer" class="book-footer-section">
              <div 
                class="book-footer-content"
                :class="{ 'hide-superscript': !showSuperscript }"
                :style="{ fontSize: fontSize + 'px' }"
                v-html="formatVerseWithPaleoBora(book.book_footer)"
              ></div>
            </div>

            <!-- Loading indicator for adjacent chapters -->
            <div v-if="isLoadingAdjacentChapter" class="loading-adjacent">
              Loading more chapters...
            </div>
            
            <!-- Bottom Navigation Button -->
            <div class="chapter-nav-buttons bottom">
              <button 
                v-if="getNextChapter(Array.from(loadedChapters.keys()).sort((a, b) => {
                  const chA = chapters.find(ch => ch.chapter_id === a);
                  const chB = chapters.find(ch => ch.chapter_id === b);
                  return parseInt(chA?.chapter_number || '0') - parseInt(chB?.chapter_number || '0');
                })[Array.from(loadedChapters.keys()).length - 1])"
                @click="loadNextChapterManually"
                class="nav-btn next-btn"
                :disabled="isLoadingChapter"
                title="Load Next Chapter"
              >
                <i class="bi bi-chevron-down"></i>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Verse Picker -->
    <VersePicker
      :is-open="showVersePicker"
      :initial-book-id="book?.book_id"
      :initial-chapter-id="selectedChapterId ?? undefined"
      @close="showVersePicker = false"
      @select="handleVerseSelection"
      @update="handleVersePickerUpdate"
    />

    <!-- Verse Search -->
    <VerseSearch
      :is-open="showSearchModal"
      @close="showSearchModal = false"
      @select="handleVerseSelection"
    />

    <!-- Search Results Navigation -->
    <div v-if="hasSearchResults" class="search-navigation-bar">
      <button class="clear-search-btn" @click="clearSearchResults" title="Clear search results">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <span class="search-results-text">{{ searchResultsText }}</span>
      <div class="search-nav-buttons">
        <button class="search-nav-btn" @click="goToPreviousSearchResult" title="Previous result">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="search-nav-btn" @click="goToNextSearchResult" title="Next result">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <!-- Cross-Reference Tooltip -->
    <div 
      v-if="crossRefTooltip.show" 
      class="cross-ref-tooltip"
      :style="{ top: `${crossRefTooltip.y}px`, left: `${crossRefTooltip.x}px` }"
      @click.stop
    >
      <div class="tooltip-header">
        <span class="tooltip-title">{{ crossRefTooltip.bookName }} {{ crossRefTooltip.chapterNumber }}:{{ crossRefTooltip.verseNumber }}</span>
        <button class="tooltip-popout" @click="navigateFromTooltip" title="Go to verse">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        <button class="tooltip-close" @click="closeCrossRefTooltip">&times;</button>
      </div>
      <div class="tooltip-content">
        <div v-if="crossRefTooltip.loading" class="tooltip-loading">
          <div class="loading-spinner"></div>
          <p>Loading verse...</p>
        </div>
        <div v-else>
          <div v-if="showEnglish && crossRefTooltip.verseText" class="tooltip-verse" :class="{ 'hide-superscript': !showSuperscript }" v-html="crossRefTooltip.verseText"></div>
          <div v-if="showTelugu && crossRefTooltip.teluguVerseText" class="tooltip-verse telugu-verse" v-html="crossRefTooltip.teluguVerseText"></div>
        </div>
      </div>
    </div>

    <!-- Context Menu for Verse References -->
    <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
    >
      <button @click="handleGoToVerse" class="context-menu-item">
        Go to verse
      </button>
      <button @click="handleSearch" class="context-menu-item">
        Search
      </button>
    </div>

    <!-- Settings Modal -->
    <Settings
      :is-open="showSettingsModal"
      @close="showSettingsModal = false"
      @settings-change="handleSettingsChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getChaptersByBookId } from '@/api/chapters';
import { getBookById, getAllBooks } from '@/api/books';
import { getVersesByChapterId } from '@/api/verses';
import { getCrossReferences, type CrossReferenceData } from '@/api/crossReferences';
import VersePicker from '@/components/VersePicker.vue';
import VerseSearch from '@/components/VerseSearch.vue';
import Settings from '@/components/Settings.vue';
import { BOOKS_DATA } from '@/utils/versePickerData';

interface Book {
  book_id: number;
  book_name: string;
  book_abbr?: string | null;
  book_description?: string | null;
  book_header?: string | null;
  book_footer?: string | null;
}

interface Chapter {
  chapter_id: number;
  book_id: number;
  chapter_number: string;
  chapter_description?: string | null;
  chapter_notes?: string | null;
}

interface Verse {
  verse_id: number;
  chapter_id: number;
  verse_index: number | null;
  verse: string;
  telugu_verse?: string | null;
  verse_links?: string | null;
  verse_notes?: string | null;
  links?: Array<{
    target_book_id: number;
    target_chapter_id: number;
    target_verse_id: number;
    target_book_name: string;
    target_chapter_number: string;
    target_verse_index: number;
  }>;
  notes?: Array<{
    note_id: number;
    note_title?: string | null;
    note_content: string;
  }>;
  crossReferences?: CrossReferenceData[];
}

interface LoadedChapterData {
  chapter: Chapter;
  verses: Verse[];
}

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

const route = useRoute();
const router = useRouter();
const allBooks = ref<any[]>([]);
const bookAbbreviations = ref<Record<string, number>>({});
const book = ref<Book | null>(null);
const chapters = ref<Chapter[]>([]);
const loadedChapters = ref<Map<number, LoadedChapterData>>(new Map());
const selectedChapter = ref<Chapter | null>(null);
const selectedChapterId = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isLoadingAdjacentChapter = ref(false);

// Settings state (managed by Settings component)
const showEnglish = ref(true);
const showTelugu = ref(true);
const showNotes = ref(true);
const showCrossReferences = ref(true);
const showSuperscript = ref(true);
const fontSize = ref(16);
const boldVerseText = ref(true);
const eInkMode = ref(false);

const showSettingsModal = ref(false);
const showVersePicker = ref(false);
const showSearchModal = ref(false);
const isNavigatingToVerseRef = ref(false);

// Search results navigation
const searchResults = ref<SearchResult[]>([]);
const currentSearchIndex = ref<number>(-1);

// Preview state for live verse picker updates
const previewBookId = ref<number | null>(null);
const previewChapterId = ref<number | null>(null);
const previewVerseId = ref<number | null>(null);

// Track the first visible verse at the top of the viewport
const firstVisibleVerseIndex = ref<number | null>(null);
const firstVisibleChapterNumber = ref<string | null>(null);

// Track which verses have expanded cross-references
const expandedCrossRefs = ref<Set<number>>(new Set());

// Track highlighted verse to prevent premature removal
const highlightedVerseId = ref<number | null>(null);
const highlightTimeout = ref<number | null>(null);
const isNavigatingToVerse = ref(false);

// Cross-reference tooltip state
const crossRefTooltip = ref<{
  show: boolean;
  x: number;
  y: number;
  loading: boolean;
  verseText: string;
  teluguVerseText: string;
  bookName: string;
  chapterNumber: string;
  verseNumber: string;
  bookId: number;
  chapterId: number;
  verseId: number;
}>({
  show: false,
  x: 0,
  y: 0,
  loading: false,
  verseText: '',
  teluguVerseText: '',
  bookName: '',
  chapterNumber: '',
  verseNumber: '',
  bookId: 0,
  chapterId: 0,
  verseId: 0
});

// Context menu state for verse reference links
const contextMenu = ref<{
  show: boolean;
  x: number;
  y: number;
  bookId: number;
  chapterNum: number;
  verseNum: number;
}>({
  show: false,
  x: 0,
  y: 0,
  bookId: 0,
  chapterNum: 0,
  verseNum: 0
});

// Refs for scroll detection
const chapterRefs = ref<Map<number, HTMLElement>>(new Map());
const intersectionObserver = ref<IntersectionObserver | null>(null);
const bottomObserver = ref<IntersectionObserver | null>(null);
const topObserver = ref<IntersectionObserver | null>(null);
const currentlyVisibleChapterId = ref<number | null>(null);
const lastScrollY = ref(0);
const isLoadingChapter = ref(false);

// Sorted chapters for dropdown
const sortedChapters = computed(() => {
  return [...chapters.value].sort((a, b) => {
    const numA = parseInt(a.chapter_number) || 0;
    const numB = parseInt(b.chapter_number) || 0;
    return numA - numB;
  });
});

// Computed properties for verse picker button display
const displayBookName = computed(() => {
  if (showVersePicker.value && previewBookId.value) {
    const previewBook = allBooks.value.find(b => b.book_id === previewBookId.value);
    return previewBook?.book_name || book.value?.book_name || '';
  }
  return book.value?.book_name || '';
});

const displayHebrewBookName = computed(() => {
  if (showVersePicker.value && previewBookId.value) {
    const previewBook = BOOKS_DATA.find(b => b.book_id === previewBookId.value);
    return previewBook?.hebrew_book_name || null;
  }
  const currentBook = BOOKS_DATA.find(b => b.book_id === book.value?.book_id);
  return currentBook?.hebrew_book_name || null;
});

const displayChapterNumber = computed(() => {
  if (showVersePicker.value && previewChapterId.value) {
    const previewChapter = chapters.value.find(c => c.chapter_id === previewChapterId.value);
    return previewChapter?.chapter_number || selectedChapter.value?.chapter_number || '';
  }
  // Show the chapter number of the first visible verse if available
  if (firstVisibleChapterNumber.value) {
    return firstVisibleChapterNumber.value;
  }
  return selectedChapter.value?.chapter_number || '';
});

const displayVerseNumber = computed(() => {
  if (firstVisibleVerseIndex.value !== null) {
    return `:${firstVisibleVerseIndex.value}`;
  }
  return '';
});

// Ordered loaded chapters for rendering
const orderedLoadedChapters = computed(() => {
  const sorted = Array.from(loadedChapters.value.values()).sort((a, b) => {
    const numA = parseInt(a.chapter.chapter_number) || 0;
    const numB = parseInt(b.chapter.chapter_number) || 0;
    return numA - numB;
  });
  return sorted;
});

// Get chapter index
function getChapterIndex(chapterId: number): number {
  return sortedChapters.value.findIndex(ch => ch.chapter_id === chapterId);
}

// Get previous chapter
function getPreviousChapter(chapterId: number): Chapter | null {
  const index = getChapterIndex(chapterId);
  if (index > 0) {
    return sortedChapters.value[index - 1];
  }
  return null;
}

// Get next chapter
function getNextChapter(chapterId: number): Chapter | null {
  const index = getChapterIndex(chapterId);
  if (index < sortedChapters.value.length - 1) {
    return sortedChapters.value[index + 1];
  }
  return null;
}

// Set chapter ref
function setChapterRef(chapterId: number, el: HTMLElement | null) {
  if (el) {
    chapterRefs.value.set(chapterId, el);
  } else {
    chapterRefs.value.delete(chapterId);
  }
}

// Load verses for a chapter
async function loadChapterVerses(chapterId: number): Promise<void> {
  if (loadedChapters.value.has(chapterId)) {
    return; // Already loaded
  }

  const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
  if (!chapter) return;

  const loadStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] 📜 Loading verses for chapter ${chapter.chapter_number} (ID: ${chapterId})...`);

  try {
    const versesStartTime = performance.now();
    const verses = await getVersesByChapterId(chapterId);
    console.log(`[${new Date().toISOString()}] ✅ Fetched ${verses.length} verses in ${(performance.now() - versesStartTime).toFixed(2)}ms`);
    
    // Store verses immediately without cross-references for faster initial load
    const versesWithoutCrossRefs = verses.map(verse => ({
      ...verse,
      crossReferences: []
    }));
    
    loadedChapters.value.set(chapterId, {
      chapter,
      verses: versesWithoutCrossRefs
    });
    
    // Lazy load cross-references in the background (don't await)
    loadCrossReferencesForChapter(chapterId, chapter, verses).catch(err => {
      console.error('Error loading cross-references:', err);
    });
    
    const totalLoadTime = performance.now() - loadStartTime;
    console.log(`[${new Date().toISOString()}] ✅ Chapter ${chapter.chapter_number} fully loaded in ${totalLoadTime.toFixed(2)}ms`);
  } catch (err) {
    console.error('Error loading chapter verses:', err);
  }
}

// Lazy load cross-references for a chapter (non-blocking)
async function loadCrossReferencesForChapter(chapterId: number, chapter: Chapter, verses: any[]): Promise<void> {
  const crossRefsStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] 🔗 Background loading cross-references for ${verses.length} verses...`);
  
  try {
    const versesWithCrossRefs = await Promise.all(
      verses.map(async (verse) => {
        try {
          const bookId = book.value?.book_id;
          if (!bookId) return { ...verse, crossReferences: [] };
          
          const crossRefs = await getCrossReferences(
            bookId,
            chapter.chapter_number,
            String(verse.verse_index || '')
          );
          return { ...verse, crossReferences: crossRefs };
        } catch (err) {
          return { ...verse, crossReferences: [] };
        }
      })
    );
    
    // Update the loaded chapters with cross-references
    loadedChapters.value.set(chapterId, {
      chapter,
      verses: versesWithCrossRefs
    });
    
    console.log(`[${new Date().toISOString()}] ✅ Cross-references loaded in background in ${(performance.now() - crossRefsStartTime).toFixed(2)}ms`);
  } catch (err) {
    console.error('Error in lazy loading cross-references:', err);
  }
}

// Load adjacent chapters (previous and next)
async function loadAdjacentChapters(chapterId: number): Promise<void> {
  const adjacentStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] 🔄 Loading adjacent chapters for chapter ID ${chapterId}...`);    isLoadingAdjacentChapter.value = true;
  
  const prevChapter = getPreviousChapter(chapterId);
  const nextChapter = getNextChapter(chapterId);
  
  console.log(`[${new Date().toISOString()}] Previous: ${prevChapter ? prevChapter.chapter_number : 'none'}, Next: ${nextChapter ? nextChapter.chapter_number : 'none'}`);    const promises: Promise<void>[] = [];
  
  if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
    promises.push(loadChapterVerses(prevChapter.chapter_id));
  }
  
  if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
    promises.push(loadChapterVerses(nextChapter.chapter_id));
  }
  
  await Promise.all(promises);
  isLoadingAdjacentChapter.value = false;
    console.log(`[${new Date().toISOString()}] ✅ Adjacent chapters loaded in ${(performance.now() - adjacentStartTime).toFixed(2)}ms`);}

// Select chapter and load it
async function selectChapter(chapter: Chapter, skipScroll: boolean = false, skipAdjacentLoad: boolean = false) {
  const selectStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] 📖 Selecting chapter ${chapter.chapter_number} (ID: ${chapter.chapter_id})`);    selectedChapter.value = chapter;
  selectedChapterId.value = chapter.chapter_id;
  
  // Load this chapter if not loaded
  const loadStartTime = performance.now();
  await loadChapterVerses(chapter.chapter_id);
  console.log(`[${new Date().toISOString()}] ✅ Chapter verses loaded in ${(performance.now() - loadStartTime).toFixed(2)}ms`);  
  // Load adjacent chapters only if not navigating to a specific verse
  if (!skipAdjacentLoad) {
    const adjacentStartTime = performance.now();
    console.log(`[${new Date().toISOString()}] 📚 Loading adjacent chapters...`);    await loadAdjacentChapters(chapter.chapter_id);
    console.log(`[${new Date().toISOString()}] ✅ Adjacent chapters loaded in ${(performance.now() - adjacentStartTime).toFixed(2)}ms`);  }
  
  // Scroll to chapter after DOM updates (unless skipScroll is true)
  if (!skipScroll) {
    await nextTick();
    scrollToChapter(chapter.chapter_id);
  }
  
  console.log(`[${new Date().toISOString()}] ✅ Chapter selection complete in ${(performance.now() - selectStartTime).toFixed(2)}ms`);}

// Scroll to chapter
function scrollToChapter(chapterId: number) {
  // Use anchor navigation for reliable scrolling
  window.location.hash = `chapter-${chapterId}`;
}

// Scroll to verse
function scrollToVerse(verseId: number) {
  console.log(`[${new Date().toISOString()}] 📍 Scrolling to verse ${verseId}...`);  const scrollStartTime = performance.now();
    // Set flag to prevent intersection observer from loading adjacent chapters
  isNavigatingToVerse.value = true;
  
  // Clear any existing highlight timeout
  if (highlightTimeout.value) {
    clearTimeout(highlightTimeout.value);
    highlightTimeout.value = null;
  }
  
  // Remove previous highlight if exists
  if (highlightedVerseId.value) {
    const prevElement = document.querySelector(`[data-verse-id="${highlightedVerseId.value}"]`);
    if (prevElement) {
      prevElement.classList.remove('highlight-verse');
    }
  }
  
  // Apply highlight after a short delay to ensure element is rendered
  setTimeout(() => {
    const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`) as HTMLElement;
    
    if (verseElement) {
      console.log(`[${new Date().toISOString()}] ✅ Verse element found in ${(performance.now() - scrollStartTime).toFixed(2)}ms`);      
      // Scroll the verse to the top of the viewport with smooth scrolling
      const navHeight = 90; // Height of the fixed top nav
      const elementTop = verseElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementTop - navHeight - 20; // 20px extra padding from top
      
      window.scrollTo({
        top: offsetPosition,
        behavior: eInkMode.value ? 'instant' : 'smooth'
      });
      
      // Apply highlight class
      verseElement.classList.add('highlight-verse');
      
      // Track this verse as highlighted
      highlightedVerseId.value = verseId;
      
      // Set up a MutationObserver to watch for class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target as HTMLElement;
            const hasHighlight = target.classList.contains('highlight-verse');
            
            // If highlight was removed, add it back
            if (!hasHighlight && target.getAttribute('data-verse-id') === String(verseId)) {
              target.classList.add('highlight-verse');
            }
          }
        });
      });
      
      observer.observe(verseElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Also set up an interval to check and re-apply the class if needed
      const intervalId = setInterval(() => {
        const el = document.querySelector(`[data-verse-id="${verseId}"]`);
        if (el && !el.classList.contains('highlight-verse')) {
          el.classList.add('highlight-verse');
        }
      }, 500);
      
      // Remove highlight after 30 seconds
      highlightTimeout.value = window.setTimeout(() => {
        const el = document.querySelector(`[data-verse-id="${verseId}"]`);
        if (el) {
          el.classList.remove('highlight-verse');
        }
        highlightedVerseId.value = null;
        observer.disconnect();
        clearInterval(intervalId);
      }, 30000);
      
      // Clear navigation flag after a delay to allow scroll to complete
      setTimeout(() => {
        isNavigatingToVerse.value = false;
        isNavigatingToVerseRef.value = false; // Clear loading spinner
        console.log(`[${new Date().toISOString()}] ✅ Scroll to verse ${verseId} completed in ${(performance.now() - scrollStartTime).toFixed(2)}ms`);      }, 1000);
    } else {
      console.warn(`[${new Date().toISOString()}] ⚠️ scrollToVerse: Could not find verse element for ID ${verseId}`);      isNavigatingToVerse.value = false;
      isNavigatingToVerseRef.value = false; // Clear loading spinner
    }
  }, 300); // Wait 300ms for anchor scroll to complete
}

// Handle verse selection from VersePicker
async function handleVerseSelection(bookId: number, chapterId: number, verseId: number, results?: SearchResult[]) {
  console.log(`[${new Date().toISOString()}] 🎯 Verse selection - Book: ${bookId}, Chapter: ${chapterId}, Verse: ${verseId}`);  const selectionStartTime = performance.now();
    showVersePicker.value = false;
  showSearchModal.value = false;
  
  // Show loading spinner immediately if navigating to different book
  const currentBookId = route.params.id ? Number(route.params.id) : book.value?.book_id;
  if (currentBookId !== bookId) {
    isNavigatingToVerseRef.value = true;
  }
  
  // Store search results if provided
  if (results && results.length > 0) {
    searchResults.value = results;
    // Find current index in search results
    currentSearchIndex.value = results.findIndex(r => r.verse_id === verseId);
  } else {
    // Clear search results when not from search
    searchResults.value = [];
    currentSearchIndex.value = -1;
  }
  
  // Clear preview values
  previewBookId.value = null;
  previewChapterId.value = null;
  previewVerseId.value = null;
  await navigateToVerse(bookId, chapterId, verseId);
}

// Handle live updates from VersePicker while scrolling
function handleVersePickerUpdate(bookId: number, chapterId: number, verseId: number) {
  previewBookId.value = bookId;
  previewChapterId.value = chapterId;
  previewVerseId.value = verseId;
}

// Navigate to verse (for cross-references)
async function navigateToVerse(bookId: number, chapterId: number, verseId: number) {
  const navStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] 🧭 Navigating to verse - Book: ${bookId}, Chapter: ${chapterId}, Verse: ${verseId}`);  
  // Check if we're on the same book (handle both old and new URL formats)
  const currentBookId = route.params.id ? Number(route.params.id) : book.value?.book_id;
  const isSameBook = currentBookId === bookId;
  console.log(`[${new Date().toISOString()}] ${isSameBook ? '✅' : '🔄'} ${isSameBook ? 'Same book' : 'Different book - will reload'}`);  
  // If same book, just select the chapter and scroll
  if (isSameBook) {
    const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
    
    if (chapter) {
      // Check if we're already on this chapter
      if (selectedChapterId.value === chapterId) {
        await nextTick();
        scrollToVerse(verseId);
      } else {
        // Clear previously loaded chapters to only show the target chapter
        loadedChapters.value.clear();
        
        // Load only the target chapter (no adjacent chapters)
        await loadChapterVerses(chapterId);
        
        // Select chapter and skip adjacent chapter loading
        await selectChapter(chapter, true, true);
        
        // Wait for chapter verses to be loaded and DOM to be ready
        let attempts = 0;
        const maxAttempts = 30; // Increase attempts for far chapters
        
        const waitForChapter = async () => {
          await nextTick();
          const chapterElement = document.querySelector(`[data-chapter-id="${chapterId}"]`);
          const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`);
          
          if (chapterElement && verseElement) {
            scrollToVerse(verseId);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(waitForChapter, 150);
          } else {
            console.warn('navigateToVerse: Chapter/verse not found in DOM after', maxAttempts, 'attempts');
            // Try scrolling anyway
            scrollToVerse(verseId);
          }
        };
        
        await waitForChapter();
      }
    } else {
      console.warn('navigateToVerse: Chapter not found!');
      console.warn('navigateToVerse: Searched for chapterId:', chapterId, 'type:', typeof chapterId);
      console.warn('navigateToVerse: Available IDs:', chapters.value.map(ch => `${ch.chapter_id} (${typeof ch.chapter_id})`));
      isNavigatingToVerseRef.value = false; // Clear loading spinner on error
    }
  } else {
    // Navigate to other book with new URL format
    const targetBook = allBooks.value.find(b => b.book_id === bookId);
    const targetChapterData = await getChaptersByBookId(bookId);
    const targetChapter = targetChapterData.find(ch => ch.chapter_id === chapterId);
    
    if (targetBook && targetChapter) {
      const bookSlug = targetBook.book_name.toLowerCase().replace(/\s+/g, '-');
      
      const chapterNum = targetChapter.chapter_number;
      
      // Check if chapter is already loaded, otherwise load it with caching
      let chapterData = loadedChapters.value.get(chapterId);
      if (!chapterData) {
        await loadChapterVerses(chapterId);
        chapterData = loadedChapters.value.get(chapterId);
      }
      
      const verse = chapterData?.verses.find(v => v.verse_id === verseId);
      const verseNum = verse ? verse.verse_index : 1;
      
      router.push(`/${bookSlug}/${chapterNum}/${verseNum}`);
    } else {
      // Fallback to old format
      router.push({
        path: `/chapters/${bookId}`,
        query: { chapterId: String(chapterId), verseId: String(verseId) }
      });
    }
  }
}

// Toggle cross-reference expansion
function toggleCrossRefs(verseId: number) {
  if (expandedCrossRefs.value.has(verseId)) {
    expandedCrossRefs.value.delete(verseId);
  } else {
    expandedCrossRefs.value.add(verseId);
  }
}

// Show cross-reference tooltip with verse preview
async function showCrossRefTooltip(event: PointerEvent | MouseEvent, crossRef: CrossReferenceData) {
  event.preventDefault();
  
  // Find the parent verse-item element to position tooltip relative to it
  const target = event.currentTarget as HTMLElement;
  const verseItem = target.closest('.verse-item') as HTMLElement;
  const rect = verseItem ? verseItem.getBoundingClientRect() : target.getBoundingClientRect();
  
  crossRefTooltip.value.show = true;
  // Position tooltip to the right of the verse-item
  crossRefTooltip.value.x = rect.right + 10;
  crossRefTooltip.value.y = rect.top;
  crossRefTooltip.value.loading = true;
  crossRefTooltip.value.bookName = crossRef.to_book_name;
  crossRefTooltip.value.chapterNumber = crossRef.to_chapter;
  crossRefTooltip.value.verseNumber = crossRef.to_verse;
  
  try {
    // Use to_book_id from database if available
    let targetBook;
    if (crossRef.to_book_id) {
      targetBook = allBooks.value.find(b => b.book_id === crossRef.to_book_id);
    } else {
      targetBook = allBooks.value.find(b => 
        b.book_abbr === crossRef.to_book_name || 
        b.book_name.toLowerCase() === crossRef.to_book_name.toLowerCase()
      );
    }
    
    if (!targetBook) {
      crossRefTooltip.value.verseText = 'Book not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    // Find the chapter
    const targetChapters = await getChaptersByBookId(targetBook.book_id);
    const targetChapter = targetChapters.find(ch => ch.chapter_number === crossRef.to_chapter);
    
    if (!targetChapter) {
      crossRefTooltip.value.verseText = 'Chapter not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    // Find the verse
    const targetVerses = await getVersesByChapterId(targetChapter.chapter_id);
    const targetVerse = targetVerses.find(v => String(v.verse_index) === crossRef.to_verse);
    
    if (!targetVerse) {
      crossRefTooltip.value.verseText = 'Verse not found';
      crossRefTooltip.value.loading = false;
      return;
    }
    
    // Store IDs for navigation
    crossRefTooltip.value.bookId = targetBook.book_id;
    crossRefTooltip.value.chapterId = targetChapter.chapter_id;
    crossRefTooltip.value.verseId = targetVerse.verse_id;
    
    // Set verse text with formatting applied
    crossRefTooltip.value.verseText = formatVerseWithPaleoBora(targetVerse.verse || '');
    crossRefTooltip.value.teluguVerseText = formatVerseWithPaleoBora(targetVerse.telugu_verse || '');
    crossRefTooltip.value.loading = false;
  } catch (err) {
    console.error('Error loading cross-reference verse:', err);
    crossRefTooltip.value.verseText = 'Error loading verse';
    crossRefTooltip.value.loading = false;
  }
}

// Navigate to cross-reference from tooltip
function navigateFromTooltip() {
  const { bookId, chapterId, verseId } = crossRefTooltip.value;
  crossRefTooltip.value.show = false;
  navigateToVerse(bookId, chapterId, verseId);
}

// Close cross-reference tooltip
function closeCrossRefTooltip() {
  crossRefTooltip.value.show = false;
}

// Handle settings change from Settings component
interface SettingsData {
  showEnglish: boolean;
  showTelugu: boolean;
  showNotes: boolean;
  showCrossReferences: boolean;
  showSuperscript: boolean;
  fontSize: number;
  boldVerseText: boolean;
  eInkMode: boolean;
}

function handleSettingsChange(settings: SettingsData) {
  showEnglish.value = settings.showEnglish;
  showTelugu.value = settings.showTelugu;
  showNotes.value = settings.showNotes;
  showCrossReferences.value = settings.showCrossReferences;
  showSuperscript.value = settings.showSuperscript;
  fontSize.value = settings.fontSize;
  boldVerseText.value = settings.boldVerseText;
  eInkMode.value = settings.eInkMode;
  
  // Apply E-Ink mode CSS class to body
  if (settings.eInkMode) {
    document.body.classList.add('e-ink-mode');
  } else {
    document.body.classList.remove('e-ink-mode');
  }
}

// Search results navigation
async function goToNextSearchResult() {
  if (searchResults.value.length === 0 || currentSearchIndex.value === -1) return;
  
  const nextIndex = (currentSearchIndex.value + 1) % searchResults.value.length;
  currentSearchIndex.value = nextIndex;
  
  const nextResult = searchResults.value[nextIndex];
  await navigateToVerse(nextResult.book_id, nextResult.chapter_id, nextResult.verse_id);
}

async function goToPreviousSearchResult() {
  if (searchResults.value.length === 0 || currentSearchIndex.value === -1) return;
  
  const prevIndex = currentSearchIndex.value === 0 
    ? searchResults.value.length - 1 
    : currentSearchIndex.value - 1;
  currentSearchIndex.value = prevIndex;
  
  const prevResult = searchResults.value[prevIndex];
  await navigateToVerse(prevResult.book_id, prevResult.chapter_id, prevResult.verse_id);
}

function clearSearchResults() {
  searchResults.value = [];
  currentSearchIndex.value = -1;
}

// Computed properties for search navigation
const hasSearchResults = computed(() => searchResults.value.length > 0);
const searchResultsText = computed(() => {
  if (!hasSearchResults.value || currentSearchIndex.value === -1) return '';
  return `${currentSearchIndex.value + 1} of ${searchResults.value.length}`;
});

// Format verse with PaleoBora font
function formatVerseWithPaleoBora(text: string): string {
  if (!text) return '';
  
  const patterns = [
    { search: /HWHY/g, replace: '<span class="paleobora-text">HWHY</span>' },
    { search: /hwhy/g, replace: '<span class="paleobora-text">hwhy</span>' },
    { search: /OSWHY/g, replace: '<span class="paleobora-text">OSWHY</span>' },
    { search: /oswhy/g, replace: '<span class="paleobora-text">oswhy</span>' },
    { search: /MYHLA/g, replace: '<span class="paleobora-text">MYHLA</span>' },
    { search: /Myhla/g, replace: '<span class="paleobora-text">Myhla</span>' },
    { search: /myhla/g, replace: '<span class="paleobora-text">myhla</span>' }
  ];
  
  let formatted = text;
  patterns.forEach(pattern => {
    formatted = formatted.replace(pattern.search, pattern.replace);
  });
  
  // Convert inline verse references like #Yech18 4 to clickable links
  // Pattern: #[4-char-abbr][chapter-number] [verse-number]
  // Using book abbreviations from allBooks
  formatted = formatted.replace(/#([a-z]{4})(\d+)\s+(\d+)/gi, (match, bookAbbr, chapter, verse) => {
    const bookId = bookAbbreviations.value[bookAbbr.toLowerCase()];
    if (bookId) {
      return `<a href="#" class="inline-verse-ref" data-book-id="${bookId}" data-chapter="${chapter}" data-verse="${verse}">${match}</a>`;
    }
    return match;
  });
  
  return formatted;
}

// Handle clicks on inline verse references using event delegation
function handleVerseRefClick(event: Event) {
  const target = event.target as HTMLElement;
  
  // Check if clicked element is an inline verse reference link
  if (target.tagName === 'A' && target.classList.contains('inline-verse-ref')) {
    event.preventDefault();
    event.stopPropagation();
    
    const bookId = parseInt(target.getAttribute('data-book-id') || '0');
    const chapterNum = parseInt(target.getAttribute('data-chapter') || '0');
    const verseNum = parseInt(target.getAttribute('data-verse') || '0');
    
    // Show context menu (position: fixed uses viewport coordinates, no scrollY needed)
    const rect = target.getBoundingClientRect();
    contextMenu.value = {
      show: true,
      x: rect.left,
      y: rect.bottom + 5,
      bookId,
      chapterNum,
      verseNum
    };
  }
}

// Handle "Go to verse" from context menu
async function handleGoToVerse() {
  const { bookId, chapterNum, verseNum } = contextMenu.value;
  contextMenu.value.show = false;
  isNavigatingToVerseRef.value = true;
  
  try {
    // If same book, find chapter and navigate
    if (Number(route.params.id) === bookId) {
    const targetChapter = chapters.value.find(ch => ch.chapter_number === String(chapterNum));
    if (targetChapter) {
      // Check if the target chapter is already loaded
      const chapterData = loadedChapters.value.get(targetChapter.chapter_id);
      let targetVerse;
      
      if (chapterData) {
        // Chapter already loaded, find verse from cached data
        targetVerse = chapterData.verses.find(v => v.verse_index === verseNum);
      } else {
        // Load chapter with caching
        await loadChapterVerses(targetChapter.chapter_id);
        const loadedData = loadedChapters.value.get(targetChapter.chapter_id);
        if (loadedData) {
          targetVerse = loadedData.verses.find(v => v.verse_index === verseNum);
        }
      }
      
      if (targetVerse) {
        await navigateToVerse(bookId, targetChapter.chapter_id, targetVerse.verse_id);
      }
    }
    } else {
      // Different book - need to load that book's chapters first
      const targetBookChapters = await getChaptersByBookId(bookId);
      const targetChapter = targetBookChapters.find(ch => ch.chapter_number === String(chapterNum));
      
      if (targetChapter) {
        const versesData = await getVersesByChapterId(targetChapter.chapter_id);
        const targetVerse = versesData.find(v => v.verse_index === verseNum);
        
        if (targetVerse) {
          await navigateToVerse(bookId, targetChapter.chapter_id, targetVerse.verse_id);
        }
      }
    }
  } catch (err) {
    console.error('Error navigating to verse:', err);
  } finally {
    isNavigatingToVerseRef.value = false;
  }
}

// Handle "Search" from context menu
function handleSearch() {
  const { bookId, chapterNum, verseNum } = contextMenu.value;
  contextMenu.value.show = false;
  
  // Get book abbreviation for search
  const book = allBooks.value.find(b => b.book_id === bookId);
  const bookAbbr = book?.book_abbr || '';
  const searchText = `#${bookAbbr}${chapterNum} ${verseNum}`;
  
  // Open search modal with the reference
  showSearchModal.value = true;
  (window as any).initialSearchQuery = searchText;
}

// Close context menu and tooltip when clicking outside
function closeContextMenu(event: Event) {
  // Don't close if clicking on verse ref link, inside context menu, or cross-ref badge
  const target = event.target as HTMLElement;
  if (target.closest('.context-menu') || 
      target.closest('.cross-ref-tooltip') || 
      target.classList.contains('inline-verse-ref') ||
      target.classList.contains('cross-ref-badge')) {
    return;
  }
  
  if (contextMenu.value.show) {
    contextMenu.value.show = false;
  }
  
  if (crossRefTooltip.value.show) {
    crossRefTooltip.value.show = false;
  }
}

// Long-press support for touch devices
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;

function handleVerseLongPressStart(event: PointerEvent | TouchEvent, verse: Verse) {
  longPressTriggered = false;
  
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    
    // Show context menu for verse actions
    const target = event.target as HTMLElement;
    const verseItem = target.closest('.verse-item') as HTMLElement;
    if (verseItem) {
      const rect = verseItem.getBoundingClientRect();
      
      // Position context menu at the center of the verse item
      contextMenu.value = {
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        bookId: book.value?.book_id || 0,
        chapterNum: parseInt(selectedChapter.value?.chapter_number || '0'),
        verseNum: verse.verse_index || 0
      };
      
      // Provide haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, 500); // 500ms for long press
}

function handleVerseLongPressEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handleVerseTap(event: PointerEvent | TouchEvent) {
  // If long press was triggered, don't handle the tap
  if (longPressTriggered) {
    event.preventDefault();
    return;
  }
}

// Manually load next chapter
function loadNextChapterManually() {
  if (isLoadingChapter.value) return;
  
  const loadedChapterIds = Array.from(loadedChapters.value.keys()).sort((a, b) => {
    const chA = chapters.value.find(ch => ch.chapter_id === a);
    const chB = chapters.value.find(ch => ch.chapter_id === b);
    const numA = parseInt(chA?.chapter_number || '0');
    const numB = parseInt(chB?.chapter_number || '0');
    return numA - numB;
  });
  
  if (loadedChapterIds.length === 0) return;
  
  const lastLoadedChapterId = loadedChapterIds[loadedChapterIds.length - 1];
  const nextChapter = getNextChapter(lastLoadedChapterId);
  
  if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
    isLoadingChapter.value = true;
    loadChapterVerses(nextChapter.chapter_id).then(() => {
      // Scroll to the newly loaded chapter
      nextTick().then(() => {
        scrollToChapter(nextChapter.chapter_id);
        isLoadingChapter.value = false;
      });
    }).catch(() => {
      isLoadingChapter.value = false;
    });
  }
}

// Manually load previous chapter
function loadPreviousChapterManually() {
  if (isLoadingChapter.value) return;
  
  const loadedChapterIds = Array.from(loadedChapters.value.keys()).sort((a, b) => {
    const chA = chapters.value.find(ch => ch.chapter_id === a);
    const chB = chapters.value.find(ch => ch.chapter_id === b);
    const numA = parseInt(chA?.chapter_number || '0');
    const numB = parseInt(chB?.chapter_number || '0');
    return numA - numB;
  });
  
  if (loadedChapterIds.length === 0) return;
  
  const firstLoadedChapterId = loadedChapterIds[0];
  const prevChapter = getPreviousChapter(firstLoadedChapterId);
  
  if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
    isLoadingChapter.value = true;
    
    // Get current scroll position
    const scrollBeforeLoad = window.scrollY;
    
    loadChapterVerses(prevChapter.chapter_id).then(async () => {
      await nextTick();
      // Maintain scroll position by calculating offset
      const newScrollY = window.scrollY;
      const offset = newScrollY - scrollBeforeLoad;
      window.scrollTo({ top: scrollBeforeLoad + offset, behavior: 'instant' });
      isLoadingChapter.value = false;
    }).catch(() => {
      isLoadingChapter.value = false;
    });
  }
}

// Track the first visible verse at the top of the viewport
function trackFirstVisibleVerse() {
  const navHeight = 90; // Height of the fixed top nav
  const topThreshold = navHeight + 10; // Small buffer below the nav
  
  // Find all verse items
  const verseItems = document.querySelectorAll('[data-verse-id]');
  
  for (const verseItem of Array.from(verseItems)) {
    const rect = verseItem.getBoundingClientRect();
    
    // Check if this verse is at or just below the top nav
    if (rect.top >= topThreshold && rect.top < topThreshold + 100) {
      const verseId = (verseItem as HTMLElement).getAttribute('data-verse-id');
      if (verseId) {
        // Find the verse in loaded chapters to get its index and chapter
        for (const chapterData of loadedChapters.value.values()) {
          const verse = chapterData.verses.find(v => v.verse_id === Number(verseId));
          if (verse && verse.verse_index !== null) {
            firstVisibleVerseIndex.value = verse.verse_index;
            firstVisibleChapterNumber.value = chapterData.chapter.chapter_number;
            return;
          }
        }
      }
    }
    
    // If verse is past the threshold, stop searching
    if (rect.top > topThreshold + 100) {
      break;
    }
  }
}

// Handle scroll for loading adjacent chapters
function handleScroll() {
  // Track first visible verse
  trackFirstVisibleVerse();
  
  if (isNavigatingToVerse.value || isLoadingChapter.value) {
    return;
  }
  
  const currentScrollY = window.scrollY;
  const scrollingDown = currentScrollY > lastScrollY.value;
  lastScrollY.value = currentScrollY;
  
  // Get first and last loaded chapters
  const loadedChapterIds = Array.from(loadedChapters.value.keys()).sort((a, b) => {
    const chA = chapters.value.find(ch => ch.chapter_id === a);
    const chB = chapters.value.find(ch => ch.chapter_id === b);
    const numA = parseInt(chA?.chapter_number || '0');
    const numB = parseInt(chB?.chapter_number || '0');
    return numA - numB;
  });
  
  if (loadedChapterIds.length === 0) return;
  
  const firstLoadedChapterId = loadedChapterIds[0];
  const lastLoadedChapterId = loadedChapterIds[loadedChapterIds.length - 1];
  
  // Check if scrolling down and near bottom
  if (scrollingDown) {
    const lastChapterElement = document.querySelector(`[data-chapter-id="${lastLoadedChapterId}"]`);
    if (lastChapterElement) {
      const rect = lastChapterElement.getBoundingClientRect();
      const distanceFromBottom = rect.bottom - window.innerHeight;
      
      // Load next chapter when within 1.5 viewports of bottom (works on mobile and desktop)
      const threshold = window.innerHeight * 1.5;
      if (distanceFromBottom < threshold) {
        const nextChapter = getNextChapter(lastLoadedChapterId);
        if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
          isLoadingChapter.value = true;
          loadChapterVerses(nextChapter.chapter_id).finally(() => {
            isLoadingChapter.value = false;
          });
        }
      }
    }
  } else {
    // Scrolling up, check if near top
    const firstChapterElement = document.querySelector(`[data-chapter-id="${firstLoadedChapterId}"]`);
    if (firstChapterElement) {
      const rect = firstChapterElement.getBoundingClientRect();
      const distanceFromTop = rect.top;
      
      // Load previous chapter when within 1.5 viewports of top (works on mobile and desktop)
      const threshold = window.innerHeight * 1.5;
      if (distanceFromTop > -threshold && distanceFromTop < threshold) {
        const prevChapter = getPreviousChapter(firstLoadedChapterId);
        if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
          isLoadingChapter.value = true;
          
          // Store scroll position relative to first chapter
          const scrollBeforeLoad = window.scrollY;
          const firstChapterTop = rect.top + scrollBeforeLoad;
          
          loadChapterVerses(prevChapter.chapter_id).then(async () => {
            await nextTick();
            // Restore position relative to the same chapter
            const newRect = firstChapterElement.getBoundingClientRect();
            const newFirstChapterTop = newRect.top + window.scrollY;
            const offset = newFirstChapterTop - firstChapterTop;
            window.scrollTo({ top: scrollBeforeLoad + offset, behavior: 'instant' });
            isLoadingChapter.value = false;
          }).catch(() => {
            isLoadingChapter.value = false;
          });
        }
      }
    }
  }
}

// Setup intersection observer for chapter visibility
function setupIntersectionObserver() {
  // Observer for chapter visibility (middle of viewport)
  const visibilityOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // Trigger when chapter is in middle of viewport
    threshold: 0
  };
  
  intersectionObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const chapterId = parseInt(entry.target.getAttribute('data-chapter-id') || '0');
        if (chapterId) {
          currentlyVisibleChapterId.value = chapterId;
          
          // Update dropdown to match visible chapter
          if (selectedChapterId.value !== chapterId) {
            selectedChapterId.value = chapterId;
            const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
            if (chapter) {
              selectedChapter.value = chapter;
            }
          }
        }
      }
    });
  }, visibilityOptions);
  
  // Observer for loading next chapter when scrolling to bottom
  const bottomOptions = {
    root: null,
    rootMargin: '0px 0px -80% 0px', // Trigger when bottom 20% of chapter is visible
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  };
  
  bottomObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isNavigatingToVerse.value) {
        const chapterId = parseInt(entry.target.getAttribute('data-chapter-id') || '0');
        if (chapterId) {
          // Check if we're near the bottom of this chapter
          const rect = entry.boundingClientRect;
          const viewportHeight = window.innerHeight;
          const bottomDistance = rect.bottom - viewportHeight;
          
          // Load next chapter when we're within 500px of the bottom
          if (bottomDistance < 500 && bottomDistance > -100) {
            const nextChapter = getNextChapter(chapterId);
            if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
              loadChapterVerses(nextChapter.chapter_id);
            }
          }
        }
      }
    });
  }, bottomOptions);
  
  // Observer for loading previous chapter when scrolling to top
  const topOptions = {
    root: null,
    rootMargin: '-80% 0px 0px 0px', // Trigger when top 20% of chapter is visible
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  };
  
  topObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isNavigatingToVerse.value) {
        const chapterId = parseInt(entry.target.getAttribute('data-chapter-id') || '0');
        if (chapterId) {
          // Check if we're near the top of this chapter
          const rect = entry.boundingClientRect;
          const topDistance = rect.top;
          
          // Load previous chapter when we're within 500px of the top
          if (topDistance < 500 && topDistance > -100) {
            const prevChapter = getPreviousChapter(chapterId);
            if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
              // Store current scroll position and the chapter element's position
              const currentScrollY = window.scrollY;
              const chapterTop = rect.top + window.scrollY;
              
              loadChapterVerses(prevChapter.chapter_id).then(async () => {
                // Wait for DOM to update
                await nextTick();
                // Calculate new position: find the chapter element again and maintain relative position
                const chapterElement = document.querySelector(`[data-chapter-id="${chapterId}"]`);
                if (chapterElement) {
                  const newRect = chapterElement.getBoundingClientRect();
                  const newChapterTop = newRect.top + window.scrollY;
                  const offset = newChapterTop - chapterTop;
                  window.scrollTo({ top: currentScrollY + offset, behavior: 'instant' });
                }
              });
            }
          }
        }
      }
    });
  }, topOptions);
  
  // Observe all chapter sections with all three observers
  chapterRefs.value.forEach((element) => {
    intersectionObserver.value?.observe(element);
    bottomObserver.value?.observe(element);
    topObserver.value?.observe(element);
  });
}

// Watch for new chapter refs and observe them
watch(() => chapterRefs.value.size, () => {
  if (intersectionObserver.value) {
    chapterRefs.value.forEach((element) => {
      intersectionObserver.value?.observe(element);
      bottomObserver.value?.observe(element);
      topObserver.value?.observe(element);
    });
  }
});

// Initialize
onMounted(async () => {
  const mountStartTime = performance.now();
  console.log(`[${new Date().toISOString()}] 🚀 Component mounting started`);
  
  loading.value = true;
  error.value = null;
  
  try {
    // Load all books for abbreviation mapping
    const booksStartTime = performance.now();
    console.log(`[${new Date().toISOString()}] 📚 Fetching all books...`);
    allBooks.value = await getAllBooks();
    console.log(`[${new Date().toISOString()}] ✅ Books loaded in ${(performance.now() - booksStartTime).toFixed(2)}ms`);
    bookAbbreviations.value = {};
    allBooks.value.forEach(b => {
      if (b.book_abbr) {
        bookAbbreviations.value[b.book_abbr.toLowerCase()] = b.book_id;
      }
    });
    
    // Determine book ID from route
    let bookId: number;
    let targetChapterNumber: string | null = null;
    let targetVerseNumber: number | null = null;
    
    if (route.params.bookName) {
      // New URL format: /:bookName/:chapterNumber/:verseNumber
      const bookName = String(route.params.bookName).replace(/-/g, ' ');
      const foundBook = allBooks.value.find(b => 
        b.book_name.toLowerCase() === bookName.toLowerCase()
      );
      
      if (!foundBook) {
        error.value = `Book not found: ${bookName}`;
        loading.value = false;
        return;
      }
      
      bookId = foundBook.book_id;
      targetChapterNumber = route.params.chapterNumber ? String(route.params.chapterNumber) : null;
      targetVerseNumber = route.params.verseNumber ? Number(route.params.verseNumber) : null;
    } else if (route.params.id) {
      // Old URL format: /chapters/:id
      bookId = Number(route.params.id);
      if (isNaN(bookId)) {
        error.value = 'Invalid book ID';
        loading.value = false;
        return;
      }
    } else {
      error.value = 'No book specified';
      loading.value = false;
      return;
    }
    
    // Load book and chapters
    const bookStartTime = performance.now();
    console.log(`[${new Date().toISOString()}] 📖 Fetching book ${bookId}...`);
    book.value = await getBookById(bookId);
    console.log(`[${new Date().toISOString()}] ✅ Book loaded in ${(performance.now() - bookStartTime).toFixed(2)}ms`);
    
    const chaptersStartTime = performance.now();
    console.log(`[${new Date().toISOString()}] 📑 Fetching chapters for book ${bookId}...`);
    chapters.value = await getChaptersByBookId(bookId);
    console.log(`[${new Date().toISOString()}] ✅ Chapters loaded (${chapters.value.length} chapters) in ${(performance.now() - chaptersStartTime).toFixed(2)}ms`);
    
    // Check for query parameters (for old format cross-references)
    const queryChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
    const queryVerseId = route.query.verseId ? Number(route.query.verseId) : null;
    
    // Determine which chapter to select
    let targetChapter: Chapter | null = null;
    let scrollToVerseId: number | null = null;
    
    if (targetChapterNumber) {
      // New URL format with chapter number
      targetChapter = chapters.value.find(ch => ch.chapter_number === targetChapterNumber) ?? null;
      
      if (!targetChapter) {
        console.error('onMounted: Could not find chapter with chapter_number:', targetChapterNumber);
        console.error('onMounted: Trying to parse as number and find by position...');
        const chapterIndex = parseInt(targetChapterNumber) - 1; // Try 0-indexed
        if (sortedChapters.value[chapterIndex]) {
          targetChapter = sortedChapters.value[chapterIndex];
        }
      }
      
      if (targetChapter && targetVerseNumber) {
        // Pre-load the chapter verses
        console.log(`[${new Date().toISOString()}] 📄 Pre-loading verses for chapter ${targetChapter.chapter_number}...`);
        await loadChapterVerses(targetChapter.chapter_id);
        
        // Find the verse from cached data instead of making another API call
        const chapterData = loadedChapters.value.get(targetChapter.chapter_id);
        if (chapterData) {
          const verse = chapterData.verses.find(v => v.verse_index === targetVerseNumber);
          if (verse) {
            scrollToVerseId = verse.verse_id;
          }
        }
      }
    } else if (queryChapterId) {
      // Old URL format with query params
      targetChapter = chapters.value.find(ch => ch.chapter_id === queryChapterId) ?? null;
      scrollToVerseId = queryVerseId;
    }
    
    if (targetChapter) {
      // Skip chapter scroll and adjacent loading if we're going to scroll to a specific verse
      const selectStartTime = performance.now();
      console.log(`[${new Date().toISOString()}] 🎯 Selecting chapter ${targetChapter.chapter_number}...`);
      await selectChapter(targetChapter, !!scrollToVerseId, !!scrollToVerseId);
      console.log(`[${new Date().toISOString()}] ✅ Chapter selected in ${(performance.now() - selectStartTime).toFixed(2)}ms`);
      
      // Verify the verse is in one of the loaded chapters
      if (scrollToVerseId) {
        let foundInChapter = null;
        for (const [chId, chData] of loadedChapters.value.entries()) {
          const verse = chData.verses.find(v => v.verse_id === scrollToVerseId);
          if (verse) {
            foundInChapter = chId;
            break;
          }
        }
        if (!foundInChapter) {
          console.error('onMounted: ERROR - Verse', scrollToVerseId, 'not found in any loaded chapter!');
          console.error('onMounted: Target chapter was:', targetChapter.chapter_id, 'with number:', targetChapter.chapter_number);
        }
      }
      
      if (scrollToVerseId) {
        await nextTick();
        scrollToVerse(scrollToVerseId);
      }
    } else if (chapters.value.length > 0) {
      // Select first chapter by default
      await selectChapter(sortedChapters.value[0]);
    }
    
    // Setup intersection observer after initial load
    await nextTick();
    setupIntersectionObserver();
    
    // Add scroll listener for loading adjacent chapters
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add event delegation for inline verse reference clicks
    document.addEventListener('click', handleVerseRefClick);
    
    // Add document click listener to close context menu
    document.addEventListener('click', closeContextMenu);
    
  } catch (err: any) {
    error.value = err.message || 'Failed to load chapters';
    console.error('Error loading chapters:', err);
  } finally {
    loading.value = false;
    const totalTime = performance.now() - mountStartTime;
    console.log(`[${new Date().toISOString()}] 🏁 Component mounted in ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
  }
});

// Watch for route changes (when navigating to different book via verse picker)
watch(() => [route.params.id, route.params.bookName, route.params.chapterNumber, route.params.verseNumber] as const, 
  async ([newId, newBookName, newChapterNumber, newVerseNumber], [oldId, oldBookName]) => {
  // Only react if book changed
  const bookChanged = (newId && newId !== oldId) || (newBookName && newBookName !== oldBookName);
  
  if (bookChanged) {
    loading.value = true;
    error.value = null;
    
    try {
      // Determine book ID from route
      let bookId: number;
      let targetChapterNumber: string | null = null;
      let targetVerseNumber: number | null = null;
      
      if (newBookName) {
        // New URL format
        const bookName = String(newBookName).replace(/-/g, ' ');
        const foundBook = allBooks.value.find(b => 
          b.book_name.toLowerCase() === bookName.toLowerCase()
        );
        
        if (!foundBook) {
          error.value = `Book not found: ${bookName}`;
          loading.value = false;
          return;
        }
        
        bookId = foundBook.book_id;
        targetChapterNumber = newChapterNumber ? String(newChapterNumber) : null;
        targetVerseNumber = newVerseNumber ? Number(newVerseNumber) : null;
      } else if (newId) {
        // Old URL format
        bookId = Number(newId);
        if (isNaN(bookId)) {
          error.value = 'Invalid book ID';
          loading.value = false;
          return;
        }
      } else {
        return;
      }

      // Clear previous data
      loadedChapters.value.clear();
      selectedChapter.value = null;
      selectedChapterId.value = null;
      
      // Load new book and chapters
      book.value = await getBookById(bookId);
      chapters.value = await getChaptersByBookId(bookId);
      
      // Determine which chapter to select
      let targetChapter: Chapter | null = null;
      let scrollToVerseId: number | null = null;
      
      if (targetChapterNumber) {
        // New URL format with chapter number
        targetChapter = chapters.value.find(ch => ch.chapter_number === targetChapterNumber) ?? null;
        
        if (targetChapter && targetVerseNumber) {
          // Pre-load the chapter verses before selecting
          await loadChapterVerses(targetChapter.chapter_id);
          
          // Use cached data instead of making another API call
          const chapterData = loadedChapters.value.get(targetChapter.chapter_id);
          if (chapterData) {
            const verse = chapterData.verses.find(v => v.verse_index === targetVerseNumber);
            if (verse) {
              scrollToVerseId = verse.verse_id;
            }
          }
        }
      } else {
        // Check for query parameters (old format)
        const queryChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
        const queryVerseId = route.query.verseId ? Number(route.query.verseId) : null;
        
        if (queryChapterId) {
          targetChapter = chapters.value.find(ch => ch.chapter_id === queryChapterId) ?? null;
          scrollToVerseId = queryVerseId;
        }
      }
      
      if (targetChapter) {
        // Skip chapter scroll and adjacent loading if we're going to scroll to a specific verse
        await selectChapter(targetChapter, !!scrollToVerseId, !!scrollToVerseId);
        if (scrollToVerseId) {
          await nextTick();
          scrollToVerse(scrollToVerseId);
        }
      } else if (chapters.value.length > 0) {
        // Select first chapter by default
        await selectChapter(sortedChapters.value[0]);
      }
      
      // Setup intersection observer for new content
      await nextTick();
      setupIntersectionObserver();
      
      // Reset scroll tracking
      lastScrollY.value = window.scrollY;
      
    } catch (err: any) {
      error.value = err.message || 'Failed to load chapters';
      console.error('Error loading chapters:', err);
    } finally {
      loading.value = false;
    }
  }
});

// Watch for loaded chapters and re-apply highlight if needed
watch(() => loadedChapters.value.size, async () => {
  // If we have a verse that should be highlighted, re-apply the highlight
  if (highlightedVerseId.value) {
    await nextTick();
    const verseElement = document.querySelector(`[data-verse-id="${highlightedVerseId.value}"]`);
    if (verseElement && !verseElement.classList.contains('highlight-verse')) {
      verseElement.classList.add('highlight-verse');
    }
  }
});

// Cleanup
onUnmounted(() => {
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect();
  }
  if (bottomObserver.value) {
    bottomObserver.value.disconnect();
  }
  if (topObserver.value) {
    topObserver.value.disconnect();
  }
  // Clear highlight timeout
  if (highlightTimeout.value) {
    clearTimeout(highlightTimeout.value);
  }
  // Remove event listeners
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleVerseRefClick);
  document.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped>
/* ============================================
   Touch Device & E-Ink Optimizations
   ============================================ */

/* Global touch optimizations */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Touch-action for scrollable areas */
.chapters-page,
.chapter-content,
.continuous-scroll-container {
  touch-action: pan-y pinch-zoom;
}

/* Touch-action for interactive elements */
button,
a,
.link-badge,
.cross-ref-badge,
.cross-ref-more,
.verse-picker-button,
.search-icon,
.settings-icon {
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

/* Minimum touch target size (44x44px) */
button,
a.link-badge,
a.cross-ref-badge {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Active states for touch feedback */
button:active,
a.link-badge:active,
a.cross-ref-badge:active {
  opacity: 0.7;
  transform: scale(0.98);
}

/* Remove hover effects on touch devices */
@media (hover: none) {
  button:hover,
  a:hover,
  .link-badge:hover,
  .cross-ref-badge:hover,
  .verse-picker-button:hover,
  .search-icon:hover,
  .settings-icon:hover {
    transform: none;
    box-shadow: none;
  }
}

/* E-Ink Mode - Disable animations and transitions */
.e-ink-mode *,
.e-ink-mode *::before,
.e-ink-mode *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}

/* E-Ink Mode - Increase contrast */
.e-ink-mode {
  filter: contrast(1.2);
}

/* E-Ink Mode - Instant scrolling */
.e-ink-mode .chapters-page {
  scroll-behavior: auto !important;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ============================================
   Base Styles
   ============================================ */

.chapters-page {
  min-height: 100vh;
}

.content-wrapper {
  width: 100%;
}

.content-layout {
  width: 100%;
}

.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #42b983 0%, #35a373 100%);
  padding: 0.75rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.chapter-content {
  position: relative; /* For absolute positioning of content-loading-overlay */
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin: 90px auto 2rem auto;
  max-width: 900px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 400px;
}

.verse-picker-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  color: #2c3e50;
  min-width: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.verse-picker-button:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.verse-picker-button:active {
  transform: translateY(0);
}

.book-names {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.hebrew-book-name {
  font-size: 1.1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.book-name {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  opacity: 0.8;
}

.chapter-verse {
  font-size: 0.9rem;
  color: #42b983;
  font-weight: 600;
  white-space: nowrap;
}

.chevron-icon {
  flex-shrink: 0;
  color: #999;
  transition: transform 0.2s;
}

.verse-picker-button:hover .chevron-icon {
  color: #42b983;
}

.search-icon,
.settings-icon {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  color: white;
}

.search-icon:hover,
.settings-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-icon:active,
.settings-icon:active {
  transform: translateY(0);
}

.search-icon svg,
.settings-icon svg {
  width: 24px;
  height: 24px;
}

.toggle-buttons-container {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  border-color: #42b983;
  color: #42b983;
}

.toggle-btn.active {
  background: #42b983;
  border-color: #42b983;
  color: white;
}

.toggle-btn.active:hover {
  background: #359670;
  border-color: #359670;
}

.chapter-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin: 80px auto 2rem auto;
  max-width: 900px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.continuous-scroll-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.chapter-section {
  scroll-margin-top: 150px; /* Account for sticky header */
}

.book-header {
  padding: 2rem 0 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
  text-align: center !important;
}

.book-header h1 {
  margin: 0;
  text-align: center;
  color: #2c3e50;
}

.chapter-indicator {
  font-size: 1.5rem;
  color: #42b983;
  font-weight: 600;
}

.book-description {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
  font-style: italic;
}

.book-header-section,
.book-footer-section {
  padding: 2rem;
  margin: 2rem 0;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.book-header-section {
  margin-top: 100px;
  border-bottom: 4px solid #42b983;
}

.book-footer-section {
  margin-bottom: 0;
  border-top: 4px solid #42b983;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.book-header-content,
.book-footer-content {
  line-height: 1.8;
  color: #333;
  text-align: left;
}

.loading, .error, .select-prompt, .no-verses {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #999;
}

.error {
  color: #e74c3c;
}

.loading-adjacent {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-style: italic;
}

.chapter-nav-buttons {
  display: none; /* Hide the manual navigation buttons for cleaner UI */
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0.5rem;
  }
  
  .chapter-content {
    padding: 1rem;
    margin: 80px 0.5rem 1rem 0.5rem;
  }
}

.verses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.verse-item {
  line-height: 1.8;
  padding: 0.5rem 0;
  transition: all 0.4s ease;
}

.verse-item.highlight-verse {
  background: linear-gradient(90deg, #fff3cd 0%, #fffbf0 100%);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
  animation: highlightPulse 0.6s ease-out;
}

@keyframes highlightPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(255, 193, 7, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
  }
}

.verse-main {
  display: block;
}

.verse-number {
  display: inline;
  font-weight: 700;
  color: #42b983;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.hide-superscript :deep(sup) {
  display: none;
}

.verse-text {
  display: block;
  color: #333;
}

.bold-text {
  font-weight: 600;
}

:deep(.verse-text p) {
  display: block;
  margin: 0;
  padding: 0;
  text-align: justify;
}

.verse-telugu {
  display: block;
  color: #666;
  font-size: 0.95rem;
  margin-top: 0.125rem;
  text-align: left;
}

:deep(.verse-telugu p) {
  margin: 0;
  padding: 0;
}

.verse-links {
  display: block;
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.link-badge {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  background: #e7f3ff;
  color: #0366d6;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 44px;
  min-width: 44px;
}

.link-badge:hover {
  background: #0366d6;
  color: white;
  transform: translateY(-1px);
}

.verse-cross-references {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-left: 3px solid #10b981;
  border-radius: 4px;
}

.cross-ref-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.cross-ref-badge {
  display: inline-block;
  padding: 0.4rem 0.6rem;
  margin: 0.25rem 0.25rem 0.25rem 0;
  background: #d1fae5;
  color: #065f46;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid #a7f3d0;
  min-height: 44px;
  min-width: 44px;
}

.cross-ref-badge:hover {
  background: #10b981;
  color: white;
  transform: translateY(-1px);
  border-color: #059669;
}

.cross-ref-more {
  display: inline-block;
  font-size: 0.75rem;
  color: #059669;
  font-weight: 600;
  font-style: normal;
  margin-left: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
  border-radius: 3px;
  border: 1px solid #bbf7d0;
  vertical-align: middle;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  min-width: 44px;
}

.cross-ref-more:hover {
  background: #dcfce7;
  transform: translateY(-1px);
  border-color: #059669;
}

/* Inline verse references within text */
:deep(.inline-verse-ref) {
  color: #0366d6;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px dotted #0366d6;
  transition: all 0.2s;
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

:deep(.inline-verse-ref:hover) {
  color: #0056b3;
  border-bottom: 1px solid #0056b3;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  padding: 4px 0;
}

.context-menu-item {
  display: block;
  width: 100%;
  padding: 12px 20px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  min-height: 44px;
  min-width: 120px;
}

.context-menu-item:hover {
  background: #f5f5f5;
}

/* Cross-Reference Tooltip */
.cross-ref-tooltip {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10001;
  min-width: 300px;
  max-width: 500px;
  overflow: hidden;
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  gap: 8px;
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  flex: 1;
}

.tooltip-popout {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;
  border-radius: 4px;
}

.tooltip-popout:hover {
  color: #007bff;
  background: #e9ecef;
}

.tooltip-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  border-radius: 4px;
}

.tooltip-close:hover {
  color: #333;
  background: #e9ecef;
}

.tooltip-content {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.tooltip-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
}

.tooltip-loading .loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
}

.tooltip-loading p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.tooltip-verse {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  padding: 15px;
  text-align: left;
}

.tooltip-verse.telugu-verse {
  font-family: 'Noto Sans Telugu', sans-serif;
  border-top: 1px solid #eee;
  padding-top: 15px;
  margin-top: 10px;
  text-align: left;
}

/* Mobile responsive tooltip */
@media (max-width: 768px) {
  .cross-ref-tooltip {
    left: 50% !important;
    transform: translateX(-50%);
    width: 90%;
    max-width: 90%;
  }
}

/* Loading Overlays */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(8px);
}

.content-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(8px);
  border-radius: 8px;
}

.loading-overlay p,
.content-loading-overlay p {
  color: #2c3e50;
  font-size: 18px;
  margin-top: 1.5rem;
  font-weight: 600;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e0e0e0;
  border-top-color: #42b983;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.verse-notes {
  display: block;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(to left, #fffbeb, transparent);
  border-right: 3px solid #f59e0b;
  border-radius: 4px;
}

.note-item {
  display: block;
  margin-bottom: 0.5rem;
}

.note-item:last-child {
  margin-bottom: 0;
}

.note-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.note-content {
  color: #78350f;
  font-size: 0.85rem;
  line-height: 1.5;
}

.paleobora-text {
  font-family: 'PaleoBora', serif !important;
  font-size: 1.1rem;
}

.verse-text :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.verse-telugu :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.note-content :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.book-header-content :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.book-footer-content :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.tooltip-verse :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

@media (max-width: 768px) {
  .chapters-page {
    padding: 0;
  }
  
  .top-nav {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .verse-picker-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }

  .book-name {
    font-size: 0.95rem;
  }

  .chapter-verse {
    font-size: 0.85rem;
  }
  
  .chapter-content {
    padding: 0.75rem;
    border-radius: 0;
  }
  
  .book-header {
    text-align: center;
  }
  
  .book-header h1 {
    font-size: 1.5rem;
    text-align: center;
  }

  .book-header-section,
  .book-footer-section {
    padding: 1rem;
    margin: 1rem 0;
  }

  .book-header-section {
    margin-top: 100px;
  }

  .section-title {
    font-size: 1.1rem;
  }
  
  .verse-item {
    gap: 0.5rem;
    font-size: 0.95rem;
  }
  
  .verse-number {
    min-width: 25px;
    font-size: 0.85rem;
  }
}

/* Search Results Navigation Bar */
.search-navigation-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  z-index: 999;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.clear-search-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.search-results-text {
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
}

.search-nav-buttons {
  display: flex;
  gap: 0.5rem;
}

.search-nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.search-nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.search-nav-btn:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .search-navigation-bar {
    bottom: 1rem;
    padding: 0.5rem 1rem;
    gap: 0.75rem;
  }

  .search-results-text {
    font-size: 0.9rem;
    min-width: 60px;
  }
}
</style>
