<template>
  <div class="manage-chapters">
    <header class="page-header">
      <h1>Manage Chapters</h1>
      <div class="header-actions">
        <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
      </div>
    </header>

    <div class="chapters-container">
      <div v-if="loading" class="loading">Loading chapters...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="Object.keys(groupedChapters).length === 0" class="empty">No chapters found</div>
      
      <div v-else>
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
        <div class="books-list">
          <div v-for="book in filteredBooks" :key="book.book_id" class="book-section">
            <template v-if="groupedChapters[book.book_id]">
              <div 
                class="book-title" 
                :class="{ 'expanded': expandedBookId === book.book_id }"
                @click="toggleBook(book.book_id)"
              >
                <span class="book-hebrew">{{ book.hebrew_book_name || book.book_name }}</span>
                <span class="book-separator">|</span>
                <span class="book-english">{{ book.book_name }}</span>
                <span class="expand-icon">{{ expandedBookId === book.book_id ? '▼' : '▶' }}</span>
              </div>
              <div v-if="expandedBookId === book.book_id" class="chapters-grid">
                <router-link
                  v-for="chapter in groupedChapters[book.book_id]"
                  :key="chapter.chapter_id"
                  :to="`/admin/chapters/${chapter.chapter_id}`"
                  class="chapter-link"
                >
                  <span class="chapter-number">{{ chapter.chapter_number }}</span>
                </router-link>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getAllBooks } from '@/api/books';
import { getAllChapters } from '@/api/chapters';
import type { Book, Chapter } from '@/utils/collectionReferences';

const books = ref<Book[]>([]);
const chapters = ref<Chapter[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const expandedBookId = ref<number | null>(null);
const activeCategory = ref<'first_covenant' | 'new_covenant' | 'apocrypha'>('first_covenant');

function toggleBook(bookId: number) {
  expandedBookId.value = expandedBookId.value === bookId ? null : bookId;
}

function setActiveCategory(category: 'first_covenant' | 'new_covenant' | 'apocrypha') {
  activeCategory.value = category;
  expandedBookId.value = null; // Close any expanded book when switching tabs
}

// Sort books by book_index
const sortedBooks = computed(() => {
  return [...books.value].sort((a, b) => {
    const indexA = a.book_index ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.book_index ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });
});

// Filter books by active category
const filteredBooks = computed(() => {
  const categoryId = activeCategory.value === 'first_covenant' ? 1 
    : activeCategory.value === 'new_covenant' ? 2 
    : 3;
  
  return sortedBooks.value.filter(book => book.category_id === categoryId);
});

// Group chapters by book_id and sort by chapter_number
const groupedChapters = computed(() => {
  const grouped: Record<number, Chapter[]> = {};
  
  chapters.value.forEach(chapter => {
    if (!grouped[chapter.book_id]) {
      grouped[chapter.book_id] = [];
    }
    grouped[chapter.book_id].push(chapter);
  });
  
  // Sort chapters within each book by chapter_number
  Object.keys(grouped).forEach(bookId => {
    grouped[Number(bookId)].sort((a, b) => {
      const aNum = parseFloat(a.chapter_number) || 0;
      const bNum = parseFloat(b.chapter_number) || 0;
      return aNum - bNum;
    });
  });
  
  // Create ordered object based on sortedBooks
  const orderedGrouped: Record<number, Chapter[]> = {};
  sortedBooks.value.forEach(book => {
    if (grouped[book.book_id]) {
      orderedGrouped[book.book_id] = grouped[book.book_id];
    }
  });
  
  return orderedGrouped;
});

onMounted(() => {
  loadData();
});

async function loadData() {
  try {
    loading.value = true;
    const [booksData, chaptersData] = await Promise.all([
      getAllBooks(),
      getAllChapters()
    ]);
    books.value = booksData;
    chapters.value = chaptersData;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load data';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.manage-chapters {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.chapters-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #e74c3c;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.category-tab {
  flex: 1;
  background: white;
  color: #2c3e50;
  border: 2px solid #e0e0e0;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
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

.books-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.book-section {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.75rem;
}

.book-section:last-child {
  border-bottom: none;
}

.book-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s;
}

.book-title:hover {
  background: #e9ecef;
}

.book-title.expanded {
  background: #667eea;
  color: white;
}

.book-title.expanded .book-hebrew,
.book-title.expanded .book-english {
  color: white;
}

.book-hebrew {
  text-align: right;
  color: #667eea;
}

.book-separator {
  color: #999;
  font-weight: 400;
}

.book-english {
  text-align: left;
  color: #2c3e50;
}

.expand-icon {
  margin-left: auto;
  font-size: 1rem;
  color: #667eea;
}

.book-title.expanded .expand-icon {
  color: white;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 0.75rem;
}

.chapter-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 55px;
}

.chapter-link:hover {
  background: #667eea;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.chapter-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
}

.chapter-link:hover .chapter-number {
  color: white;
}

@media (max-width: 768px) {
  .manage-chapters {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .chapters-container {
    padding: 1rem;
  }

  .category-tabs {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .category-tab {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
  }

  .book-title {
    font-size: 1.1rem;
    padding: 0.625rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .book-hebrew,
  .book-english {
    font-size: 1rem;
  }

  .expand-icon {
    font-size: 0.875rem;
  }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.625rem;
  }

  .chapter-link {
    padding: 0.625rem;
    min-height: 50px;
  }

  .chapter-number {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .manage-chapters {
    padding: 0.5rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .back-link {
    font-size: 0.875rem;
  }

  .chapters-container {
    padding: 0.75rem;
  }

  .category-tabs {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .category-tab {
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
  }

  .book-title {
    font-size: 1rem;
    padding: 0.5rem;
  }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 0.5rem;
  }

  .chapter-link {
    padding: 0.5rem;
    min-height: 45px;
  }

  .chapter-number {
    font-size: 0.875rem;
  }
}
</style>
