<template>
  <div class="books-page">
    <div class="page-header">
      <h1>Restoration Scriptures True Name Edition</h1>
      <p class="subtitle">Choose a book to start reading - HalleluYAHUA!</p>
      <div class="lang-selector">
        <button
          v-for="opt in langOptions"
          :key="opt.value"
          :class="['lang-btn', { active: bookNameLanguage === opt.value }]"
          @click="bookNameLanguage = opt.value"
        >{{ opt.label }}</button>
      </div>

      <button class="weekly-reading-btn" @click="router.push({ name: 'weekly-reading' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        52-Week Reading Plan
      </button>
    </div>
    
    <div v-if="loading" class="loading">Loading books...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="books.length === 0" class="empty">
      No books found. Add some books to get started!
    </div>
    
    <div v-else class="books-container">
      <!-- First Covenant -->
      <div v-if="firstCovenantBooks.length > 0" class="category-section">
        <h2 class="category-title first-covenant">First Covenant</h2>
        <div class="books-grid">
          <button 
            v-for="book in firstCovenantBooks" 
            :key="book.book_id"
            @click="openBook(book.book_id)"
            class="book-button first-covenant-book"
          >
            <div class="book-name">{{ getBookName(book) }}</div>
            <div class="book-chapters">{{ book.chapter_count || 0 }} ch.</div>
          </button>
        </div>
      </div>

      <!-- New Covenant -->
      <div v-if="newCovenantBooks.length > 0" class="category-section">
        <h2 class="category-title new-covenant">New Covenant</h2>
        <div class="books-grid">
          <button 
            v-for="book in newCovenantBooks" 
            :key="book.book_id"
            @click="openBook(book.book_id)"
            class="book-button new-covenant-book"
          >
            <div class="book-name">{{ getBookName(book) }}</div>
            <div class="book-chapters">{{ book.chapter_count || 0 }} ch.</div>
          </button>
        </div>
      </div>

      <!-- Restored Apocryphal Books -->
      <div v-if="apocryphalBooks.length > 0" class="category-section">
        <h2 class="category-title apocryphal">Restored Apocryphal Books</h2>
        <div class="books-grid">
          <button 
            v-for="book in apocryphalBooks" 
            :key="book.book_id"
            @click="openBook(book.book_id)"
            class="book-button apocryphal-book"
          >
            <div class="book-name">{{ getBookName(book) }}</div>
            <div class="book-chapters">{{ book.chapter_count || 0 }} ch.</div>
          </button>
        </div>
      </div>
    </div>

    <footer class="page-footer">
      <router-link to="/privacy-policy">Privacy Policy</router-link>
      <span class="footer-divider">·</span>
      <router-link to="/terms-and-conditions">Terms &amp; Conditions</router-link>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getAllBooks } from '@/api/books';
import type { Book } from '@/utils/collectionReferences';
import { useBookLanguage, type BookNameLanguage } from '@/composables/useBookLanguage';

const router = useRouter();
const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const { bookNameLanguage, getBookName } = useBookLanguage();

const langOptions: { value: BookNameLanguage; label: string }[] = [
  { value: 'english', label: 'EN' },
  { value: 'hebrew', label: 'HE' },
  { value: 'telugu', label: 'TE' },
];

function openBook(bookId: number) {
  router.push({ name: 'reading-pane', state: { bookId } });
}

const sortedBooks = computed(() => {
  return [...books.value].sort((a, b) => {
    const indexA = a.book_index ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.book_index ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });
});

const firstCovenantBooks = computed(() => {
  return sortedBooks.value.filter(book => book.category_id === 1);
});

const newCovenantBooks = computed(() => {
  return sortedBooks.value.filter(book => book.category_id === 2);
});

const apocryphalBooks = computed(() => {
  return sortedBooks.value.filter(book => book.category_id === 3);
});

onMounted(async () => {
  try {
    books.value = await getAllBooks();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load books';
  } finally {
    loading.value = false;
  }
});

</script>

<style scoped>
.books-page {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
  gap: 0.5rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

.lang-selector {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 0.25rem;
}

.lang-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1.5px solid #ccc;
  background: #f5f5f5;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  color: #555;
  transition: all 0.15s ease;
}

.lang-btn:hover {
  border-color: #888;
  color: #222;
}

.lang-btn.active {
  background: #2c3e50;
  border-color: #2c3e50;
  color: #fff;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.subtitle {
  color: #666;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  margin: 0;
  font-weight: 500;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.books-container {
  max-width: 1400px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 3rem;
}

.category-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
}

.category-title.first-covenant {
  color: #8B4513;
}

.category-title.new-covenant {
  color: #1E40AF;
}

.category-title.apocryphal {
  color: #6B21A8;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.book-button {
  padding: 1rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 75px;
}

.first-covenant-book {
  background: #FFF8DC;
  color: #8B4513;
  border-color: #DEB887;
}

.first-covenant-book:hover {
  background: #FFEFD5;
  border-color: #8B4513;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);
}

.new-covenant-book {
  background: #E6F2FF;
  color: #1E40AF;
  border-color: #93C5FD;
}

.new-covenant-book:hover {
  background: #DBEAFE;
  border-color: #1E40AF;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.2);
}

.apocryphal-book {
  background: #F3E8FF;
  color: #6B21A8;
  border-color: #D8B4FE;
}

.apocryphal-book:hover {
  background: #EDE9FE;
  border-color: #6B21A8;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(107, 33, 168, 0.2);
}

.book-name {
  font-size: 0.9rem;
  line-height: 1.2;
  font-weight: 700;
}

.book-chapters {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 500;
}

/* Tablet and smaller */
@media (max-width: 1024px) {
  .books-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .books-page {
    padding: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .category-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .category-section {
    margin-bottom: 2rem;
  }

  .books-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .book-button {
    padding: 0.75rem 0.5rem;
    min-height: 70px;
  }

  .book-name {
    font-size: 0.8rem;
  }

  .book-chapters {
    font-size: 0.7rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .books-page {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .category-title {
    font-size: 1.3rem;
  }

  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0;
  }

  .book-button {
    padding: 0.75rem 0.4rem;
    min-height: 65px;
    gap: 0.2rem;
  }

  .book-name {
    font-size: 0.75rem;
  }

  .book-chapters {
    font-size: 0.65rem;
  }
}

.weekly-reading-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.2rem;
  background: linear-gradient(135deg, #8B4513, #c0763a);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(139,69,19,0.3);
  margin-top: 0.25rem;
}

.weekly-reading-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(139,69,19,0.4);
  background: linear-gradient(135deg, #7a3a0f, #a8632e);
}

.page-footer {
  text-align: center;
  padding: 2rem 0 1rem;
  font-size: 0.85rem;
  color: #888;
}

.page-footer a {
  color: #8B4513;
  text-decoration: none;
}

.page-footer a:hover {
  text-decoration: underline;
}

.footer-divider {
  margin: 0 0.75rem;
  color: #888;
}
</style>
