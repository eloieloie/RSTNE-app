<template>
  <div class="manage-books">
    <header class="page-header">
      <h1>Manage Books</h1>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <div class="content-container">
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
                <th>Abbr</th>
                <th>Hebrew Name</th>
                <th>Telugu Name</th>
                <th>Category</th>
                <th>Index</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in books" :key="book.book_id">
                <td>{{ book.book_id }}</td>
                <td>{{ book.book_name }}</td>
                <td>{{ book.book_abbr || 'N/A' }}</td>
                <td>{{ book.hebrew_book_name || 'N/A' }}</td>
                <td>{{ book.telugu_book_name || 'N/A' }}</td>
                <td>{{ getCategoryName(book.category_id) }}</td>
                <td>{{ book.book_index || 'N/A' }}</td>
                <td class="actions">
                  <button @click="openEditModal(book)" class="btn-icon btn-edit" title="Edit">
                    ✏️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Book</h2>
          <button class="close-button" @click="closeEditModal">&times;</button>
        </div>
        <form @submit.prevent="saveBook" class="modal-form">
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
            <label for="bookAbbr">Book Abbreviation</label>
            <input
              id="bookAbbr"
              v-model="formData.book_abbr"
              type="text"
              maxlength="10"
              placeholder="e.g., gene, exod, prov"
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
            <label for="categoryId">Category *</label>
            <select
              id="categoryId"
              v-model.number="formData.category_id"
              required
            >
              <option :value="undefined" disabled>Select a category</option>
              <option
                v-for="category in categories"
                :key="category.category_id"
                :value="category.category_id"
              >
                {{ category.category_name }}
              </option>
            </select>
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
            <label for="bookHeader">Book Header</label>
            <textarea
              id="bookHeader"
              v-model="formData.book_header"
              rows="3"
              placeholder="Enter book header (optional)"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="bookFooter">Book Footer</label>
            <textarea
              id="bookFooter"
              v-model="formData.book_footer"
              rows="3"
              placeholder="Enter book footer (optional)"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="bookLink">Book Link</label>
            <input
              id="bookLink"
              v-model="formData.book_link"
              type="url"
              placeholder="https://example.com/book-page (optional)"
            />
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
            <button type="submit" class="btn btn-primary">Update Book</button>
            <button type="button" @click="closeEditModal" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getAllBooks, updateBook } from '@/api/books';
import { getAllBookCategories } from '@/api/bookCategories';
import type { Book, BookInsert, BookCategory } from '@/utils/collectionReferences';

const booksData = ref<Book[]>([]);
const categories = ref<BookCategory[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const showEditModal = ref(false);
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
  book_abbr: '',
  hebrew_book_name: '',
  telugu_book_name: '',
  book_description: '',
  book_header: '',
  book_footer: '',
  book_link: '',
  book_index: undefined,
  category_id: undefined
});

onMounted(() => {
  loadBooks();
  loadCategories();
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

async function loadCategories() {
  try {
    categories.value = await getAllBookCategories();
  } catch (e) {
    console.error('Failed to load categories:', e);
  }
}

function getCategoryName(categoryId: number | null): string {
  if (!categoryId) return 'N/A';
  const category = categories.value.find(c => c.category_id === categoryId);
  return category ? category.category_name : 'N/A';
}

async function saveBook() {
  try {
    if (editingId.value) {
      console.log('=== Saving Book ===');
      console.log('Book ID:', editingId.value);
      console.log('Form Data:', JSON.stringify(formData.value, null, 2));
      console.log('Header:', formData.value.book_header);
      console.log('Footer:', formData.value.book_footer);
      console.log('Category ID:', formData.value.category_id);
      
      await updateBook(editingId.value, formData.value);
      console.log('✅ Book updated successfully');
      
      closeEditModal();
      loadBooks();
    }
  } catch (e) {
    console.error('❌ Failed to update book:', e);
    alert('Failed to update book: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

function openEditModal(book: Book) {
  console.log('=== Opening Edit Modal ===');
  console.log('Book Data:', JSON.stringify(book, null, 2));
  console.log('Current Header:', book.book_header);
  console.log('Current Footer:', book.book_footer);
  console.log('Current Category ID:', book.category_id);
  
  editingId.value = book.book_id;
  formData.value = {
    book_name: book.book_name,
    book_abbr: book.book_abbr || '',
    hebrew_book_name: book.hebrew_book_name || '',
    telugu_book_name: book.telugu_book_name || '',
    book_description: book.book_description || '',
    book_header: book.book_header || '',
    book_footer: book.book_footer || '',
    book_link: book.book_link || '',
    book_index: book.book_index || undefined,
    category_id: book.category_id || undefined
  };
  
  console.log('Form Data populated:', JSON.stringify(formData.value, null, 2));
  showEditModal.value = true;
}

function closeEditModal() {
  console.log('=== Closing Edit Modal ===');
  showEditModal.value = false;
  editingId.value = null;
  formData.value = {
    book_name: '',
    book_abbr: '',
    hebrew_book_name: '',
    telugu_book_name: '',
    book_description: '',
    book_header: '',
    book_footer: '',
    book_link: '',
    book_index: undefined,
    category_id: undefined
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
  width: 100%;
}

.list-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-card h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
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

/* Modal Styles */
.modal-overlay {
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-button:hover {
  color: #2c3e50;
}

.modal-form {
  padding: 2rem;
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
</style>
