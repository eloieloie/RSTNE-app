<template>
  <div class="chapters-page">
    <div v-if="loading" class="loading">
      <p>Loading chapters...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="content-wrapper">
      <div class="content-layout">
        <nav class="top-nav">
          <router-link to="/" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </router-link>
          
          <button class="verse-picker-button" @click="showVersePicker = true">
            <span class="book-name">{{ book?.book_name }}</span>
            <span v-if="selectedChapter" class="chapter-verse">
              {{ selectedChapter.chapter_number }}:{{ getCurrentVerseIndex() }}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-icon">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <button class="search-icon" @click="showSearchModal = true" title="Search Verses">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>

          <button class="settings-icon" @click="showSettingsModal = true" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </nav>

        <main class="chapter-content">
          <div v-if="chapters.length === 0" class="select-prompt">
            No chapters available for this book.
          </div>
          
          <div v-else-if="!selectedChapter" class="select-prompt">
            Please select a chapter from the dropdown above.
          </div>
          
          <div v-else class="continuous-scroll-container">
            <!-- Book Header (Introduction) -->
            <div v-if="book?.book_header" class="book-header-section">
              <div 
                class="book-header-content"
                :style="{ fontSize: fontSize + 'px' }"
                v-html="formatVerseWithPaleoBora(book.book_header)"
              ></div>
            </div>

            <!-- Render loaded chapters in order -->
            <div 
              v-for="chapterData in orderedLoadedChapters" 
              :key="chapterData.chapter.chapter_id"
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
                  :data-verse-id="verse.verse_id"
                  class="verse-item"
                >
                  <span class="verse-number">{{ verse.verse_index }}</span>
                  <div class="verse-content">
                    <div v-if="showEnglish" class="verse-text" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.verse)"></div>
                    <div v-if="showTelugu && verse.telugu_verse" class="verse-telugu" :style="{ fontSize: fontSize + 'px' }" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
                    
                    <div v-if="verse.links && verse.links.length > 0" class="verse-links">
                      <a 
                        v-for="link in verse.links" 
                        :key="link.target_verse_id"
                        href="#"
                        class="link-badge"
                        :title="`Go to ${link.target_book_name} ${link.target_chapter_number}:${link.target_verse_index}`"
                        @click.prevent="navigateToVerse(link.target_book_id, link.target_chapter_id, link.target_verse_id)"
                      >
                        {{ link.target_book_name }} {{ link.target_chapter_number }}:{{ link.target_verse_index }}
                      </a>
                    </div>
                    
                    <div v-if="showNotes && verse.notes && verse.notes.length > 0" class="verse-notes">
                      <div v-for="note in verse.notes" :key="note.note_id" class="note-item">
                        <div v-if="note.note_title" class="note-title">{{ note.note_title }}</div>
                        <div class="note-content" v-html="note.note_content"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Book Footer (Conclusion) -->
            <div v-if="book?.book_footer" class="book-footer-section">
              <div 
                class="book-footer-content"
                :style="{ fontSize: fontSize + 'px' }"
                v-html="formatVerseWithPaleoBora(book.book_footer)"
              ></div>
            </div>

            <!-- Loading indicator for adjacent chapters -->
            <div v-if="isLoadingAdjacentChapter" class="loading-adjacent">
              Loading more chapters...
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
    />

    <!-- Verse Search -->
    <VerseSearch
      :is-open="showSearchModal"
      @close="showSearchModal = false"
      @select="handleVerseSelection"
    />

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
    <div v-if="showSettingsModal" class="modal-overlay" @click="showSettingsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Settings</h3>
          <button class="close-button" @click="showSettingsModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="settings-section">
            <h4>Display Options</h4>
            <div class="settings-group">
              <label class="setting-item">
                <span>Show English Verse</span>
                <button 
                  @click="showEnglish = !showEnglish" 
                  :class="['toggle-switch', { active: showEnglish }]"
                >
                  <span class="toggle-slider"></span>
                </button>
              </label>
              <label class="setting-item">
                <span>Show Telugu Verse</span>
                <button 
                  @click="showTelugu = !showTelugu" 
                  :class="['toggle-switch', { active: showTelugu }]"
                >
                  <span class="toggle-slider"></span>
                </button>
              </label>
              <label class="setting-item">
                <span>Show Notes</span>
                <button 
                  @click="showNotes = !showNotes" 
                  :class="['toggle-switch', { active: showNotes }]"
                >
                  <span class="toggle-slider"></span>
                </button>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>Font Size</h4>
            <div class="settings-group">
              <div class="font-size-controls">
                <button class="font-btn" @click="decreaseFontSize" :disabled="fontSize <= 12">A-</button>
                <span class="font-size-display">{{ fontSize }}px</span>
                <button class="font-btn" @click="increaseFontSize" :disabled="fontSize >= 24">A+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getChaptersByBookId } from '@/api/chapters';
