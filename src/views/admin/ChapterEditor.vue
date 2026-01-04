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
            <div class="verse-actions">
              <button 
                v-if="editingVerseId !== verse.verse_id"
                @click="startEditVerse(verse)" 
                class="btn btn-sm btn-primary btn-edit"
                title="Edit verse"
              >
                ✏️ Edit
              </button>
              <button 
                v-if="editingVerseId !== verse.verse_id"
                @click="toggleNotes(verse.verse_id)" 
                class="btn btn-sm btn-info btn-notes"
                title="Manage notes"
              >
                📝 Notes
              </button>
              <button 
                v-if="editingVerseId !== verse.verse_id"
                @click="toggleLinks(verse.verse_id)" 
                class="btn btn-sm btn-secondary btn-links"
                title="Link verses"
              >
                🔗 Links
              </button>
              <button 
                v-if="editingVerseId !== verse.verse_id"
                @click="toggleTags(verse.verse_id)" 
                class="btn btn-sm btn-warning btn-tags"
                title="Manage tags"
              >
                🏷️ Tags
              </button>
              <div v-if="editingVerseId === verse.verse_id" class="edit-actions">
                <button @click="saveVerse(verse.verse_id)" class="btn btn-sm btn-success btn-save">💾 Save</button>
                <button @click="cancelEdit" class="btn btn-sm btn-secondary btn-cancel">❌ Cancel</button>
              </div>
            </div>
          </div>
          
          <div v-if="editingVerseId !== verse.verse_id" class="verse-content">
            <div class="verse-text" v-html="formatVerseWithPaleoBora(verse.verse)"></div>
            <div v-if="verse.telugu_verse" class="verse-telugu" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
            
            <!-- Notes Display -->
            <div v-if="showNotesForVerse === verse.verse_id" class="notes-section">
              <div class="notes-header">
                <h4>Notes</h4>
                <button @click="startAddNote(verse.verse_id)" class="btn btn-sm btn-success btn-add-note">+ Add Note</button>
              </div>
              
              <div v-if="loadingNotes" class="loading-notes">Loading notes...</div>
              
              <div v-else-if="verseNotes[verse.verse_id]?.length > 0" class="notes-list">
                <div v-for="note in verseNotes[verse.verse_id]" :key="note.note_id" class="note-item">
                  <h5 v-if="note.note_title">{{ note.note_title }}</h5>
                  <div class="note-content" v-html="note.note_content"></div>
                  <div class="note-meta">{{ new Date(note.dt_modified).toLocaleDateString() }}</div>
                </div>
              </div>
              
              <div v-else class="no-notes">No notes for this verse yet.</div>
              
              <!-- Add Note Form -->
              <div v-if="addingNoteToVerse === verse.verse_id" class="add-note-form">
                <input 
                  v-model="newNote.title" 
                  type="text" 
                  placeholder="Note title (optional)"
                  class="note-title-input"
                />
                <textarea 
                  v-model="newNote.content" 
                  placeholder="Note content..."
                  rows="4"
                  class="note-content-input"
                ></textarea>
                <div class="note-form-actions">
                  <button @click="saveNote(verse.verse_id)" class="btn btn-sm btn-primary btn-save-note">Save Note</button>
                  <button @click="cancelAddNote" class="btn btn-sm btn-secondary btn-cancel-note">Cancel</button>
                </div>
              </div>
            </div>
            
            <!-- Links Section -->
            <div v-if="showLinksForVerse === verse.verse_id" class="links-section">
              <div class="section-header">
                <h4>Linked Verses</h4>
                <button @click="startAddLink(verse.verse_id)" class="btn btn-sm btn-success btn-add-link">+ Add Link</button>
              </div>
              
              <div v-if="loadingLinks" class="loading-links">Loading links...</div>
              
              <div v-else-if="verseLinks[verse.verse_id]?.length > 0" class="links-list">
                <div v-for="linkId in verseLinks[verse.verse_id]" :key="linkId" class="link-item">
                  Verse #{{ linkId }}
                </div>
              </div>
              
              <div v-else class="no-links">No linked verses yet.</div>
              
              <!-- Add Link Form -->
              <div v-if="addingLinkToVerse === verse.verse_id" class="add-link-form">
                <input 
                  v-model="linkSearch" 
                  type="text" 
                  placeholder="Search verses to link..."
                  @input="searchVersesToLink"
                  class="link-search-input"
                />
                <div v-if="searchResults.length > 0" class="search-results">
                  <div 
                    v-for="result in searchResults" 
                    :key="result.verse_id" 
                    @click="selectVerseToLink(verse.verse_id, result.verse_id)"
                    class="search-result-item"
                  >
                    <div class="search-result-ref">{{ result.book_name }} {{ result.chapter_number }}:{{ result.verse_index }}</div>
                    <div class="search-result-text">{{ result.verse }}</div>
                  </div>
                </div>
                <button @click="cancelAddLink" class="btn btn-sm btn-secondary btn-cancel-link">Cancel</button>
              </div>
            </div>
            
            <!-- Tags Section -->
            <div v-if="showTagsForVerse === verse.verse_id" class="tags-section">
              <div class="section-header">
                <h4>Tags</h4>
                <button @click="startAddTag(verse.verse_id)" class="btn btn-sm btn-success btn-add-tag">+ Add Tag</button>
              </div>
              
              <div v-if="loadingTags" class="loading-tags">Loading tags...</div>
              
              <div v-else-if="verseTags[verse.verse_id]?.length > 0" class="tags-list">
                <span v-for="tag in verseTags[verse.verse_id]" :key="tag.tag_id" class="tag-badge">
                  {{ tag.tag_name }}
                </span>
              </div>
              
              <div v-else class="no-tags">No tags yet.</div>
              
              <!-- Add Tag Form -->
              <div v-if="addingTagToVerse === verse.verse_id" class="add-tag-form">
                <select v-model="selectedTagId" class="tag-select">
                  <option value="">Select existing tag...</option>
                  <option v-for="tag in allTags" :key="tag.tag_id" :value="tag.tag_id">
                    {{ tag.tag_name }}
                  </option>
                </select>
                <div class="or-divider">OR</div>
                <input 
                  v-model="newTag.name" 
                  type="text" 
                  placeholder="Create new tag name"
                  class="new-tag-input"
                />
                <input 
                  v-model="newTag.description" 
                  type="text" 
                  placeholder="Tag description (optional)"
                  class="new-tag-desc-input"
                />
                <div class="tag-form-actions">
                  <button @click="saveTag(verse.verse_id)" class="btn btn-sm btn-primary btn-save-tag">Save Tag</button>
                  <button @click="cancelAddTag" class="btn btn-sm btn-secondary btn-cancel-tag">Cancel</button>
                </div>
              </div>
            </div>
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
import { getNotesByVerseId, createNote, linkNoteToVerse } from '@/api/notes';
import { getLinkedVerses, createVerseLink, getTagsByVerseId, getAllTags, createTag, linkTagToVerse, searchVerses } from '@/api/links-tags';
import type { Book, Chapter, Verse, VerseUpdate, Note, Tag } from '@/utils/collectionReferences';
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

