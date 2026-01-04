<template>
  <div class="manage-books">
    <header class="page-header">
      <h1>Manage Books</h1>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <div class="content-container">
      <!-- Add New Book Form -->
      <div class="form-card">
        <h2>{{ editMode ? 'Edit Book' : 'Add New Book' }}</h2>
        <form @submit.prevent="saveBook" class="book-form">
          <div class="form-group">
            <label for="bookName">Book Name *</label>
            <input
              id="bookName"
              v-model="formData.book_name"
              type="text"
              required
              placeholder="Enter book name"
            />
          </div>

          <div class="form-group">
            <label for="hebrewBookName">Hebrew Book Name</label>
            <input
              id="hebrewBookName"
              v-model="formData.hebrew_book_name"
              type="text"
              placeholder="Enter Hebrew book name"
            />
          </div>

          <div class="form-group">
            <label for="teluguBookName">Telugu Book Name</label>
            <input
              id="teluguBookName"
              v-model="formData.telugu_book_name"
              type="text"
              placeholder="Enter Telugu book name"
            />
          </div>
          
          <div class="form-group">
            <label for="bookDescription">Description</label>
            <textarea
              id="bookDescription"
              v-model="formData.book_description"
              rows="4"
              placeholder="Enter book description"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="bookIndex">Book Index</label>
            <input
              id="bookIndex"
              v-model.number="formData.book_index"
              type="number"
              placeholder="Enter book index (optional)"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editMode ? 'Update Book' : 'Add Book' }}
            </button>
            <button v-if="editMode" type="button" @click="cancelEdit" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Books List -->
      <div class="list-card">
        <h2>All Books</h2>
        
        <div v-if="loading" class="loading">Loading books...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="books.length === 0" class="empty">No books found</div>
        
        <div v-else class="books-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Hebrew Name</th>
                <th>Telugu Name</th>
                <th>Description</th>
                <th>Index</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in books" :key="book.book_id">
                <td>{{ book.book_id }}</td>
                <td>{{ book.book_name }}</td>
                <td>{{ book.hebrew_book_name || 'N/A' }}</td>
                <td>{{ book.telugu_book_name || 'N/A' }}</td>
                <td>{{ book.book_description || 'N/A' }}</td>
                <td>{{ book.book_index || 'N/A' }}</td>
                <td>{{ formatDate(book.dt_added) }}</td>
                <td class="actions">
                  <button @click="editBook(book)" class="btn-icon btn-edit" title="Edit">
                    ✏️
                  </button>
                  <button @click="deleteBook(book.book_id)" class="btn-icon btn-delete" title="Delete">
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
import { getAllBooks, createBook, updateBook, deleteBook as apiDeleteBook } from '@/api/books';
import type { Book, BookInsert } from '@/utils/collectionReferences';

const booksData = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const editMode = ref(false);
const editingId = ref<number | null>(null);

const books = computed(() => {
  return [...booksData.value].sort((a, b) => {
    const indexA = a.book_index ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.book_index ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });
});

const formData = ref<BookInsert>({
  book_name: '',
  hebrew_book_name: '',
  telugu_book_name: '',
  book_description: '',
  book_index: undefined
});

onMounted(() => {
  loadBooks();
});

async function loadBooks() {
  try {
    loading.value = true;
    booksData.value = await getAllBooks();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load books';
  } finally {
    loading.value = false;
  }
}

async function saveBook() {
  try {
    if (editMode.value && editingId.value) {
      await updateBook(editingId.value, formData.value);
    } else {
      await createBook(formData.value);
    }
    
    resetForm();
    loadBooks();
  } catch (e) {
    alert('Failed to save book: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

function editBook(book: Book) {
  editMode.value = true;
  editingId.value = book.book_id;
  formData.value = {
    book_name: book.book_name,
    hebrew_book_name: book.hebrew_book_name || '',
    telugu_book_name: book.telugu_book_name || '',
    book_description: book.book_description || '',
    book_index: book.book_index || undefined
  };
}

function cancelEdit() {
  resetForm();
}

async function deleteBook(bookId: number) {
  if (!confirm('Are you sure you want to delete this book? All chapters will also be deleted.')) {
    return;
  }
  
  try {
    await apiDeleteBook(bookId);
    loadBooks();
  } catch (e) {
    alert('Failed to delete book: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

function resetForm() {
  editMode.value = false;
  editingId.value = null;
  formData.value = {
    book_name: '',
    hebrew_book_name: '',
    telugu_book_name: '',
    book_description: '',
    book_index: undefined
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}
</script>

<style scoped>
.manage-books {
  max-width: 1400px;
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

.book-form {
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
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
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

.books-table {
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
