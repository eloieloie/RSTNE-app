<template>
  <div class="books-page">
    <div class="page-header">
      <h1>Books Library</h1>
      <router-link to="/admin" class="admin-link">Admin Dashboard →</router-link>
    </div>
    
    <div v-if="loading" class="loading">Loading books...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="books.length === 0" class="empty">
      No books found. Add some books to get started!
    </div>
    
    <div v-else class="books-list">
      <div 
        v-for="book in books" 
        :key="book.book_id" 
        class="book-card"
      >
        <h2>{{ book.book_name }}</h2>
        <p v-if="book.book_index" class="index">Index: {{ book.book_index }}</p>
        <p class="description">{{ book.book_description || 'No description available' }}</p>
        <p class="date">Added: {{ formatDate(book.dt_added) }}</p>
        <router-link 
          :to="`/chapters/${book.book_id}`" 
          class="view-chapters-btn"
        >
          View Chapters
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAllBooks } from '@/api/books';
import type { Book } from '@/utils/collectionReferences';

const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    books.value = await getAllBooks();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load books';
  } finally {
    loading.value = false;
  }
});

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}
</script>

<style scoped>
.books-page {
  max-width: 1200px;
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

.admin-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #667eea;
  border-radius: 6px;
  transition: all 0.2s;
}

.admin-link:hover {
  background: #667eea;
  color: white;
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

.books-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.book-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.book-card h2 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.index {
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.date {
  font-size: 0.875rem;
  color: #999;
  margin-bottom: 1rem;
}

.view-chapters-btn {
  display: inline-block;
  background: #42b983;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
}

.view-chapters-btn:hover {
  background: #369970;
}
</style>