// Notes management
const showNotesForVerse = ref<number | null>(null);
const verseNotes = ref<Record<number, Note[]>>({});
const loadingNotes = ref(false);
const addingNoteToVerse = ref<number | null>(null);
const newNote = ref({ title: '', content: '' });

// Links management
const showLinksForVerse = ref<number | null>(null);
const verseLinks = ref<Record<number, number[]>>({});
const loadingLinks = ref(false);
const addingLinkToVerse = ref<number | null>(null);
const linkSearch = ref('');
const searchResults = ref<Array<{ 
  verse_id: number, 
  chapter_id: number, 
  verse_index: number, 
  verse: string,
  chapter_number: string,
  book_name: string 
}>>([]);

// Tags management
const showTagsForVerse = ref<number | null>(null);
const verseTags = ref<Record<number, Tag[]>>({});
const loadingTags = ref(false);
const addingTagToVerse = ref<number | null>(null);
const allTags = ref<Tag[]>([]);
const selectedTagId = ref<string>('');
const newTag = ref({ name: '', description: '' });

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

// Notes functions
async function toggleNotes(verseId: number) {
  if (showNotesForVerse.value === verseId) {
    showNotesForVerse.value = null;
    return;
  }
  
  showNotesForVerse.value = verseId;
  await loadNotesForVerse(verseId);
}

