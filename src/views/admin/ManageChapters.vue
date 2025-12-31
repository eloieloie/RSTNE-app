<template>
  <div class="manage-chapters">
    <header class="page-header">
      <h1>Manage Chapters</h1>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <div class="content-container">
      <!-- Add New Chapter Form -->
      <div class="form-card">
        <h2>{{ editMode ? 'Edit Chapter' : 'Add New Chapter' }}</h2>
        <form @submit.prevent="saveChapter" class="chapter-form">
          <div class="form-group">
            <label for="bookId">Book *</label>
            <select id="bookId" v-model="formData.book_id" required>
              <option value="">Select a book</option>
              <option v-for="book in books" :key="book.book_id" :value="book.book_id">
                {{ book.book_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="chapterName">Chapter Name *</label>
            <input
              id="chapterName"
              v-model="formData.chapter_name"
              type="text"
              required
              placeholder="Enter chapter name"
            />
          </div>
          
          <div class="form-group">
            <label for="chapterDescription">Description</label>
            <textarea
              id="chapterDescription"
              v-model="formData.chapter_description"
              rows="3"
              placeholder="Enter chapter description"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="chapterNotes">Notes</label>
            <textarea
              id="chapterNotes"
              v-model="formData.chapter_notes"
              rows="3"
              placeholder="Enter chapter notes"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editMode ? 'Update Chapter' : 'Add Chapter' }}
            </button>
            <button v-if="editMode" type="button" @click="cancelEdit" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Chapters List -->
      <div class="list-card">
        <h2>All Chapters</h2>
        
        <div v-if="loading" class="loading">Loading chapters...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="chapters.length === 0" class="empty">No chapters found</div>
        
        <div v-else class="chapters-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Book</th>
                <th>Chapter Name</th>
                <th>Description</th>
                <th>Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="chapter in chaptersWithBooks" :key="chapter.chapter_id">
                <td>{{ chapter.chapter_id }}</td>
                <td>{{ chapter.book_name }}</td>
                <td>{{ chapter.chapter_name }}</td>
                <td>{{ chapter.chapter_description || 'N/A' }}</td>
                <td>{{ formatDate(chapter.dt_modified) }}</td>
                <td class="actions">
                  <button @click="editChapter(chapter)" class="btn-icon btn-edit" title="Edit">
                    ✏️
                  </button>
                  <button @click="deleteChapter(chapter.chapter_id)" class="btn-icon btn-delete" title="Delete">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getAllBooks } from '@/api/books';
import { getAllChapters, createChapter, updateChapter, deleteChapter as apiDeleteChapter } from '@/api/chapters';
import type { Book, Chapter, ChapterInsert } from '@/utils/collectionReferences';

const books = ref<Book[]>([]);
const chapters = ref<Chapter[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const editMode = ref(false);
const editingId = ref<number | null>(null);

const formData = ref<ChapterInsert>({
  book_id: 0,
  chapter_name: '',
  chapter_description: '',
  chapter_notes: ''
});

const chaptersWithBooks = computed(() => {
  return chapters.value.map(chapter => {
    const book = books.value.find(b => b.book_id === chapter.book_id);
    return {
      ...chapter,
      book_name: book?.book_name || 'Unknown'
    };
  });
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

async function saveChapter() {
  try {
    if (editMode.value && editingId.value) {
      await updateChapter(editingId.value, formData.value);
    } else {
      await createChapter(formData.value);
    }
    
    resetForm();
    loadData();
  } catch (e) {
    alert('Failed to save chapter: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

function editChapter(chapter: Chapter) {
  editMode.value = true;
  editingId.value = chapter.chapter_id;
  formData.value = {
    book_id: chapter.book_id,
    chapter_name: chapter.chapter_name,
    chapter_description: chapter.chapter_description || '',
    chapter_notes: chapter.chapter_notes || ''
  };
}

function cancelEdit() {
  resetForm();
}

async function deleteChapter(chapterId: number) {
  if (!confirm('Are you sure you want to delete this chapter?')) {
    return;
  }
  
  try {
    await apiDeleteChapter(chapterId);
    loadData();
  } catch (e) {
    alert('Failed to delete chapter: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

function resetForm() {
  editMode.value = false;
  editingId.value = null;
  formData.value = {
    book_id: 0,
    chapter_name: '',
    chapter_description: '',
    chapter_notes: ''
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
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

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.content-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.form-card, .list-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-card h2, .list-card h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

.chapter-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #e74c3c;
}

.chapters-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.2);
}

@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
  }
}
</style>
