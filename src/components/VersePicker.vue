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
          <div class="picker-column">
            <div class="picker-label">Book</div>
            <div class="picker-wheel" ref="bookWheel" @scroll="onBookScroll">
              <div class="picker-spacer"></div>
              <div
                v-for="book in books"
                :key="book.book_id"
                :class="['picker-item', { selected: selectedBookId === book.book_id }]"
                @click="selectBook(book.book_id)"
              >
                {{ book.book_name }}
              </div>
              <div class="picker-spacer"></div>
            </div>
            <div class="picker-highlight"></div>
          </div>

          <!-- Chapter Picker -->
          <div class="picker-column">
            <div class="picker-label">Chapter</div>
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
          <div class="picker-column">
            <div class="picker-label">Verse</div>
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
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { getAllBooks } from '@/api/books';
import { getChaptersByBookId } from '@/api/chapters';
import { getVersesByChapterId } from '@/api/verses';
import type { Book, Chapter, Verse } from '@/utils/collectionReferences';

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

const books = ref<Book[]>([]);
const chapters = ref<Chapter[]>([]);
const verses = ref<Verse[]>([]);

const selectedBookId = ref<number | null>(null);
const selectedChapterId = ref<number | null>(null);
const selectedVerseId = ref<number | null>(null);

const bookWheel = ref<HTMLElement | null>(null);
const chapterWheel = ref<HTMLElement | null>(null);
const verseWheel = ref<HTMLElement | null>(null);

const ITEM_HEIGHT = 40;

// Cache for chapters and verses to avoid repeated API calls
const chaptersCache = new Map<number, Chapter[]>();
const versesCache = new Map<number, Verse[]>();

// Load books on mount
onMounted(async () => {
  try {
    books.value = await getAllBooks();
    
    // Set initial selection if provided
    if (props.initialBookId) {
      selectedBookId.value = props.initialBookId;
      await loadChapters(props.initialBookId);
      
      if (props.initialChapterId) {
        selectedChapterId.value = props.initialChapterId;
        await loadVerses(props.initialChapterId);
        
        if (props.initialVerseId) {
          selectedVerseId.value = props.initialVerseId;
        }
      }
    } else if (books.value.length > 0) {
      // Default to first book
      await selectBook(books.value[0].book_id);
    }
  } catch (error) {
    console.error('Error loading books:', error);
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
      await loadChapters(props.initialBookId);
      
      if (props.initialChapterId) {
        selectedChapterId.value = props.initialChapterId;
        await loadVerses(props.initialChapterId);
        
        if (props.initialVerseId) {
          selectedVerseId.value = props.initialVerseId;
        }
      }
    }
    
    await nextTick();
    scrollToSelected();
  }
});

async function selectBook(bookId: number) {
  selectedBookId.value = bookId;
  selectedChapterId.value = null;
  selectedVerseId.value = null;
  await loadChapters(bookId);
  
  // Scroll to selected book
  await nextTick();
  if (bookWheel.value) {
    const index = books.value.findIndex(b => b.book_id === bookId);
    if (index >= 0) {
      bookWheel.value.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }
  }
}

async function selectChapter(chapterId: number) {
  selectedChapterId.value = chapterId;
  selectedVerseId.value = null;
  await loadVerses(chapterId);
  
  // Scroll to selected chapter
  await nextTick();
  if (chapterWheel.value) {
    const index = chapters.value.findIndex(c => c.chapter_id === chapterId);
    if (index >= 0) {
      chapterWheel.value.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }
  }
}

function selectVerse(verseId: number) {
  selectedVerseId.value = verseId;
  
  // Scroll to selected verse
  nextTick(() => {
    if (verseWheel.value) {
      const index = verses.value.findIndex(v => v.verse_id === verseId);
      if (index >= 0) {
        verseWheel.value.scrollTo({
          top: index * ITEM_HEIGHT,
          behavior: 'smooth'
        });
      }
    }
  });
}

async function loadChapters(bookId: number) {
  try {
    // Check cache first
    if (chaptersCache.has(bookId)) {
      console.log('Loading chapters from cache for book:', bookId);
      chapters.value = chaptersCache.get(bookId)!;
    } else {
      console.log('Fetching chapters from API for book:', bookId);
      chapters.value = await getChaptersByBookId(bookId);
      chaptersCache.set(bookId, chapters.value);
    }
    
    console.log('Loaded chapters:', chapters.value.map(ch => ch.chapter_id));
    
    // Don't auto-select first chapter if we have an initial chapter
    if (!selectedChapterId.value && chapters.value.length > 0) {
      selectedChapterId.value = chapters.value[0].chapter_id;
      await loadVerses(chapters.value[0].chapter_id);
    }
  } catch (error) {
    console.error('Error loading chapters:', error);
  }
}

async function loadVerses(chapterId: number) {
  try {
    // Check cache first
    if (versesCache.has(chapterId)) {
      console.log('Loading verses from cache for chapter:', chapterId);
      verses.value = versesCache.get(chapterId)!;
    } else {
      console.log('Fetching verses from API for chapter:', chapterId);
      verses.value = await getVersesByChapterId(chapterId);
      versesCache.set(chapterId, verses.value);
    }
    
    // Don't auto-select first verse if we have an initial verse
    if (!selectedVerseId.value && verses.value.length > 0) {
      selectedVerseId.value = verses.value[0].verse_id;
    }
  } catch (error) {
    console.error('Error loading verses:', error);
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
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (books.value[index] && selectedBookId.value !== books.value[index].book_id) {
      selectBook(books.value[index].book_id);
    }
  }, 150);
}

function onChapterScroll() {
  if (!chapterWheel.value) return;
  if (chapterScrollTimeout) clearTimeout(chapterScrollTimeout);
  
  chapterScrollTimeout = setTimeout(() => {
    const scrollTop = chapterWheel.value!.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (chapters.value[index] && selectedChapterId.value !== chapters.value[index].chapter_id) {
      selectChapter(chapters.value[index].chapter_id);
    }
  }, 150);
}

function onVerseScroll() {
  if (!verseWheel.value) return;
  if (verseScrollTimeout) clearTimeout(verseScrollTimeout);
  
  verseScrollTimeout = setTimeout(() => {
    const scrollTop = verseWheel.value!.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (verses.value[index] && selectedVerseId.value !== verses.value[index].verse_id) {
      selectVerse(verses.value[index].verse_id);
    }
  }, 150);
}

function scrollToSelected() {
  if (selectedBookId.value && bookWheel.value) {
    const index = books.value.findIndex(b => b.book_id === selectedBookId.value);
    if (index >= 0) {
      bookWheel.value.scrollTop = index * ITEM_HEIGHT;
    }
  }
  
  if (selectedChapterId.value && chapterWheel.value) {
    const index = chapters.value.findIndex(c => c.chapter_id === selectedChapterId.value);
    if (index >= 0) {
      chapterWheel.value.scrollTop = index * ITEM_HEIGHT;
    }
  }
  
  if (selectedVerseId.value && verseWheel.value) {
    const index = verses.value.findIndex(v => v.verse_id === selectedVerseId.value);
    if (index >= 0) {
      verseWheel.value.scrollTop = index * ITEM_HEIGHT;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
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

.picker-item:hover {
  color: #777;
}

.picker-item.selected {
  color: #1a1a1a;
  font-weight: 600;
  font-size: 1.1rem;
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
