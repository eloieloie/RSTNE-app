<template>
  <div v-if="isOpen" class="verse-picker-overlay" @click="close">
    <div class="verse-picker-modal" @click.stop>
      <div class="verse-picker-header">
        <h3>
          {{ selectedBook && selectedChapter ? `Select Verse` : selectedBook ? 'Select Chapter' : 'Select Book' }}
          <span v-if="selectedBook && selectedChapter && firstVisibleVerse" class="verse-indicator">
            - Verse {{ firstVisibleVerse }}
          </span>
        </h3>
        <div class="header-controls">
          <button class="close-btn" @click="close">&times;</button>
        </div>
      </div>
      
      <div class="verse-picker-body">
        <!-- Book Categories View -->
        <div v-if="!selectedBook" class="categories-view">
          <!-- Category Tabs -->
          <div class="category-tabs">
            <button 
              class="category-tab"
              :class="{ active: activeCategory === 'first_covenant' }"
              @click="setActiveCategory('first_covenant')"
            >
              First Covenant
            </button>
            <button 
              class="category-tab"
              :class="{ active: activeCategory === 'new_covenant' }"
              @click="setActiveCategory('new_covenant')"
            >
              New Covenant
            </button>
            <button 
              class="category-tab"
              :class="{ active: activeCategory === 'apocrypha' }"
              @click="setActiveCategory('apocrypha')"
            >
              Restored Apocryphal Books
            </button>
          </div>

          <!-- Books List -->
          <div class="category-books">
            <div
              v-if="activeCategory === 'first_covenant'"
              v-for="book in oldTestamentBooks"
              :key="book.book_id"
              class="book-item"
              @click="selectBook(book)"
            >
              <span class="book-hebrew">{{ book.hebrew_book_name || book.book_name }}</span>
              <span class="book-separator">|</span>
              <span class="book-english">{{ book.book_name }}</span>
            </div>

            <div
              v-if="activeCategory === 'new_covenant'"
              v-for="book in newTestamentBooks"
              :key="book.book_id"
              class="book-item"
              @click="selectBook(book)"
            >
              <span class="book-hebrew">{{ book.hebrew_book_name || book.book_name }}</span>
              <span class="book-separator">|</span>
              <span class="book-english">{{ book.book_name }}</span>
            </div>

            <div
              v-if="activeCategory === 'apocrypha'"
              v-for="book in apocryphaBooks"
              :key="book.book_id"
              class="book-item"
              @click="selectBook(book)"
            >
              <span class="book-hebrew">{{ book.hebrew_book_name || book.book_name }}</span>
              <span class="book-separator">|</span>
              <span class="book-english">{{ book.book_name }}</span>
            </div>
          </div>
        </div>

        <!-- Chapters View -->
        <div v-else-if="selectedBook && !selectedChapter" class="chapters-view">
          <button class="back-btn" @click="selectedBook = null">
            ← Back to Books
          </button>
          <h4 class="chapter-view-title">
            <span class="title-hebrew">{{ selectedBook.hebrew_book_name || selectedBook.book_name }}</span>
            <span class="title-separator">|</span>
            <span class="title-english">{{ selectedBook.book_name }}</span>
          </h4>
          <div class="chapters-grid">
            <div
              v-for="chapter in chapters"
              :key="chapter.chapter_id"
              class="chapter-card"
              @click="selectChapter(chapter)"
            >
              {{ chapter.chapter_number }}
            </div>
          </div>
        </div>

        <!-- Verses View -->
        <div v-else-if="selectedBook && selectedChapter" class="verses-view">
          <button class="back-btn" @click="selectedChapter = null">
            ← Back to Chapters
          </button>
          <h4 class="chapter-view-title">
            <span class="title-hebrew">{{ selectedBook.hebrew_book_name || selectedBook.book_name }}</span>
            <span class="title-separator">|</span>
            <span class="title-english">{{ selectedBook.book_name }} {{ selectedChapter.chapter_number }}</span>
          </h4>
          <div 
            ref="versesScrollContainer"
            class="verses-grid"
            @scroll="handleVersesScroll"
          >
            <div
              v-for="verseRef in verses"
              :key="verseRef.verse_id"
              :data-verse-index="verseRef.verse_index"
              class="verse-card"
              @click="selectVerse(verseRef)"
            >
              {{ verseRef.verse_index }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { BOOKS_DATA } from '@/utils/versePickerData';

interface Book {
  book_id: number;
  book_name: string;
  book_abbr: string | null;
  hebrew_book_name: string | null;
  category_id?: number;
}

interface Chapter {
  chapter_id: number;
  chapter_number: number;
}

interface VerseRef {
  verse_id: number;
  verse_index: number;
}

const props = defineProps<{
  isOpen: boolean;
  initialBookId?: number;
  initialChapterId?: number;
  initialVerseId?: number;
}>();

const emit = defineEmits<{
  close: [];
  select: [bookId: number, chapterId: number, verseId: number];
}>();

// Use hardcoded data for instant loading
const books = ref<Book[]>(
  BOOKS_DATA.map(b => ({
    book_id: b.book_id,
    book_name: b.book_name,
    book_abbr: b.book_abbr,
    hebrew_book_name: b.hebrew_book_name,
    category_id: b.category_id ?? undefined
  }))
);

const chapters = ref<Chapter[]>([]);
const verses = ref<VerseRef[]>([]);
const selectedBook = ref<Book | null>(null);
const selectedChapter = ref<Chapter | null>(null);
const activeCategory = ref<'first_covenant' | 'new_covenant' | 'apocrypha'>('first_covenant');
const firstVisibleVerse = ref<number | null>(null);
const versesScrollContainer = ref<HTMLElement | null>(null);

// Categorize books based on category_id from the API:
// Category 1: "First Covenant" (Old Testament)
// Category 2: "New Covenant" (New Testament)
// Category 3: "Restored Apocryphal Books"
const oldTestamentBooks = computed(() => 
  books.value.filter(b => b.category_id === 1)
);

const newTestamentBooks = computed(() => 
  books.value.filter(b => b.category_id === 2)
);

const apocryphaBooks = computed(() => 
  books.value.filter(b => b.category_id === 3)
);

// Reset state when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedBook.value = null;
    selectedChapter.value = null;
    chapters.value = [];
    verses.value = [];
    firstVisibleVerse.value = null;
  }
});