async function loadNotesForVerse(verseId: number) {
  try {
    loadingNotes.value = true;
    const notes = await getNotesByVerseId(verseId);
    verseNotes.value[verseId] = notes;
  } catch (e) {
    console.error('Failed to load notes:', e);
  } finally {
    loadingNotes.value = false;
  }
}

function startAddNote(verseId: number) {
  addingNoteToVerse.value = verseId;
  newNote.value = { title: '', content: '' };
}

function cancelAddNote() {
  addingNoteToVerse.value = null;
  newNote.value = { title: '', content: '' };
}

async function saveNote(verseId: number) {
  if (!newNote.value.content.trim()) {
    alert('Note content cannot be empty');
    return;
  }
  
  try {
    // Create the note
    const result = await createNote({
      note_title: newNote.value.title || undefined,
      note_content: newNote.value.content
    });
    
    // Link note to verse
    await linkNoteToVerse({
      verse_id: verseId,
      note_id: result.note_id
    });
    
    // Reload notes for this verse
    await loadNotesForVerse(verseId);
    
    // Reset form
    cancelAddNote();
  } catch (e) {
    alert('Failed to save note: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

// Links functions
async function toggleLinks(verseId: number) {
  if (showLinksForVerse.value === verseId) {
    showLinksForVerse.value = null;
    return;
  }
  
  showLinksForVerse.value = verseId;
  await loadLinksForVerse(verseId);
}

async function loadLinksForVerse(verseId: number) {
  try {
    loadingLinks.value = true;
    const links = await getLinkedVerses(verseId);
    verseLinks.value[verseId] = [...links.source, ...links.target];
  } catch (e) {
    console.error('Failed to load links:', e);
  } finally {
    loadingLinks.value = false;
  }
}

function startAddLink(verseId: number) {
  addingLinkToVerse.value = verseId;
  linkSearch.value = '';
  searchResults.value = [];
}

function cancelAddLink() {
  addingLinkToVerse.value = null;
  linkSearch.value = '';
  searchResults.value = [];
}

async function searchVersesToLink() {
  if (linkSearch.value.length < 3) {
    searchResults.value = [];
    return;
  }
  
  try {
    searchResults.value = await searchVerses(linkSearch.value);
  } catch (e) {
    console.error('Failed to search verses:', e);
  }
}

async function selectVerseToLink(sourceVerseId: number, targetVerseId: number) {
  try {
    await createVerseLink({
      source_verse_id: sourceVerseId,
      target_verse_id: targetVerseId
    });
    
    await loadLinksForVerse(sourceVerseId);
    cancelAddLink();
  } catch (e) {
    alert('Failed to link verse: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

// Tags functions
async function toggleTags(verseId: number) {
  if (showTagsForVerse.value === verseId) {
    showTagsForVerse.value = null;
    return;
  }
  
  showTagsForVerse.value = verseId;
  await loadTagsForVerse(verseId);
  await loadAllTags();
}

async function loadTagsForVerse(verseId: number) {
  try {
    loadingTags.value = true;
    const tags = await getTagsByVerseId(verseId);
    verseTags.value[verseId] = tags;
  } catch (e) {
    console.error('Failed to load tags:', e);
  } finally {
    loadingTags.value = false;
  }
}

async function loadAllTags() {
  try {
    allTags.value = await getAllTags();
  } catch (e) {
    console.error('Failed to load all tags:', e);
  }
}

function startAddTag(verseId: number) {
  addingTagToVerse.value = verseId;
  selectedTagId.value = '';
  newTag.value = { name: '', description: '' };
}

function cancelAddTag() {
  addingTagToVerse.value = null;
  selectedTagId.value = '';
  newTag.value = { name: '', description: '' };
}

async function saveTag(verseId: number) {
  let tagIdToLink = selectedTagId.value;
  
  // Create new tag if name is provided
  if (newTag.value.name.trim()) {
    try {
      const result = await createTag({
        tag_name: newTag.value.name,
        tag_description: newTag.value.description || undefined
      });
      tagIdToLink = String(result.tag_id);
    } catch (e) {
      alert('Failed to create tag: ' + (e instanceof Error ? e.message : 'Unknown error'));
      return;
    }
  }
  
  if (!tagIdToLink) {
    alert('Please select a tag or create a new one');
    return;
  }
  
  try {
    await linkTagToVerse({
      verse_id: verseId,
      tag_id: Number(tagIdToLink)
    });
    
    await loadTagsForVerse(verseId);
    await loadAllTags();
    cancelAddTag();
  } catch (e) {
    alert('Failed to link tag: ' + (e instanceof Error ? e.message : 'Unknown error'));
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

.verse-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-edit, .btn-notes {
  padding: 0.375rem 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-edit:hover, .btn-notes:hover {
  background: #5568d3;
}

.btn-notes {
  background: #28a745;
}

.btn-notes:hover {
  background: #218838;
}

.btn-links {
  background: #17a2b8;
}

.btn-links:hover {
  background: #138496;
}

.btn-tags {
  background: #ffc107;
  color: #333;
}

.btn-tags:hover {
  background: #e0a800;
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

/* Notes Section */
.notes-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-left: 3px solid #28a745;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.notes-header h4 {
  margin: 0;
  color: #333;
  font-size: 0.875rem;
}

.btn-add-note {
  padding: 0.25rem 0.5rem;
  background: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-add-note:hover {
  background: #218838;
}

.loading-notes, .no-notes {
  text-align: center;
  padding: 0.75rem;
  color: #999;
  font-size: 0.8rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.note-item {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.note-item h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.875rem;
}

.note-content {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #555;
  margin-bottom: 0.5rem;
}

.note-meta {
  font-size: 0.7rem;
  color: #999;
}

.add-note-form {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.note-title-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.note-content-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  font-size: 0.8rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 0.5rem;
}

.note-form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-save-note, .btn-cancel-note {
  padding: 0.375rem 0.75rem;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-save-note {
  background: #28a745;
  color: white;
}

.btn-save-note:hover {
  background: #218838;
}

.btn-cancel-note {
  background: #6c757d;
  color: white;
}

.btn-cancel-note:hover {
  background: #5a6268;
}

/* Links Section */
.links-section, .tags-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-left: 3px solid #17a2b8;
}

.tags-section {
  border-left-color: #ffc107;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-header h4 {
  margin: 0;
  color: #333;
  font-size: 0.875rem;
}

.btn-add-link, .btn-add-tag {
  padding: 0.25rem 0.5rem;
  background: #17a2b8;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
}

.btn-add-tag {
  background: #ffc107;
  color: #333;
}

.btn-add-link:hover {
  background: #138496;
}

.btn-add-tag:hover {
  background: #e0a800;
}

.loading-links, .no-links, .loading-tags, .no-tags {
  text-align: center;
  padding: 0.75rem;
  color: #999;
  font-size: 0.8rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.link-item {
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-size: 0.8rem;
  color: #17a2b8;
  font-weight: 600;
}

.add-link-form {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.link-search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-result-item {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:hover {
  background: #f8f9fa;
}

.search-result-ref {
  font-weight: 600;
  color: #17a2b8;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.search-result-text {
  font-size: 0.75rem;
  color: #555;
}

.btn-cancel-link {
  padding: 0.375rem 0.75rem;
  background: #6c757d;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-cancel-link:hover {
  background: #5a6268;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #ffc107;
  color: #333;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.add-tag-form {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.tag-select, .new-tag-input, .new-tag-desc-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.or-divider {
  text-align: center;
  color: #999;
  font-size: 0.75rem;
  margin: 0.5rem 0;
}

.tag-form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-save-tag, .btn-cancel-tag {
  padding: 0.375rem 0.75rem;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-save-tag {
  background: #ffc107;
  color: #333;
}

.btn-save-tag:hover {
  background: #e0a800;
}

.btn-cancel-tag {
  background: #6c757d;
  color: white;
}

.btn-cancel-tag:hover {
  background: #5a6268;
}
</style>

