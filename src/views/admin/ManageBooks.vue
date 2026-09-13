<template>
  <div class="manage-books admin-page">
    <header class="page-header admin-page-header">
      <h1 class="admin-title">Manage Books</h1>
      <router-link to="/admin" class="back-link admin-back-link">← Back to Dashboard</router-link>
    </header>

    <div class="content-container">
      <!-- Books List -->
      <div class="list-card admin-card">
        <h2>All Books</h2>

        <div v-if="loading" class="loading admin-state">Loading books...</div>
        <div v-else-if="error" class="error admin-state admin-state--error">{{ error }}</div>
        <div v-else-if="books.length === 0" class="empty admin-state">No books found</div>

        <div v-else class="books-table admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Abbr (EN)</th>
                <th>Hebrew Name</th>
                <th>Hebrew Abbr</th>
                <th>Telugu Name</th>
                <th>Telugu Abbr</th>
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
                <td>{{ book.hebrew_book_abbr || 'N/A' }}</td>
                <td>{{ book.telugu_book_name || 'N/A' }}</td>
                <td>{{ book.telugu_book_abbr || 'N/A' }}</td>
                <td>{{ getCategoryName(book.category_id) }}</td>
                <td>{{ book.book_index || 'N/A' }}</td>
                <td class="actions">
                  <button @click="openEditModal(book)" class="btn-icon btn-edit admin-btn admin-btn--ghost admin-btn--sm" title="Edit">
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
    <AnimatePresence>
      <motion.div
        v-if="showEditModal"
        class="modal-overlay admin-modal-overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="overlayFade"
        @click="closeEditModal"
      >
      <motion.div
        class="modal-content admin-modal"
        :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.94, y: 8 }"
        :transition="tooltipSpring"
        @click.stop
      >
        <div class="modal-header">
          <h2>Edit Book</h2>
          <motion.button class="close-button admin-btn admin-btn--ghost" :while-tap="tapScale" @click="closeEditModal">&times;</motion.button>
        </div>
        <form @submit.prevent="saveBook" class="modal-form">
          <div class="form-group admin-form-group">
            <label for="bookName" class="admin-label">Book Name *</label>
            <input
              id="bookName"
              v-model="formData.book_name"
              type="text"
              required
              placeholder="Enter book name"
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="bookAbbr" class="admin-label">Book Abbreviation (English)</label>
            <input
              id="bookAbbr"
              v-model="formData.book_abbr"
              type="text"
              maxlength="20"
              placeholder="e.g., Gen, Exod, Lev"
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="hebrewBookAbbr" class="admin-label">Hebrew Abbreviation</label>
            <input
              id="hebrewBookAbbr"
              v-model="formData.hebrew_book_abbr"
              type="text"
              maxlength="20"
              placeholder="e.g., bare, shem, uyiq"
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="teluguBookAbbr" class="admin-label">Telugu Abbreviation</label>
            <input
              id="teluguBookAbbr"
              v-model="formData.telugu_book_abbr"
              type="text"
              maxlength="30"
              placeholder="e.g., ఆది., నిర్గ."
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="hebrewBookName" class="admin-label">Hebrew Book Name</label>
            <input
              id="hebrewBookName"
              v-model="formData.hebrew_book_name"
              type="text"
              placeholder="Enter Hebrew book name"
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="teluguBookName" class="admin-label">Telugu Book Name</label>
            <input
              id="teluguBookName"
              v-model="formData.telugu_book_name"
              type="text"
              placeholder="Enter Telugu book name"
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="categoryId" class="admin-label">Category *</label>
            <select
              id="categoryId"
              v-model.number="formData.category_id"
              required
              class="admin-select"
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
          
          <div class="form-group admin-form-group">
            <label for="bookDescription" class="admin-label">Description</label>
            <textarea
              id="bookDescription"
              v-model="formData.book_description"
              rows="4"
              placeholder="Enter book description"
              class="admin-textarea"
            ></textarea>
          </div>

          <div class="form-group admin-form-group">
            <label for="bookHeader" class="admin-label">Book Header</label>
            <textarea
              id="bookHeader"
              v-model="formData.book_header"
              rows="3"
              placeholder="Enter book header (optional)"
              class="admin-textarea"
            ></textarea>
          </div>

          <div class="form-group admin-form-group">
            <label for="bookFooter" class="admin-label">Book Footer</label>
            <textarea
              id="bookFooter"
              v-model="formData.book_footer"
              rows="3"
              placeholder="Enter book footer (optional)"
              class="admin-textarea"
            ></textarea>
          </div>

          <div class="form-group admin-form-group">
            <label for="bookLink" class="admin-label">Book Link</label>
            <input
              id="bookLink"
              v-model="formData.book_link"
              type="url"
              placeholder="https://example.com/book-page (optional)"
              class="admin-input"
            />
          </div>

          <div class="form-group admin-form-group">
            <label for="bookIndex" class="admin-label">Book Index</label>
            <input
              id="bookIndex"
              v-model.number="formData.book_index"
              type="number"
              placeholder="Enter book index (optional)"
              class="admin-input"
            />
          </div>

          <div class="form-actions admin-modal-actions">
            <motion.button type="submit" class="btn btn-primary admin-btn admin-btn--primary" :while-tap="tapScale">Update Book</motion.button>
            <motion.button type="button" :while-tap="tapScale" @click="closeEditModal" class="btn btn-secondary admin-btn admin-btn--secondary">Cancel</motion.button>
          </div>
        </form>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import { getAllBooks, updateBook } from '@/api/books';
import { getAllBookCategories } from '@/api/bookCategories';
import { useMotionPresets } from '@/composables/useMotionPresets';
import type { Book, BookInsert, BookCategory } from '@/utils/collectionReferences';

const { prefersReducedMotion, tooltipSpring, tapScale, overlayFade } = useMotionPresets();
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
  hebrew_book_abbr: '',
  telugu_book_abbr: '',
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
    hebrew_book_abbr: book.hebrew_book_abbr || '',
    telugu_book_abbr: book.telugu_book_abbr || '',
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
    hebrew_book_abbr: '',
    telugu_book_abbr: '',
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
/* Colors, fonts, cards, table, buttons, form fields and modal chrome come from
   the shared .admin-page / .admin-card / .admin-table / .admin-btn / .admin-modal
   classes (src/assets/admin-ui.css). Only this page's own layout sizing remains. */

.manage-books {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-card h2 {
  margin: 0 0 1.5rem 0;
  color: var(--color-foreground);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.2);
}

/* Modal Styles */
.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.close-button {
  font-size: 2rem;
  line-height: 1;
}

.modal-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
