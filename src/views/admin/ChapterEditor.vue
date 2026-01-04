<template>
  <div class="chapter-editor">
    <header class="page-header">
      <div>
        <h1>{{ chapterTitle }}</h1>
        <p v-if="chapter" class="chapter-subtitle">{{ getBookName(chapter.book_id) }} - Chapter {{ chapter.chapter_number }}</p>
      </div>
      <router-link to="/admin/chapters" class="back-link">← Back to Chapters</router-link>
    </header>

    <div class="editor-container">
      <div v-if="loading" class="loading">Loading verses...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      
      <div v-else class="verses-list">
        <div v-if="verses.length === 0" class="empty">
          No verses found for this chapter.
        </div>
        
        <div v-for="verse in sortedVerses" :key="verse.verse_id" class="verse-item">
          <div class="verse-header">
            <span class="verse-number">{{ verse.verse_index }}</span>
            <button 
              v-if="editingVerseId !== verse.verse_id"
              @click="startEditVerse(verse)" 
              class="btn-edit"
              title="Edit verse"
            >
              ✏️ Edit
            </button>
            <div v-else class="edit-actions">
              <button @click="saveVerse(verse.verse_id)" class="btn-save">💾 Save</button>
              <button @click="cancelEdit" class="btn-cancel">❌ Cancel</button>
            </div>
          </div>
          
          <div v-if="editingVerseId !== verse.verse_id" class="verse-content">
            <div class="verse-text" v-html="formatVerseWithPaleoBora(verse.verse)"></div>
            <div v-if="verse.telugu_verse" class="verse-telugu" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
          </div>
          
          <div v-else class="verse-editor">
            <div class="editor-group">
              <label>English Verse:</label>
              <div id="english-editor" class="quill-editor"></div>
            </div>
            <div class="editor-group">
              <label>Telugu Verse (Optional):</label>
              <div id="telugu-editor" class="quill-editor"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { getAllBooks } from '@/api/books';
import { getChapterById } from '@/api/chapters';
import { getVersesByChapterId, updateVerse } from '@/api/verses';
import type { Book, Chapter, Verse, VerseUpdate } from '@/utils/collectionReferences';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '@/assets/fonts/fonts.css';

const route = useRoute();
const books = ref<Book[]>([]);
const chapter = ref<Chapter | null>(null);
const verses = ref<Verse[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const editingVerseId = ref<number | null>(null);
const editFormData = ref<VerseUpdate>({
  verse_index: undefined,
  verse: '',
  telugu_verse: ''
});

const englishEditor = ref<Quill | null>(null);
const teluguEditor = ref<Quill | null>(null);

const chapterTitle = computed(() => {
  if (!chapter.value) return 'Chapter Editor';
  return `Edit Chapter Verses`;
});

const sortedVerses = computed(() => {
  return [...verses.value].sort((a, b) => {
    const indexA = a.verse_index ?? 0;
    const indexB = b.verse_index ?? 0;
    return indexA - indexB;
  });
});

function formatVerseWithPaleoBora(verseText: string | null): string {
  if (!verseText) return '';
  // Replace Myhla or myhla with span that uses PaleoBora font
  return verseText.replace(/(Myhla|myhla)/gi, '<span class="paleobora-text">$1</span>');
}

onMounted(async () => {
  const chapterId = Number(route.params.id);
  if (!chapterId || isNaN(chapterId)) {
    error.value = 'Invalid chapter ID';
    loading.value = false;
    return;
  }

  await loadData(chapterId);
});

async function loadData(chapterId: number) {
  try {
    loading.value = true;
    const [booksData, chapterData, versesData] = await Promise.all([
      getAllBooks(),
      getChapterById(chapterId),
      getVersesByChapterId(chapterId)
    ]);
    
    books.value = booksData;
    chapter.value = chapterData;
    verses.value = versesData;
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

async function startEditVerse(verse: Verse) {
  editingVerseId.value = verse.verse_id;
  editFormData.value = {
    verse_index: verse.verse_index ?? undefined,
    verse: verse.verse || '',
    telugu_verse: verse.telugu_verse || ''
  };
  
  await nextTick();
  initializeEditors();
}

function initializeEditors() {
  const englishContainer = document.getElementById('english-editor');
  const teluguContainer = document.getElementById('telugu-editor');
  
  if (englishContainer) {
    englishEditor.value = new Quill(englishContainer, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'color': [] }, { 'background': [] }],
          ['clean']
        ]
      }
    });
    englishEditor.value.root.innerHTML = editFormData.value.verse || '';
  }
  
  if (teluguContainer) {
    teluguEditor.value = new Quill(teluguContainer, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'color': [] }, { 'background': [] }],
          ['clean']
        ]
      }
    });
    teluguEditor.value.root.innerHTML = editFormData.value.telugu_verse || '';
  }
}

