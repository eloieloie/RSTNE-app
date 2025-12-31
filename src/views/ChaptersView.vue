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
      
      <div v-else class="content-layout">
        <aside class="chapters-sidebar">
          <h2>Chapters</h2>
          <nav class="chapters-nav">
            <a
              v-for="chapter in chapters"
              :key="chapter.chapter_id"
              href="#"
              @click.prevent="selectChapter(chapter)"
              :class="{ active: selectedChapter?.chapter_id === chapter.chapter_id }"
              class="chapter-link"
            >
              Chapter {{ chapter.chapter_number }}
            </a>
          </nav>
        </aside>
        
        <main class="chapter-content">
          <div v-if="!selectedChapter" class="select-prompt">
            ← Select a chapter to view its content
          </div>
          <div v-else>
            <h2>Chapter {{ selectedChapter.chapter_number }}</h2>
            <div class="description-content" v-html="selectedChapter.chapter_description"></div>
            <div v-if="selectedChapter.chapter_notes" class="notes">
              <strong>Notes:</strong> {{ selectedChapter.chapter_notes }}
            </div>
          </div>
        </main>
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
const selectedChapter = ref<Chapter | null>(null);
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
    
    // Auto-select first chapter if available
    if (chapters.value.length > 0) {
      selectedChapter.value = chapters.value[0];
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load chapters';
  } finally {
    loading.value = false;
  }
});

function selectChapter(chapter: Chapter) {
  selectedChapter.value = chapter;
}
</script>

<style scoped>
.chapters-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
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

.content-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  align-items: start;
}

.chapters-sidebar {
  position: sticky;
  top: 2rem;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chapters-sidebar h2 {
  color: #2c3e50;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #42b983;
}

.chapters-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chapter-link {
  display: block;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.chapter-link:hover {
  background: #f0f0f0;
  color: #42b983;
  transform: translateX(4px);
}

.chapter-link.active {
  background: #42b983;
  color: white;
}

.chapter-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.select-prompt {
  color: #999;
  text-align: center;
  padding: 4rem 2rem;
  font-size: 1.1rem;
}

.chapter-content h2 {
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
}

.description-content {
  line-height: 1.8;
  color: #333;
  margin-bottom: 2rem;
  text-align: left;
}

.description-content :deep(h1),
.description-content :deep(h2),
.description-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.description-content :deep(p) {
  margin-bottom: 1rem;
}

.description-content :deep(ul),
.description-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.description-content :deep(li) {
  margin-bottom: 0.5rem;
}

.description-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.description-content :deep(a) {
  color: #42b983;
  text-decoration: none;
}

.description-content :deep(a:hover) {
  text-decoration: underline;
}

.notes {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #42b983;
  color: #555;
}

.notes strong {
  color: #333;
  display: block;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .chapters-page {
    padding: 0;
    min-height: 100vh;
  }
  
  h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    padding: 0.75rem;
  }
  
  .back-link {
    margin: 0.5rem;
  }
  
  .content-layout {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .chapters-sidebar {
    position: static;
    padding: 0.75rem;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .chapters-sidebar h2 {
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    padding-bottom: 0.5rem;
  }
  
  .chapter-link {
    padding: 0.5rem;
    font-size: 0.95rem;
  }
  
  .chapter-content {
    padding: 0.75rem;
    margin: 0;
    border-radius: 0;
    min-height: 300px;
    box-shadow: none;
  }
  
  .chapter-content h2 {
    font-size: 1.3rem;
    margin: 0 0 0.75rem 0;
    padding-bottom: 0.5rem;
  }
  
  .description-content {
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  
  .notes {
    padding: 0.75rem;
    margin: 0;
    border-radius: 4px;
  }
  
  .select-prompt {
    padding: 2rem 0.75rem;
    font-size: 1rem;
  }
}
</style>