import { getBookById, getAllBooks } from '@/api/books';
import { getVersesByChapterId } from '@/api/verses';
import VersePicker from '@/components/VersePicker.vue';
import VerseSearch from '@/components/VerseSearch.vue';

interface Book {
  book_id: number;
  book_name: string;
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
}

interface LoadedChapterData {
  chapter: Chapter;
  verses: Verse[];
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

const showEnglish = ref(true);
const showTelugu = ref(true);
const showNotes = ref(true);
const showSettingsModal = ref(false);
const showVersePicker = ref(false);
const showSearchModal = ref(false);

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
const fontSize = ref(16);

// Refs for scroll detection
const chapterRefs = ref<Map<number, HTMLElement>>(new Map());
const intersectionObserver = ref<IntersectionObserver | null>(null);
const currentlyVisibleChapterId = ref<number | null>(null);

// Sorted chapters for dropdown
const sortedChapters = computed(() => {
  return [...chapters.value].sort((a, b) => {
    const numA = parseInt(a.chapter_number) || 0;
    const numB = parseInt(b.chapter_number) || 0;
    return numA - numB;
  });
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

  try {
    const verses = await getVersesByChapterId(chapterId);
    loadedChapters.value.set(chapterId, {
      chapter,
      verses
    });
  } catch (err) {
    console.error('Error loading chapter verses:', err);
  }
}

// Load adjacent chapters (previous and next)
async function loadAdjacentChapters(chapterId: number): Promise<void> {
  isLoadingAdjacentChapter.value = true;
  
  const prevChapter = getPreviousChapter(chapterId);
  const nextChapter = getNextChapter(chapterId);
  
  const promises: Promise<void>[] = [];
  
  if (prevChapter && !loadedChapters.value.has(prevChapter.chapter_id)) {
    promises.push(loadChapterVerses(prevChapter.chapter_id));
  }
  
  if (nextChapter && !loadedChapters.value.has(nextChapter.chapter_id)) {
    promises.push(loadChapterVerses(nextChapter.chapter_id));
  }
  
  await Promise.all(promises);
  isLoadingAdjacentChapter.value = false;
}

// Select chapter and load it
async function selectChapter(chapter: Chapter) {
  selectedChapter.value = chapter;
  selectedChapterId.value = chapter.chapter_id;
  
  // Load this chapter if not loaded
  await loadChapterVerses(chapter.chapter_id);
  
  // Load adjacent chapters
  await loadAdjacentChapters(chapter.chapter_id);
  
  // Scroll to chapter after DOM updates
  await nextTick();
  scrollToChapter(chapter.chapter_id);
}

// Scroll to chapter
function scrollToChapter(chapterId: number) {
  const element = chapterRefs.value.get(chapterId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Scroll to verse
function scrollToVerse(verseId: number) {
  console.log('scrollToVerse: Looking for verse with id:', verseId);
  setTimeout(() => {
    const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`);
    console.log('scrollToVerse: Found element:', verseElement);
    
    if (verseElement) {
      console.log('scrollToVerse: Scrolling to element...');
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      verseElement.classList.add('highlight-verse');
      setTimeout(() => verseElement.classList.remove('highlight-verse'), 13000);
    } else {
      console.warn('scrollToVerse: Verse element not found in DOM!');
    }
  }, 100);
}

// Handle verse selection from VersePicker
async function handleVerseSelection(bookId: number, chapterId: number, verseId: number) {
  console.log('ChaptersView: handleVerseSelection called with:', { bookId, chapterId, verseId });
  showVersePicker.value = false;
  console.log('ChaptersView: Calling navigateToVerse...');
  await navigateToVerse(bookId, chapterId, verseId);
  console.log('ChaptersView: navigateToVerse completed');
}

// Get current visible verse index for display
function getCurrentVerseIndex(): string {
  // Get the first verse of the currently selected chapter
  if (!selectedChapterId.value) return '1';
  
  const chapterData = loadedChapters.value.get(selectedChapterId.value);
  if (chapterData && chapterData.verses.length > 0) {
    return String(chapterData.verses[0].verse_index || 1);
  }
  return '1';
}

// Navigate to verse (for cross-references)
async function navigateToVerse(bookId: number, chapterId: number, verseId: number) {
  console.log('navigateToVerse: Starting navigation with:', { bookId, chapterId, verseId });
  console.log('navigateToVerse: Current route bookId:', route.params.id);
  console.log('navigateToVerse: chapters.value:', chapters.value);
  console.log('navigateToVerse: chapters.value length:', chapters.value.length);
  console.log('navigateToVerse: Looking for chapterId:', chapterId);
  
  // If same book, just select the chapter and scroll
  if (Number(route.params.id) === bookId) {
    console.log('navigateToVerse: Same book, finding chapter...');
    
    // Log all chapter IDs in the array
    console.log('navigateToVerse: Available chapter IDs:', chapters.value.map(ch => ch.chapter_id));
    
    const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
    console.log('navigateToVerse: Found chapter:', chapter);
    
    if (chapter) {
      console.log('navigateToVerse: Selecting chapter...');
      await selectChapter(chapter);
      await nextTick();
      console.log('navigateToVerse: Scrolling to verse:', verseId);
      scrollToVerse(verseId);
      console.log('navigateToVerse: Scroll complete');
    } else {
      console.warn('navigateToVerse: Chapter not found!');
      console.warn('navigateToVerse: Searched for chapterId:', chapterId, 'type:', typeof chapterId);
      console.warn('navigateToVerse: Available IDs:', chapters.value.map(ch => `${ch.chapter_id} (${typeof ch.chapter_id})`));
    }
  } else {
    // Navigate to other book
    console.log('navigateToVerse: Different book, routing to:', `/chapters/${bookId}`);
    router.push({
      path: `/chapters/${bookId}`,
      query: { chapterId: String(chapterId), verseId: String(verseId) }
    });
  }
}

// Font size controls
function increaseFontSize() {
  if (fontSize.value < 24) {
    fontSize.value += 2;
  }
}

function decreaseFontSize() {
  if (fontSize.value > 12) {
    fontSize.value -= 2;
  }
}

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
  
  // Convert inline verse references like #Yoch1:3 to clickable links
  // Using book abbreviations from allBooks
  formatted = formatted.replace(/#([a-z]+)(\d+):(\d+)/gi, (match, bookAbbr, chapter, verse) => {
    const bookId = bookAbbreviations.value[bookAbbr.toLowerCase()];
    console.log('Found verse ref:', match, 'bookAbbr:', bookAbbr, 'bookId:', bookId);
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
    
    console.log('Verse ref clicked:', { bookId, chapterNum, verseNum });
    
    // Show context menu
    const rect = target.getBoundingClientRect();
    contextMenu.value = {
      show: true,
      x: rect.left,
      y: rect.bottom + window.scrollY + 5,
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
  
  // If same book, find chapter and navigate
  if (Number(route.params.id) === bookId) {
    const targetChapter = chapters.value.find(ch => ch.chapter_number === String(chapterNum));
    if (targetChapter) {
      const versesData = await getVersesByChapterId(targetChapter.chapter_id);
      const targetVerse = versesData.find(v => v.verse_index === verseNum);
      
      if (targetVerse) {
        navigateToVerse(bookId, targetChapter.chapter_id, targetVerse.verse_id);
      }
    }
  } else {
    // Different book - need to load that book's chapters first
    try {
      const targetBookChapters = await getChaptersByBookId(bookId);
      const targetChapter = targetBookChapters.find(ch => ch.chapter_number === String(chapterNum));
      
      if (targetChapter) {
        const versesData = await getVersesByChapterId(targetChapter.chapter_id);
        const targetVerse = versesData.find(v => v.verse_index === verseNum);
        
        if (targetVerse) {
          navigateToVerse(bookId, targetChapter.chapter_id, targetVerse.verse_id);
        }
      }
    } catch (err) {
      console.error('Error loading target book chapters:', err);
    }
  }
}

// Handle "Search" from context menu
function handleSearch() {
  const { bookId, chapterNum, verseNum } = contextMenu.value;
  contextMenu.value.show = false;
  
  // Get book abbreviation for search
  const book = allBooks.value.find(b => b.book_id === bookId);
  const bookAbbr = book?.book_abbr || '';
  const searchText = `#${bookAbbr}${chapterNum}:${verseNum}`;
  
  // Open search modal with the reference
  showSearchModal.value = true;
  (window as any).initialSearchQuery = searchText;
}

// Close context menu when clicking outside
function closeContextMenu(event: Event) {
  // Don't close if clicking on verse ref link or inside context menu
  const target = event.target as HTMLElement;
  if (target.closest('.context-menu') || target.classList.contains('inline-verse-ref')) {
    return;
  }
  
  if (contextMenu.value.show) {
    contextMenu.value.show = false;
  }
}

// Setup intersection observer for chapter visibility
function setupIntersectionObserver() {
  const options = {
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
          
          // Load adjacent chapters when a chapter becomes visible
          loadAdjacentChapters(chapterId);
        }
      }
    });
  }, options);
  
  // Observe all chapter sections
  chapterRefs.value.forEach((element) => {
    intersectionObserver.value?.observe(element);
  });
}

// Watch for new chapter refs and observe them
watch(() => chapterRefs.value.size, () => {
  if (intersectionObserver.value) {
    chapterRefs.value.forEach((element) => {
      intersectionObserver.value?.observe(element);
    });
  }
});

// Initialize
onMounted(async () => {
  loading.value = true;
  error.value = null;
  
  const bookId = Number(route.params.id);
  if (isNaN(bookId)) {
    error.value = 'Invalid book ID';
    loading.value = false;
    return;
  }

  try {
    // Load all books for abbreviation mapping
    allBooks.value = await getAllBooks();
    bookAbbreviations.value = {};
    allBooks.value.forEach(b => {
      if (b.book_abbr) {
        bookAbbreviations.value[b.book_abbr.toLowerCase()] = b.book_id;
      }
    });
    console.log('Loaded book abbreviations:', bookAbbreviations.value);
    
    // Load book and chapters
    book.value = await getBookById(bookId);
    chapters.value = await getChaptersByBookId(bookId);
    
    // Check for query parameters (for cross-references)
    const queryChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
    const queryVerseId = route.query.verseId ? Number(route.query.verseId) : null;
    
    if (queryChapterId) {
      const chapter = chapters.value.find(ch => ch.chapter_id === queryChapterId);
      if (chapter) {
        await selectChapter(chapter);
        if (queryVerseId) {
          await nextTick();
          scrollToVerse(queryVerseId);
        }
      }
    } else if (chapters.value.length > 0) {
      // Select first chapter by default
      await selectChapter(sortedChapters.value[0]);
    }
    
    // Setup intersection observer after initial load
    await nextTick();
    setupIntersectionObserver();
    
    // Add event delegation for inline verse reference clicks
    document.addEventListener('click', handleVerseRefClick);
    
    // Add document click listener to close context menu
    document.addEventListener('click', closeContextMenu);
    
  } catch (err: any) {
    error.value = err.message || 'Failed to load chapters';
    console.error('Error loading chapters:', err);
  } finally {
    loading.value = false;
  }
});

// Watch for route changes (when navigating to different book via verse picker)
watch(() => route.params.id, async (newBookId, oldBookId) => {
  if (newBookId && newBookId !== oldBookId) {
    console.log('Route changed from book', oldBookId, 'to book', newBookId);
    loading.value = true;
    error.value = null;
    
    const bookId = Number(newBookId);
    if (isNaN(bookId)) {
      error.value = 'Invalid book ID';
      loading.value = false;
      return;
    }

    try {
      // Clear previous data
      loadedChapters.value.clear();
      selectedChapter.value = null;
      selectedChapterId.value = null;
      
      // Load new book and chapters
      book.value = await getBookById(bookId);
      chapters.value = await getChaptersByBookId(bookId);
      
      console.log('New book loaded:', book.value?.book_name);
      console.log('Query params:', route.query);
      
      // Check for query parameters (from verse picker navigation)
      const queryChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
      const queryVerseId = route.query.verseId ? Number(route.query.verseId) : null;
      
      console.log('Looking for chapter:', queryChapterId, 'verse:', queryVerseId);
      
      if (queryChapterId) {
        const chapter = chapters.value.find(ch => ch.chapter_id === queryChapterId);
        console.log('Found chapter:', chapter);
        
        if (chapter) {
          await selectChapter(chapter);
          if (queryVerseId) {
            await nextTick();
            scrollToVerse(queryVerseId);
          }
        }
      } else if (chapters.value.length > 0) {
        // Select first chapter by default
        await selectChapter(sortedChapters.value[0]);
      }
      
      // Setup intersection observer for new content
      await nextTick();
      setupIntersectionObserver();
      
    } catch (err: any) {
      error.value = err.message || 'Failed to load chapters';
      console.error('Error loading chapters:', err);
    } finally {
      loading.value = false;
    }
  }
});

// Cleanup
onUnmounted(() => {
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect();
  }
  // Remove event listeners
  document.removeEventListener('click', handleVerseRefClick);
  document.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped>
.chapters-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.content-wrapper {
  width: 100%;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  display: flex;
  align-items: center;
}

.back-link:hover {
  color: #359670;
  text-decoration: underline;
}

.verse-picker-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  color: #2c3e50;
  min-width: 0;
}

.verse-picker-button:hover {
  border-color: #42b983;
  background: #f8f9fa;
}

.verse-picker-button:active {
  transform: scale(0.98);
}

.book-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  color: #666;
}