function cancelEdit() {
  cleanupEditors();
  editingVerseId.value = null;
  editFormData.value = {
    verse_index: undefined,
    verse: '',
    telugu_verse: ''
  };
}

function cleanupEditors() {
  if (englishEditor.value) {
    englishEditor.value = null;
  }
  if (teluguEditor.value) {
    teluguEditor.value = null;
  }
}

async function saveVerse(verseId: number) {
  if (!verseId || isNaN(verseId)) {
    alert('Invalid verse ID');
    return;
  }
  
  // Get HTML content from editors
  if (englishEditor.value) {
    editFormData.value.verse = englishEditor.value.root.innerHTML;
  }
  if (teluguEditor.value) {
    editFormData.value.telugu_verse = teluguEditor.value.root.innerHTML;
  }
  
  if (!editFormData.value.verse || !editFormData.value.verse.trim()) {
    alert('Verse text cannot be empty');
    return;
  }

  try {
    console.log('Saving verse:', verseId, editFormData.value);
    await updateVerse(verseId, editFormData.value);
    
    // Update local data
    const index = verses.value.findIndex(v => v.verse_id === verseId);
    if (index !== -1) {
      verses.value[index] = {
        ...verses.value[index],
        verse: editFormData.value.verse || verses.value[index].verse,
        telugu_verse: editFormData.value.telugu_verse || null
        // verse_index is preserved from the spread operator
      };
    }
    
    cancelEdit();
  } catch (e) {
    alert('Failed to save verse: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}
</script>

<style scoped>
.chapter-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ddd;
}

.page-header h1 {
  color: #333;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.chapter-subtitle {
  color: #666;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.875rem;
}

.back-link:hover {
  text-decoration: underline;
}

.editor-container {
  background: white;
}

.loading, .error, .empty {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}

.error {
  color: #e74c3c;
}

.verses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.verse-item {
  border: 1px solid #e0e0e0;
  padding: 1rem;
  background: #fafafa;
}

.verse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.verse-number {
  font-size: 1rem;
  font-weight: 700;
  color: #667eea;
  min-width: 40px;
}

.btn-edit {
  padding: 0.375rem 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-edit:hover {
  background: #5568d3;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-save {
  padding: 0.375rem 0.75rem;
  background: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-save:hover {
  background: #218838;
}

.btn-cancel {
  padding: 0.375rem 0.75rem;
  background: #6c757d;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-cancel:hover {
  background: #5a6268;
}

.verse-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.verse-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
  text-align: left;
}

.verse-telugu {
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
  margin: 0;
}

.paleobora-text {
  font-family: 'PaleoBora', serif !important;
  font-size: 1.1rem;
}

.verse-text :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.verse-telugu :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

.verse-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.editor-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.editor-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.75rem;
}

.quill-editor {
  background: white;
  min-height: 150px;
}

.quill-editor :deep(.ql-editor) {
  font-size: 1rem;
  line-height: 1.6;
  min-height: 120px;
}

.quill-editor :deep(.ql-toolbar) {
  border: 1px solid #ddd;
  background: #f9f9f9;
}

.quill-editor :deep(.ql-container) {
  border: 1px solid #ddd;
  border-top: none;
}
</style>

