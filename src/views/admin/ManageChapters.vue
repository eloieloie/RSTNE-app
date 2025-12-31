<template>
  <div class="manage-chapters">
    <header class="page-header">
      <h1>Manage Chapters</h1>
      <div class="header-actions">
        <router-link to="/admin/chapters/new" class="btn btn-primary">+ Add New Chapter</router-link>
        <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
      </div>
    </header>

    <div class="chapters-container">
      <div v-if="loading" class="loading">Loading chapters...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="Object.keys(groupedChapters).length === 0" class="empty">No chapters found</div>
      
      <div v-else class="books-list">
        <div v-for="(chapters, bookId) in groupedChapters" :key="bookId" class="book-section">
          <h2 class="book-title">{{ getBookName(Number(bookId)) }}</h2>
          <div class="chapters-grid">
            <router-link
              v-for="chapter in chapters"
              :key="chapter.chapter_id"
              :to="`/admin/chapters/${chapter.chapter_id}`"
              class="chapter-link"
            >
              <span class="chapter-number">{{ chapter.chapter_number }}</span>
            </router-link>
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
  
  return grouped;
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

function getBookName(bookId: number): string {
  const book = books.value.find(b => b.book_id === bookId);
  return book?.book_name || 'Unknown Book';
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

.books-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.book-section {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1.5rem;
}

.book-section:last-child {
  border-bottom: none;
}

.book-title {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.chapter-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 60px;
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
</style>