function setActiveCategory(category: 'first_covenant' | 'new_covenant' | 'apocrypha') {
  activeCategory.value = category;
}

function selectBook(book: Book) {
  selectedBook.value = book;
  loadChapters(book.book_id);
}

function loadChapters(bookId: number) {
  const bookData = BOOKS_DATA.find(b => b.book_id === bookId);
  if (bookData) {
    chapters.value = bookData.chapters.map(ch => ({
      chapter_id: ch.chapter_id,
      chapter_number: ch.chapter_number
    }));
  }
}

function selectChapter(chapter: Chapter) {
  selectedChapter.value = chapter;
  loadVerses(chapter.chapter_id);
}

function loadVerses(chapterId: number) {
  if (!selectedBook.value) return;
  
  const bookData = BOOKS_DATA.find(b => b.book_id === selectedBook.value!.book_id);
  if (bookData) {
    const chapterData = bookData.chapters.find(ch => ch.chapter_id === chapterId);
    if (chapterData) {
      verses.value = chapterData.verse_ids.map(v => ({
        verse_id: v.verse_id,
        verse_index: v.verse_index
      }));
      
      // Reset scroll position and first visible verse
      firstVisibleVerse.value = verses.value.length > 0 ? verses.value[0].verse_index : null;
      
      // After DOM updates, initialize scroll tracking
      nextTick(() => {
        handleVersesScroll();
      });
    }
  }
}

let scrollTimeout: number | null = null;

function handleVersesScroll() {
  // Throttle scroll events for better performance
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  scrollTimeout = window.setTimeout(() => {
    if (!versesScrollContainer.value) return;
    
    const container = versesScrollContainer.value;
    const verseCards = container.querySelectorAll('[data-verse-index]');
    
    if (verseCards.length === 0) return;
    
    // Find the first verse that's visible at the top of the scroll container
    let closestCard = null;
    let closestDistance = Infinity;
    
    for (const card of Array.from(verseCards)) {
      const rect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate distance from top of container
      const distance = Math.abs(rect.top - containerRect.top);
      
      // Find the card closest to the top of the container
      if (distance < closestDistance && rect.top >= containerRect.top - rect.height) {
        closestDistance = distance;
        closestCard = card;
      }
    }
    
    if (closestCard) {
      const verseIndex = parseInt((closestCard as HTMLElement).getAttribute('data-verse-index') || '0');
      firstVisibleVerse.value = verseIndex;
    }
  }, 50); // 50ms throttle
}

