<template>
  <div class="books-page">
    <div class="page-header">
      <h1>Books Library</h1>
      <router-link to="/admin" class="admin-link">Admin →</router-link>
    </div>
    
    <div v-if="loading" class="loading">Loading books...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="books.length === 0" class="empty">
      No books found. Add some books to get started!
    </div>
    
    <div v-else class="books-grid">
      <router-link 
        v-for="book in sortedBooks" 
        :key="book.book_id"
        :to="`/chapters/${book.book_id}`" 
        class="book-button"
      >
        <div class="book-name">{{ book.book_name }}</div>
        <div class="book-name-hebrew">{{ book.hebrew_book_name }}</div>
        <div class="book-name-telugu">{{ book.telugu_book_name }}</div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getAllBooks } from '@/api/books';
import type { Book } from '@/utils/collectionReferences';

const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const sortedBooks = computed(() => {
  return [...books.value].sort((a, b) => {
    const indexA = a.book_index ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.book_index ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.admin-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: 2px solid #667eea;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.admin-link:hover {
  background: #667eea;
  color: white;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.book-button {
  background: white;
  color: #2c3e50;
  padding: 1.25rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 100px;
}

.book-name {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.book-name-hebrew {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.95;
  font-style: italic;
}

.book-name-telugu {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.95;
}

.book-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #2c3e50;
}

.book-button:active {
  transform: translateY(0);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .books-page {
    padding: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    padding: 0;
  }

  .book-button {
    padding: 1rem 0.75rem;
    min-height: 95px;
  }

  .book-name {
    font-size: 0.9rem;
  }

  .book-name-hebrew {
    font-size: 0.75rem;
  }

  .book-name-telugu {
    font-size: 0.8rem;
  }
}
/* Very small screens */
@media (max-width: 480px) {
  .books-page {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0;
  }

  .book-button {
    padding: 1rem 0.5rem;
    min-height: 90px;
    gap: 0.4rem;
  }

  .book-name {
    font-size: 0.85rem;
  }

  .book-name-hebrew {
    font-size: 0.72rem;
  }

  .book-name-telugu {
    font-size: 0.78rem;
  }

  .admin-link {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>
