<template>
  <div class="chapter-editor">
    <header class="page-header">
      <h1>{{ isEditMode ? 'Edit Chapter' : 'Add New Chapter' }}</h1>
      <router-link to="/admin/chapters" class="back-link">← Back to Chapters</router-link>
    </header>

    <div class="editor-container">
      <form @submit.prevent="saveChapter" class="chapter-form">
        <div class="form-group">
          <label for="bookId">Book *</label>
          <select id="bookId" v-model="formData.book_id" required :disabled="isEditMode">
            <option value="">Select a book</option>
            <option v-for="book in books" :key="book.book_id" :value="book.book_id">
              {{ book.book_name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="chapterNumber">Chapter Number *</label>
          <input
            id="chapterNumber"
            v-model="formData.chapter_number"
            type="text"
            required
            placeholder="e.g., 1, 2a, 3.1"
          />
        </div>

        <div class="form-group">
          <div class="description-header">
            <label>Chapter Description *</label>
            <button 
              type="button" 
              @click="toggleEditorMode" 
              class="toggle-mode-btn"
              :title="isHtmlMode ? 'Switch to Rich Text Editor' : 'Switch to HTML Code View'"
            >
              {{ isHtmlMode ? '📝 Rich Text' : '&lt;/&gt; HTML' }}
            </button>
          </div>
          <div v-show="!isHtmlMode" ref="editorContainer" class="quill-editor"></div>
          <textarea
            v-show="isHtmlMode"
            v-model="htmlCode"
            class="html-code-editor"
            placeholder="Enter HTML code..."
            @blur="syncHtmlToEditor"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="chapterNotes">Chapter Notes</label>
          <textarea
            id="chapterNotes"
            v-model="formData.chapter_notes"
            rows="4"
            placeholder="Enter additional notes"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {{ isEditMode ? 'Update Chapter' : 'Create Chapter' }}
          </button>
          <router-link to="/admin/chapters" class="btn btn-secondary">
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { getAllBooks } from '@/api/books';
import { createChapter, updateChapter } from '@/api/chapters';
import type { Book, ChapterInsert } from '@/utils/collectionReferences';

const route = useRoute();
const router = useRouter();
const books = ref<Book[]>([]);
const editorContainer = ref<HTMLElement | null>(null);
let quillEditor: Quill | null = null;

const isEditMode = ref(false);
const chapterId = ref<number | null>(null);
const isHtmlMode = ref(false);
const htmlCode = ref('');

const formData = ref<ChapterInsert>({
  book_id: 0,
  chapter_number: '',
  chapter_description: '',
  chapter_notes: ''
});

onMounted(async () => {
  // Load books
  try {
    books.value = await getAllBooks();
  } catch (e) {
    alert('Failed to load books');
  }

  // Initialize Quill editor
  if (editorContainer.value) {
    quillEditor = new Quill(editorContainer.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: 'Enter chapter description...'
    });
  }

  // Check if editing existing chapter
  const id = route.params.id;
  if (id && id !== 'new') {
    isEditMode.value = true;
    chapterId.value = Number(id);
    await loadChapter(chapterId.value);
  }
});

onBeforeUnmount(() => {
  quillEditor = null;
});

async function loadChapter(id: number) {
  try {
    const response = await fetch(`/api/chapters/${id}`);
    if (!response.ok) throw new Error('Failed to load chapter');
    
    const chapter = await response.json();
    formData.value = {
      book_id: chapter.book_id,
      chapter_number: chapter.chapter_number,
      chapter_description: chapter.chapter_description || '',
      chapter_notes: chapter.chapter_notes || ''
    };

    // Set editor content
    if (quillEditor && chapter.chapter_description) {
      quillEditor.root.innerHTML = chapter.chapter_description;
      htmlCode.value = chapter.chapter_description;
    }
  } catch (e) {
    alert('Failed to load chapter');
    router.push('/admin/chapters');
  }
}

function toggleEditorMode() {
  if (isHtmlMode.value) {
    // Switching from HTML to Rich Text
    syncHtmlToEditor();
  } else {
    // Switching from Rich Text to HTML
    syncEditorToHtml();
  }
  isHtmlMode.value = !isHtmlMode.value;
}

function syncEditorToHtml() {
  if (quillEditor) {
    htmlCode.value = quillEditor.root.innerHTML;
  }
}

function syncHtmlToEditor() {
  if (quillEditor && htmlCode.value) {
    quillEditor.root.innerHTML = htmlCode.value;
  }
}

async function saveChapter() {
  // Get content from the appropriate source
  if (isHtmlMode.value) {
    formData.value.chapter_description = htmlCode.value;
  } else if (quillEditor) {
    formData.value.chapter_description = quillEditor.root.innerHTML;
  }

  // Validate
  if (!formData.value.book_id || !formData.value.chapter_number || !formData.value.chapter_description) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    if (isEditMode.value && chapterId.value) {
      await updateChapter(chapterId.value, formData.value);
    } else {
      await createChapter(formData.value);
    }
    
    router.push('/admin/chapters');
  } catch (e) {
    alert('Failed to save chapter: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}
</script>

<style scoped>
.chapter-editor {
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

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

.editor-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.description-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-mode-btn {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #667eea;
}

.toggle-mode-btn:hover {
  background: #e8e8e8;
  border-color: #667eea;
}

.html-code-editor {
  min-height: 350px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: 'Courier New', Consolas, Monaco, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  background: #f8f9fa;
}

.html-code-editor:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.quill-editor {
  min-height: 300px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

:deep(.ql-container) {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  min-height: 300px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
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
  text-align: center;
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