function selectVerse(verseRef: VerseRef) {
  if (selectedBook.value && selectedChapter.value) {
    emit('select', selectedBook.value.book_id, selectedChapter.value.chapter_id, verseRef.verse_id);
    close();
  }
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

.verse-picker-modal {
  touch-action: pan-y pinch-zoom;
}

.close-btn,
.back-btn,
.category-tab,
.book-item,
.chapter-card,
.verse-card {
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  min-height: 44px;
  min-width: 44px;
}

.close-btn:active,
.back-btn:active,
.category-tab:active,
.book-item:active,
.chapter-card:active,
.verse-card:active {
  opacity: 0.7;
  transform: scale(0.98);
}

/* Remove hover effects on touch devices */
@media (hover: none) {
  .close-btn:hover,
  .back-btn:hover,
  .category-tab:hover,
  .book-item:hover,
  .chapter-card:hover,
  .verse-card:hover {
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

.verse-picker-overlay {
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
}

.verse-picker-modal {
  background: white;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.verse-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #e0e0e0;
  background: linear-gradient(135deg, #42b983 0%, #35a373 100%);
  color: white;
}

.verse-picker-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verse-indicator {
  font-size: 1.25rem;
  opacity: 0.9;
  font-weight: 600;
}

.header-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 8px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.verse-picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f8f9fa;
}

/* Categories View */
.categories-view {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-tabs {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-tab {
  flex: 1;
  background: #f8f9fa;
  color: #2c3e50;
  border: 2px solid #e0e0e0;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.category-tab:hover {
  background: #e9ecef;
  border-color: #667eea;
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.category-books {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.book-item {
  padding: 0;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
  border: 2px solid transparent;
}

.book-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateX(8px);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.book-hebrew {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: right;
}

.book-separator {
  font-size: 1.5rem;
  font-weight: 700;
  opacity: 1;
  text-align: center;
  color: #667eea;
  padding: 0 0.5rem;
}

.book-english {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: left;
}

/* Chapters View */
.chapters-view {
  max-width: 1400px;
  margin: 0 auto;
}

/* Verses View */
.verses-view {
  max-width: 1400px;
  margin: 0 auto;
}

.back-btn {
  background: white;
  border: 2px solid #e0e0e0;
  color: #667eea;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.chapter-view-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.title-hebrew {
  font-size: 1.75rem;
}

.title-separator {
  opacity: 0.5;
}

.title-english {
  font-size: 1.75rem;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.chapter-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  min-height: 80px;
}

.chapter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chapter-card:active {
  transform: translateY(-2px);
}

.verses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.verse-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  min-height: 80px;
}

.verse-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.verse-card:active {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .verse-picker-header {
    padding: 1rem 1.5rem;
  }

  .verse-picker-header h3 {
    font-size: 1.25rem;
  }

  .verse-picker-body {
    padding: 1rem;
  }

  .category-tabs {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .category-tab {
    padding: 0.875rem 1rem;
    font-size: 1rem;
  }

  .category-books {
    padding: 0.75rem;
  }

  .book-item {
    padding: 0;
    flex-direction: column;
    gap: 0.5rem;
  }

  .book-item:hover {
    transform: translateX(0);
  }

  .book-hebrew {
    font-size: 1rem;
    min-width: auto;
    text-align: right;
  }

  .book-english {
    font-size: 1rem;
    min-width: auto;
    text-align: left;
  }

  .chapter-view-title {
    font-size: 1.25rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .title-hebrew,
  .title-english {
    font-size: 1.25rem;
  }

  .title-separator {
    display: none;
  }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.75rem;
  }

  .verses-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.75rem;
    max-height: 50vh;
  }

  .chapter-card {
    padding: 1rem;
    min-height: 60px;
    font-size: 1.1rem;
  }

  .verse-card {
    padding: 1rem;
    min-height: 60px;
    font-size: 1.1rem;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 1.75rem;
  }
}
</style>