.search-icon:hover,
.settings-icon:hover {
  background: #f0f0f0;
  color: #42b983;
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
  text-align: left;
}

.book-header h1 {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  justify-content: flex-start;
  color: #2c3e50;
}

.chapter-indicator {
  font-size: 1.5rem;
  color: #42b983;
  font-weight: 600;
}

.book-description {
  text-align: left;
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
  margin-top: 0;
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

.verses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.verse-item {
  display: flex;
  gap: 1rem;
  line-height: 1.8;
  padding: 0.5rem 0;
  transition: background-color 0.3s;
}

.verse-item.highlight-verse {
  background-color: #fff3cd;
  padding: 0.5rem;
  border-radius: 4px;
}

.verse-number {
  flex-shrink: 0;
  font-weight: 700;
  color: #42b983;
  font-size: 0.9rem;
  min-width: 30px;
}

.verse-content {
  flex: 1;
}

.verse-text {
  color: #333;
  margin-bottom: 0.125rem;
  text-align: left;
}

.verse-telugu {
  color: #666;
  font-size: 0.95rem;
  margin-top: 0.125rem;
  text-align: left;
}

.verse-links {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.link-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e7f3ff;
  color: #0366d6;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.link-badge:hover {
  background: #0366d6;
  color: white;
  transform: translateY(-1px);
}

/* Inline verse references within text */
.inline-verse-ref {
  color: #0366d6;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px dotted #0366d6;
  transition: all 0.2s;
}

.inline-verse-ref:hover {
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
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.context-menu-item:hover {
  background: #f5f5f5;
}

.verse-notes {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
}

.note-item {
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

/* Settings Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-button:hover {
  background: #e9ecef;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background 0.2s;
}

.setting-item:hover {
  background: #e9ecef;
}

.setting-item span {
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: #ccc;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.3s;
  padding: 0;
}

.toggle-switch.active {
  background: #42b983;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
  display: block;
}

.toggle-switch.active .toggle-slider {
  transform: translateX(24px);
}

/* Font Size Controls */
.font-size-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.font-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.font-btn:hover:not(:disabled) {
  border-color: #42b983;
  color: #42b983;
  background: #f0fdf8;
}

.font-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-size-display {
  font-size: 1rem;
  font-weight: 600;
  color: #42b983;
  min-width: 50px;
  text-align: center;
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
  
  .book-header h1 {
    font-size: 1.5rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .book-header-section,
  .book-footer-section {
    padding: 1rem;
    margin: 1rem 0;
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
</style>
