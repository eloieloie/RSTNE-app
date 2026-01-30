<template>
  <div v-if="isOpen" class="verse-picker-overlay" @click="close">
    <div class="verse-picker-modal" @click.stop>
      <div class="verse-picker-header">
        <h3>{{ selectedBook ? 'Select Chapter' : 'Select Book' }}</h3>
        <div class="header-controls">
          <button class="close-btn" @click="close">&times;</button>
        </div>
      </div>
      
      <div class="verse-picker-body">
        <!-- Book Categories View -->
        <div v-if="!selectedBook" class="categories-view">
          <!-- First Covenant / Old Testament -->
          <div class="category-section">
            <button 
              class="category-header"
              @click="toggleCategory('first_covenant')"
            >
              <span class="category-title">תַּנַ״ךְ | First Covenant</span>
              <span class="category-icon">{{ expandedCategories.first_covenant ? '−' : '+' }}</span>
            </button>
            <div v-if="expandedCategories.first_covenant" class="category-books">
              <div
                v-for="book in oldTestamentBooks"
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

          <!-- New Covenant / New Testament -->
          <div class="category-section">
            <button 
              class="category-header"
              @click="toggleCategory('new_covenant')"
            >
              <span class="category-title">בְּרִית חֲדָשָׁה | New Covenant</span>
              <span class="category-icon">{{ expandedCategories.new_covenant ? '−' : '+' }}</span>
            </button>
            <div v-if="expandedCategories.new_covenant" class="category-books">
              <div
                v-for="book in newTestamentBooks"
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

          <!-- Restored Apocryphal Books -->
          <div class="category-section">
            <button 
              class="category-header"
              @click="toggleCategory('apocrypha')"
            >
              <span class="category-title">ספרים חיצוניים | Restored Apocryphal Books</span>
              <span class="category-icon">{{ expandedCategories.apocrypha ? '−' : '+' }}</span>
            </button>
            <div v-if="expandedCategories.apocrypha" class="category-books">
              <div
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
        </div>

        <!-- Chapters View -->
        <div v-else class="chapters-view">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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
const selectedBook = ref<Book | null>(null);
const expandedCategories = ref({
  first_covenant: true,
  new_covenant: false,
  apocrypha: false
});

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
    chapters.value = [];
  }
});

function toggleCategory(category: 'first_covenant' | 'new_covenant' | 'apocrypha') {
  expandedCategories.value[category] = !expandedCategories.value[category];
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
  if (selectedBook.value) {
    // Get the first verse of the chapter for navigation
    const bookData = BOOKS_DATA.find(b => b.book_id === selectedBook.value!.book_id);
    if (bookData) {
      const chapterData = bookData.chapters.find(ch => ch.chapter_id === chapter.chapter_id);
      if (chapterData && chapterData.verse_ids.length > 0) {
        const firstVerseId = chapterData.verse_ids[0].verse_id;
        emit('select', selectedBook.value.book_id, chapter.chapter_id, firstVerseId);
        close();
      }
    }
  }
}

function close() {
  emit('close');
}
</script>

<style scoped>
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

.category-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.category-header {
  width: 100%;
  background: linear-gradient(135deg, #42b983 0%, #35a373 100%);
  color: white;
  border: none;
  padding: 1.25rem 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  text-align: left;
}

.category-header:hover {
  background: linear-gradient(135deg, #3aa876 0%, #2d8a5f 100%);
}

.category-title {
  flex: 1;
}

.category-icon {
  font-size: 1.5rem;
  font-weight: 700;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.category-books {
  padding: 1rem;
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

  .category-header {
    padding: 1rem;
    font-size: 1rem;
  }

  .category-icon {
    font-size: 1.25rem;
    width: 26px;
    height: 26px;
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

  .chapter-card {
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
