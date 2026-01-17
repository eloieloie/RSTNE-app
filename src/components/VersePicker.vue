<template>
  <div v-if="isOpen" class="verse-picker-overlay" @click="close">
    <div class="verse-picker-modal" @click.stop>
      <div class="verse-picker-header">
        <h3>Select Verse</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <div class="verse-picker-body">
        <div class="picker-wheels">
          <!-- Book Picker -->
          <div class="picker-column book-column">
            <div class="picker-label">Book</div>
            <div class="picker-wheel" ref="bookWheel" @scroll="onBookScroll">
              <div class="picker-spacer book-spacer"></div>
              <div
                v-for="book in books"
                :key="book.book_id"
                :class="['picker-item', 'book-item', { selected: selectedBookId === book.book_id }]"
                @click="selectBook(book.book_id)"
              >
                <div class="book-name-container">
                  <div v-if="book.hebrew_book_name" class="book-name-hebrew">{{ book.hebrew_book_name }}</div>
                  <div class="book-name-english">{{ book.book_name }}</div>
                </div>
              </div>
              <div class="picker-spacer book-spacer"></div>
            </div>
            <div class="picker-highlight book-highlight"></div>
          </div>

          <!-- Chapter Picker -->
          <div class="picker-column chapter-column">
            <div class="picker-label">Ch</div>
            <div class="picker-wheel" ref="chapterWheel" @scroll="onChapterScroll">
              <div class="picker-spacer"></div>
              <div
                v-for="chapter in chapters"
                :key="chapter.chapter_id"
                :class="['picker-item', { selected: selectedChapterId === chapter.chapter_id }]"
                @click="selectChapter(chapter.chapter_id)"
              >
                {{ chapter.chapter_number }}
              </div>
              <div class="picker-spacer"></div>
            </div>
            <div class="picker-highlight"></div>
          </div>

          <!-- Verse Picker -->
          <div class="picker-column verse-column">
            <div class="picker-label">Vs</div>
            <div class="picker-wheel" ref="verseWheel" @scroll="onVerseScroll">
              <div class="picker-spacer"></div>
              <div
                v-for="verse in verses"
                :key="verse.verse_id"
                :class="['picker-item', { selected: selectedVerseId === verse.verse_id }]"
                @click="selectVerse(verse.verse_id)"
              >
                {{ verse.verse_index }}
              </div>
              <div class="picker-spacer"></div>
            </div>
            <div class="picker-highlight"></div>
          </div>
        </div>
      </div>

      <div class="verse-picker-footer">
        <button class="cancel-btn" @click="close">Cancel</button>
        <button class="confirm-btn" @click="confirm">Go to Verse</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { BOOKS_DATA } from '@/utils/versePickerData';

interface Book {
  book_id: number;
  book_name: string;
  book_abbr: string | null;
  hebrew_book_name: string | null;
}

interface Chapter {
  chapter_id: number;
  chapter_number: number;
}

interface Verse {
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
  update: [bookId: number, chapterId: number, verseId: number];
}>();

// Use hardcoded data for instant loading
const books = ref<Book[]>(
  BOOKS_DATA.map(b => ({
    book_id: b.book_id,
    book_name: b.book_name,
    book_abbr: b.book_abbr,
    hebrew_book_name: b.hebrew_book_name
  }))
);

const chapters = ref<Chapter[]>([]);
const verses = ref<Verse[]>([]);

const selectedBookId = ref<number | null>(null);
const selectedChapterId = ref<number | null>(null);
const selectedVerseId = ref<number | null>(null);

const bookWheel = ref<HTMLElement | null>(null);
const chapterWheel = ref<HTMLElement | null>(null);
const verseWheel = ref<HTMLElement | null>(null);

const BOOK_ITEM_HEIGHT = 60; // Height for book items with Hebrew + English names
const ITEM_HEIGHT = 40; // Height for chapter and verse items
const BOOK_SPACER_HEIGHT = 140; // Spacer height for book column
const SPACER_HEIGHT = 110; // Spacer height for chapter/verse columns
const VIEWPORT_HEIGHT = 260; // Height of picker-wheels
const VIEWPORT_CENTER = VIEWPORT_HEIGHT / 2; // Center point where items align

