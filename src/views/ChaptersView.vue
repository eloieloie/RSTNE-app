<template>
  <div class="chapters-page">
    <router-link to="/" class="back-link">← Back to Books</router-link>
    
    <div v-if="loading" class="loading">Loading chapters...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else>
      <h1>{{ bookName }}</h1>
      
      <div v-if="chapters.length === 0" class="empty">
        No chapters found for this book.
      </div>
      
      <div v-else class="chapters-list">
        <div 
          v-for="chapter in chapters" 
          :key="chapter.chapter_id" 
          class="chapter-card"
        >
          <h2>{{ chapter.chapter_name }}</h2>
          <p class="description">{{ chapter.chapter_description || 'No description' }}</p>
          <div v-if="chapter.chapter_notes" class="notes">
            <strong>Notes:</strong> {{ chapter.chapter_notes }}
          </div>
          <div class="dates">
            <span class="date">Added: {{ formatDate(chapter.dt_added) }}</span>
            <span class="date">Modified: {{ formatDate(chapter.dt_modified) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getChaptersByBookId } from '@/api/chapters';
import { getBookById } from '@/api/books';
import type { Chapter } from '@/utils/collectionReferences';

const route = useRoute();
const chapters = ref<Chapter[]>([]);
const bookName = ref<string>('');
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const bookId = Number(route.params.id);
  
  if (isNaN(bookId)) {
    error.value = 'Invalid book ID';
    loading.value = false;
    return;
  }
  
  try {
    const book = await getBookById(bookId);
    if (!book) {
      error.value = 'Book not found';
      return;
    }
    
    bookName.value = book.book_name;
    chapters.value = await getChaptersByBookId(bookId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load chapters';
  } finally {
    loading.value = false;
  }
});

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}
</script>

<style scoped>
.chapters-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.back-link {
  display: inline-block;
  color: #42b983;
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chapter-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.chapter-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chapter-card h2 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.notes {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  color: #555;
}

.notes strong {
  color: #333;
}

.dates {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: #999;
}

.date {
  display: inline-block;
}
</style>