// Load initial selection on mount
onMounted(async () => {
  // Set initial selection if provided
  if (props.initialBookId) {
    selectedBookId.value = props.initialBookId;
    loadChapters(props.initialBookId);
    
    if (props.initialChapterId) {
      selectedChapterId.value = props.initialChapterId;
      loadVerses(props.initialChapterId);
      
      if (props.initialVerseId) {
        selectedVerseId.value = props.initialVerseId;
      }
    }
  } else if (books.value.length > 0) {
    // Default to first book
    selectBook(books.value[0].book_id);
  }
});

// Watch for modal opening to refresh data and scroll to selected items
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    console.log('VersePicker opened with:', {
      bookId: props.initialBookId,
      chapterId: props.initialChapterId,
      verseId: props.initialVerseId
    });
    
    // Reload data to match current book/chapter/verse
    if (props.initialBookId) {
      selectedBookId.value = props.initialBookId;
      loadChapters(props.initialBookId);
      
      if (props.initialChapterId) {
        selectedChapterId.value = props.initialChapterId;
        loadVerses(props.initialChapterId);
        
        if (props.initialVerseId) {
          selectedVerseId.value = props.initialVerseId;
        }
      }
    }
    
    await nextTick();
    scrollToSelected();
  }
});

function selectBook(bookId: number) {
  selectedBookId.value = bookId;
  selectedChapterId.value = null;
  selectedVerseId.value = null;
  loadChapters(bookId);
  
  // Scroll to selected book
  nextTick(() => {
    if (bookWheel.value) {
      const index = books.value.findIndex(b => b.book_id === bookId);
      if (index >= 0) {
        // Calculate scrollTop to position item center at viewport center
        // itemCenterPosition = BOOK_SPACER_HEIGHT + (index * BOOK_ITEM_HEIGHT) + (BOOK_ITEM_HEIGHT / 2)
        // scrollTop = itemCenterPosition - VIEWPORT_CENTER
        const scrollTop = BOOK_SPACER_HEIGHT + (index * BOOK_ITEM_HEIGHT) + (BOOK_ITEM_HEIGHT / 2) - VIEWPORT_CENTER;
        bookWheel.value.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  });
}

function selectChapter(chapterId: number) {
  selectedChapterId.value = chapterId;
  selectedVerseId.value = null;
  loadVerses(chapterId);
  
  // Scroll to selected chapter
  nextTick(() => {
    if (chapterWheel.value) {
      const index = chapters.value.findIndex(c => c.chapter_id === chapterId);
      if (index >= 0) {
        // Calculate scrollTop to position item center at viewport center
        const scrollTop = SPACER_HEIGHT + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - VIEWPORT_CENTER;
        chapterWheel.value.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  });
}

function selectVerse(verseId: number) {
  selectedVerseId.value = verseId;
  
  // Scroll to selected verse
  nextTick(() => {
    if (verseWheel.value) {
      const index = verses.value.findIndex(v => v.verse_id === verseId);
      if (index >= 0) {
        // Calculate scrollTop to position item center at viewport center
        const scrollTop = SPACER_HEIGHT + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - VIEWPORT_CENTER;
        verseWheel.value.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  });
}

function emitUpdate() {
  // Emit live updates while scrolling
  if (selectedBookId.value && selectedChapterId.value && selectedVerseId.value) {
    emit('update', selectedBookId.value, selectedChapterId.value, selectedVerseId.value);
  }
}

function loadChapters(bookId: number) {
  const bookData = BOOKS_DATA.find(b => b.book_id === bookId);
  if (bookData) {
    chapters.value = bookData.chapters.map(ch => ({
      chapter_id: ch.chapter_id,
      chapter_number: ch.chapter_number
    }));
    
    console.log('Loaded chapters from hardcoded data:', chapters.value.map(ch => ch.chapter_id));
    
    // Auto-select first chapter if no chapter selected
    if (!selectedChapterId.value && chapters.value.length > 0) {
      selectedChapterId.value = chapters.value[0].chapter_id;
      loadVerses(chapters.value[0].chapter_id);
    }
  }
}

function loadVerses(chapterId: number) {
  // Find the book and chapter in hardcoded data
  for (const book of BOOKS_DATA) {
    const chapterData = book.chapters.find(ch => ch.chapter_id === chapterId);
    if (chapterData) {
      // Use actual verse IDs from hardcoded data
      verses.value = chapterData.verse_ids.map(v => ({
        verse_id: v.verse_id,
        verse_index: v.verse_index
      }));
      
      console.log('Loaded verses from hardcoded data:', verses.value.length);
      
      // Auto-select first verse if no verse selected
      if (!selectedVerseId.value && verses.value.length > 0) {
        selectedVerseId.value = verses.value[0].verse_id;
      }
      break;
    }
  }
}

let bookScrollTimeout: ReturnType<typeof setTimeout> | null = null;
let chapterScrollTimeout: ReturnType<typeof setTimeout> | null = null;
let verseScrollTimeout: ReturnType<typeof setTimeout> | null = null;

function onBookScroll() {
  if (!bookWheel.value) return;
  if (bookScrollTimeout) clearTimeout(bookScrollTimeout);
  
  bookScrollTimeout = setTimeout(() => {
    const scrollTop = bookWheel.value!.scrollTop;
    // Calculate which item's center is at the viewport center
    // itemCenterPosition = scrollTop + VIEWPORT_CENTER
    // index = (itemCenterPosition - BOOK_SPACER_HEIGHT - BOOK_ITEM_HEIGHT/2) / BOOK_ITEM_HEIGHT
    const itemCenterPosition = scrollTop + VIEWPORT_CENTER;
    const index = Math.round((itemCenterPosition - BOOK_SPACER_HEIGHT - BOOK_ITEM_HEIGHT / 2) / BOOK_ITEM_HEIGHT);
    if (books.value[index] && selectedBookId.value !== books.value[index].book_id) {
      selectBook(books.value[index].book_id);
      emitUpdate();
    }
  }, 150);
}

function onChapterScroll() {
  if (!chapterWheel.value) return;
  if (chapterScrollTimeout) clearTimeout(chapterScrollTimeout);
  
  chapterScrollTimeout = setTimeout(() => {
    const scrollTop = chapterWheel.value!.scrollTop;
    // Calculate which item's center is at the viewport center
    const itemCenterPosition = scrollTop + VIEWPORT_CENTER;
    const index = Math.round((itemCenterPosition - SPACER_HEIGHT - ITEM_HEIGHT / 2) / ITEM_HEIGHT);
    if (chapters.value[index] && selectedChapterId.value !== chapters.value[index].chapter_id) {
      selectChapter(chapters.value[index].chapter_id);
      emitUpdate();
    }
  }, 150);
}

function onVerseScroll() {
  if (!verseWheel.value) return;
  if (verseScrollTimeout) clearTimeout(verseScrollTimeout);
  
  verseScrollTimeout = setTimeout(() => {
    const scrollTop = verseWheel.value!.scrollTop;
    // Calculate which item's center is at the viewport center
    const itemCenterPosition = scrollTop + VIEWPORT_CENTER;
    const index = Math.round((itemCenterPosition - SPACER_HEIGHT - ITEM_HEIGHT / 2) / ITEM_HEIGHT);
    if (verses.value[index] && selectedVerseId.value !== verses.value[index].verse_id) {
      selectVerse(verses.value[index].verse_id);
      emitUpdate();
    }
  }, 150);
}

function scrollToSelected() {
  if (selectedBookId.value && bookWheel.value) {
    const index = books.value.findIndex(b => b.book_id === selectedBookId.value);
    if (index >= 0) {
      const scrollTop = BOOK_SPACER_HEIGHT + (index * BOOK_ITEM_HEIGHT) + (BOOK_ITEM_HEIGHT / 2) - VIEWPORT_CENTER;
      bookWheel.value.scrollTop = scrollTop;
    }
  }
  
  if (selectedChapterId.value && chapterWheel.value) {
    const index = chapters.value.findIndex(c => c.chapter_id === selectedChapterId.value);
    if (index >= 0) {
      const scrollTop = SPACER_HEIGHT + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - VIEWPORT_CENTER;
      chapterWheel.value.scrollTop = scrollTop;
    }
  }
  
  if (selectedVerseId.value && verseWheel.value) {
    const index = verses.value.findIndex(v => v.verse_id === selectedVerseId.value);
    if (index >= 0) {
      const scrollTop = SPACER_HEIGHT + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2) - VIEWPORT_CENTER;
      verseWheel.value.scrollTop = scrollTop;
    }
  }
}

function close() {
  emit('close');
}

function confirm() {
  console.log('VersePicker confirm clicked');
  console.log('Selected:', {
    bookId: selectedBookId.value,
    chapterId: selectedChapterId.value,
    verseId: selectedVerseId.value
  });
  
  if (selectedBookId.value && selectedChapterId.value && selectedVerseId.value) {
    console.log('Emitting select event...');
    emit('select', selectedBookId.value, selectedChapterId.value, selectedVerseId.value);
    close();
  } else {
    console.warn('Missing selection:', {
      hasBook: !!selectedBookId.value,
      hasChapter: !!selectedChapterId.value,
      hasVerse: !!selectedVerseId.value
    });
  }
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
  padding: 1rem;
}

.verse-picker-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.verse-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.verse-picker-header h3 {
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

.verse-picker-body {
  flex: 1;
  overflow: hidden;
  padding: 1rem 0;
}

.picker-wheels {
  display: flex;
  gap: 0.5rem;
  height: 260px;
  position: relative;
  padding: 0 0.5rem;
}

.picker-column {
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.picker-column.book-column {
  flex: 0 0 70%;
}

.picker-column.chapter-column {
  flex: 0 0 15%;
}

.picker-column.verse-column {
  flex: 0 0 15%;
}

.picker-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #999;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.picker-wheel {
  flex: 1;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
}

.picker-wheel::-webkit-scrollbar {
  display: none;
}

.picker-spacer {
  height: 110px;
  flex-shrink: 0;
}

.picker-spacer.book-spacer {
  height: 140px;
}

.picker-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  scroll-snap-align: center;
  user-select: none;
  padding: 0 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}

.picker-item.book-item {
  height: 60px;
  white-space: normal;
  overflow: visible;
}

.book-name-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  width: 100%;
  height: 100%;
}

.book-name-hebrew {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.book-name-english {
  font-size: 0.7rem;
  font-weight: 400;
  opacity: 0.8;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.picker-item.selected .book-name-hebrew {
  font-size: 1.3rem;
  font-weight: 700;
}

.picker-item.selected .book-name-english {
  font-size: 0.8rem;
  font-weight: 500;
}

.picker-item:hover {
  color: #777;
}

.picker-item.selected {
  color: #1a1a1a;
}

.picker-highlight {
  position: absolute;
  top: calc(50% + 18px);
  left: 0.5rem;
  right: 0.5rem;
  height: 40px;
  transform: translateY(-50%);
  background: rgba(66, 185, 131, 0.12);
  border-top: 1.5px solid rgba(66, 185, 131, 0.5);
  border-bottom: 1.5px solid rgba(66, 185, 131, 0.5);
  border-radius: 8px;
  pointer-events: none;
  z-index: 1;
}

.picker-highlight.book-highlight {
  height: 60px;
}

.verse-picker-footer {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #42b983;
  color: white;
}

.confirm-btn:hover {
  background: #3aa876;
}

@media (max-width: 768px) {
  .verse-picker-modal {
    max-width: none;
    margin: 0;
    border-radius: 12px 12px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
  }
  
  .picker-item {
    font-size: 0.9rem;
  }
  
  .picker-item.selected {
    font-size: 1rem;
  }
}
</style>
