<template>
  <div class="chapter-editor">
    <header class="page-header">
      <div class="page-header-titles">
        <router-link to="/admin/chapters" class="back-link">← Back to Chapters</router-link>
        <h1>{{ chapterTitle }}</h1>
        <p v-if="chapter" class="chapter-subtitle">{{ getBookName(chapter.book_id) }} · Chapter {{ chapter.chapter_number }}</p>
      </div>
      <div class="header-actions">
        <button
          v-if="!selectingVerseRange"
          @click="startRangeSelection"
          class="action-pill action-pill-outline"
          title="Add note to multiple verses"
        >
          <span aria-hidden="true">📝</span> Add Note to Range
        </button>
        <button
          v-if="selectingVerseRange"
          @click="cancelRangeSelection"
          class="action-pill action-pill-cancel"
        >
          <span aria-hidden="true">✕</span> Cancel Range Selection
        </button>
      </div>
    </header>

    <div v-if="chapter" class="chapter-nav">
      <button
        class="action-pill action-pill-nav"
        :disabled="!previousChapter"
        :title="previousChapter ? `Go to chapter ${previousChapter.chapter_number}` : 'This is the first chapter'"
        @click="previousChapter && goToChapter(previousChapter.chapter_id)"
      >
        ← Previous Chapter
      </button>
      <span class="chapter-nav-position">
        Chapter {{ chapter.chapter_number }} ({{ currentChapterIndex + 1 }} of {{ sortedBookChapters.length }})
      </span>
      <button
        class="action-pill action-pill-nav"
        :disabled="!nextChapter"
        :title="nextChapter ? `Go to chapter ${nextChapter.chapter_number}` : 'This is the last chapter'"
        @click="nextChapter && goToChapter(nextChapter.chapter_id)"
      >
        Next Chapter →
      </button>
    </div>

    <div class="editor-container">
      <div v-if="loading" class="loading">Loading verses...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      
      <div v-else class="verses-list">
        <div v-if="verses.length === 0" class="empty">
          No verses found for this chapter.
        </div>
        
        <div v-for="verse in sortedVerses" :key="verse.verse_id" class="verse-item" :class="{ 'selected-for-range': selectedVerseIds && selectedVerseIds.includes(verse.verse_id), 'is-editing': editingVerseId === verse.verse_id }">
          <div class="verse-header">
            <div class="verse-number-section">
              <input
                v-if="selectingVerseRange"
                type="checkbox"
                :checked="selectedVerseIds && selectedVerseIds.includes(verse.verse_id)"
                @change="toggleVerseSelection(verse.verse_id)"
                class="verse-checkbox"
                :aria-label="`Select verse ${verse.verse_index}`"
              />
              <span class="verse-number-badge">{{ verse.verse_index }}</span>
            </div>
            <div class="verse-actions" v-if="editingVerseId !== verse.verse_id">
              <button
                @click="startEditVerse(verse)"
                class="action-pill action-pill-primary"
                title="Edit verse"
              >
                <span aria-hidden="true">✏️</span> Edit
              </button>
              <button
                @click="toggleNotes(verse.verse_id)"
                class="action-pill action-pill-notes"
                title="Manage notes"
              >
                <span aria-hidden="true">📝</span> Notes
              </button>
              <button
                @click="openHistory(verse.verse_id)"
                class="action-pill action-pill-history"
                :disabled="!verse.history_count"
                :title="verse.history_count ? 'View edit history' : 'No edit history yet for this verse'"
              >
                <span aria-hidden="true">🕘</span> History
              </button>
            </div>
            <div v-else class="verse-actions edit-actions">
              <button @click="saveVerse(verse.verse_id)" class="action-pill action-pill-save">
                <span aria-hidden="true">💾</span> Save
              </button>
              <button @click="cancelEdit" class="action-pill action-pill-cancel">
                <span aria-hidden="true">✕</span> Cancel
              </button>
            </div>
          </div>

          <div v-if="editingVerseId !== verse.verse_id" class="verse-content">
            <div class="verse-text-block">
              <div class="verse-text" v-html="formatVerseWithPaleoBora(verse.verse)"></div>
            </div>
            <div v-if="verse.telugu_verse" class="verse-text-block verse-text-block-telugu">
              <div class="verse-telugu" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
            </div>
            <div class="verse-meta-bar">
              <span aria-hidden="true">🕘</span> Last modified {{ formatDateTime(verse.dt_modified) }}
            </div>

            <!-- Always visible notes -->
            <div v-if="verseNotes[verse.verse_id]?.length > 0" class="verse-notes-display">
              <div v-for="note in verseNotes[verse.verse_id]" :key="note.note_id" class="note-display-item">
                <div v-if="note.note_title" class="note-display-title">{{ note.note_title }}</div>
                <div class="note-display-content" v-html="note.note_content"></div>
              </div>
            </div>
            
            <!-- Notes Display -->
            <div v-if="showNotesForVerse === verse.verse_id" class="notes-section">
              <div class="notes-header">
                <h4>Notes</h4>
                <button
                  v-if="!verseNotes[verse.verse_id] || verseNotes[verse.verse_id].length === 0"
                  @click="startAddNote(verse.verse_id)"
                  class="btn btn-sm btn-success btn-add-note"
                >+ Add Note</button>
              </div>
              
              <div v-if="loadingNotes" class="loading-notes">Loading notes...</div>
              
              <div v-else-if="verseNotes[verse.verse_id]?.length > 0" class="notes-list">
                <div v-for="note in verseNotes[verse.verse_id]" :key="note.note_id" class="note-item">
                  <div v-if="editingNoteId === note.note_id" class="note-edit-form">
                    <input 
                      v-model="editingNote.title" 
                      type="text" 
                      placeholder="Note title (optional)"
                      class="note-title-input"
                    />
                    <div :ref="el => { if (el && editingNoteId === note.note_id) setupNoteEditor(el as HTMLElement); }" class="note-editor-container"></div>
                    <div class="note-form-actions">
                      <button @click="saveEditedNote(note.note_id)" class="btn btn-sm btn-primary">Save</button>
                      <button @click="cancelEditNote" class="btn btn-sm btn-secondary">Cancel</button>
                    </div>
                  </div>
                  <div v-else class="note-content-wrapper">
                    <h5 v-if="note.note_title">{{ note.note_title }}</h5>
                    <div class="note-content" v-html="note.note_content"></div>
                    <div class="note-meta">{{ new Date(note.dt_modified).toLocaleDateString() }}</div>
                  </div>
                  <div class="note-actions">
                    <button 
                      v-if="editingNoteId !== note.note_id"
                      @click="startEditNote(note)" 
                      class="btn btn-sm btn-primary btn-edit-note"
                      title="Edit note"
                    >
                      ✏️
                    </button>
                    <button 
                      @click="deleteNoteFromVerse(verse.verse_id, note.verse_note_id)" 
                      class="btn btn-sm btn-danger btn-delete-note"
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
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
                <div :ref="el => { if (el && addingNoteToVerse === verse.verse_id) setupNewNoteEditor(el as HTMLElement); }" class="note-editor-container"></div>
                <div class="note-form-actions">
                  <button @click="saveNote(verse.verse_id)" class="btn btn-sm btn-primary btn-save-note">Save Note</button>
                  <button @click="cancelAddNote" class="btn btn-sm btn-secondary btn-cancel-note">Cancel</button>
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
              <label class="telugu-label-with-action">
                <span>Telugu Verse (Optional):</span>
                <button 
                  @click="translateToTelugu" 
                  class="btn btn-sm btn-info btn-translate"
                  :disabled="translating"
                  title="Translate English verse to Telugu using Google Translate"
                >
                  {{ translating ? '🔄 Translating...' : '🌐 Translate to Telugu' }}
                </button>
              </label>
              
              <!-- Translation Result Display -->
              <div v-if="showTranslation && translatedText" class="translation-result">
                <div class="translation-header">
                  <span class="translation-label">📝 Translation Result:</span>
                  <button 
                    @click="replaceTeluguVerse" 
                    class="btn btn-sm btn-success btn-replace"
                    title="Replace Telugu verse content with this translation"
                  >
                    ✅ Replace Telugu Verse
                  </button>
                </div>
                <div class="translation-content" v-html="translatedText"></div>
              </div>
              
              <div id="telugu-editor" class="quill-editor"></div>
            </div>
          </div>
        </div>
        
        <!-- Range Note Form -->
        <div v-if="selectingVerseRange && selectedVerseIds.length > 0" class="range-note-form">
          <div class="range-note-header">
            <h3>Add Note to {{ selectedVerseIds.length }} Selected Verse(s)</h3>
            <p class="selected-verses-info">Verses: {{ getSelectedVerseNumbers() }}</p>
          </div>
          <input 
            v-model="rangeNote.title" 
            type="text" 
            placeholder="Note title (optional)"
            class="form-control mb-2"
          />
          <textarea 
            v-model="rangeNote.content" 
            placeholder="Note content..."
            rows="4"
            class="form-control mb-2"
          ></textarea>
          <div class="range-note-actions">
            <button @click="saveRangeNote" class="btn btn-primary" :disabled="!rangeNote.content">Save Note for Selected Verses</button>
            <button @click="cancelRangeSelection" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <AnimatePresence>
      <motion.div
        v-if="historyModalVerseId !== null"
        class="history-modal-overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="overlayFade"
        @click="closeHistory"
      >
        <motion.div
          class="history-modal-content"
          :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :exit="{ opacity: 0, scale: 0.94, y: 8 }"
          :transition="tooltipSpring"
          @click.stop
        >
          <div class="history-modal-header">
            <h3>Verse Edit History</h3>
            <motion.button class="history-close-button" :while-tap="tapScale" @click="closeHistory" aria-label="Close history">&times;</motion.button>
          </div>

          <div class="history-modal-body">
            <div v-if="loadingHistory" class="loading-notes">Loading history...</div>

            <div v-else-if="historyEntries.length === 0" class="no-notes">
              No prior edits recorded for this verse yet.
            </div>

            <div v-else class="history-list">
              <div v-for="entry in historyEntries" :key="entry.history_id" class="history-entry">
                <div class="history-entry-meta">
                  <span class="history-entry-type" :class="`history-type-${entry.change_type.toLowerCase()}`">
                    {{ entry.change_type === 'DELETE' ? 'Deleted' : 'Edited' }}
                  </span>
                  <span class="history-entry-date">{{ formatDateTime(entry.changed_at) }}</span>
                  <span v-if="entry.changed_by" class="history-entry-by">by {{ entry.changed_by }}</span>
                </div>
                <div class="history-entry-text">{{ stripHtml(entry.verse) }}</div>
                <div v-if="entry.telugu_verse" class="history-entry-telugu">{{ stripHtml(entry.telugu_verse) }}</div>
                <div class="history-entry-actions">
                  <button
                    @click="restoreHistoryEntry(entry)"
                    class="btn btn-sm btn-restore"
                    :disabled="rollingBackId === entry.history_id"
                  >
                    {{ rollingBackId === entry.history_id ? '⏳ Restoring...' : '⏪ Restore this version' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { motion, AnimatePresence } from 'motion-v';
import { useMotionPresets } from '@/composables/useMotionPresets';
import { getAllBooks } from '@/api/books';
import { getChapterById, getChaptersByBookId } from '@/api/chapters';
import {
  getVersesByChapterId,
  updateVerse,
  getVerseHistory,
  rollbackVerse,
  type VerseWithLinks,
  type VerseNoteData,
  type VerseHistoryEntry,
} from '@/api/verses';
import { getNotesByVerseId, createNote, linkNoteToVerse, unlinkNoteFromVerse, updateNote } from '@/api/notes';
import type { Book, Chapter, Verse, VerseUpdate } from '@/utils/collectionReferences';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '@/assets/fonts/fonts.css';

const { prefersReducedMotion, tooltipSpring, tapScale, overlayFade } = useMotionPresets();

const route = useRoute();
const router = useRouter();
const books = ref<Book[]>([]);
const chapter = ref<Chapter | null>(null);
const bookChapters = ref<Chapter[]>([]);
const verses = ref<VerseWithLinks[]>([]);
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

// Translation management
const translating = ref(false);
const translatedText = ref('');
const showTranslation = ref(false);

// Notes management
const showNotesForVerse = ref<number | null>(null);
const verseNotes = ref<Record<number, VerseNoteData[]>>({});
const loadingNotes = ref(false);
const addingNoteToVerse = ref<number | null>(null);
const newNote = ref({ title: '', content: '' });
const editingNoteId = ref<number | null>(null);
const editingNote = ref({ title: '', content: '' });
const noteEditor = ref<Quill | null>(null);
const selectingVerseRange = ref<boolean>(false);
const selectedVerseIds = ref<number[]>([]);
const rangeNote = ref<{ title: string; content: string }>({ title: '', content: '' });

// Verse history / rollback
const historyModalVerseId = ref<number | null>(null);
const historyEntries = ref<VerseHistoryEntry[]>([]);
const loadingHistory = ref(false);
const rollingBackId = ref<number | null>(null);



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

const sortedBookChapters = computed(() => {
  return [...bookChapters.value].sort((a, b) => Number(a.chapter_number) - Number(b.chapter_number));
});

const currentChapterIndex = computed(() => {
  if (!chapter.value) return -1;
  return sortedBookChapters.value.findIndex(c => c.chapter_id === chapter.value!.chapter_id);
});

const previousChapter = computed(() => {
  const idx = currentChapterIndex.value;
  return idx > 0 ? sortedBookChapters.value[idx - 1] : null;
});

const nextChapter = computed(() => {
  const idx = currentChapterIndex.value;
  if (idx === -1 || idx >= sortedBookChapters.value.length - 1) return null;
  return sortedBookChapters.value[idx + 1];
});

function goToChapter(chapterId: number) {
  router.push(`/admin/chapters/${chapterId}`);
}

function formatVerseWithPaleoBora(verseText: string | null): string {
  if (!verseText) return '';
  // Replace Myhla or myhla with span that uses PaleoBora font
  return verseText.replace(/(Myhla|myhla)/gi, '<span class="paleobora-text">$1</span>');
}

// Quill always wraps a single-line editor's content in <p>...</p>, but each verse
// already renders inside its own container (.verse-text / .verse-telugu), so the
// wrapper is redundant — and any trailing content Quill leaves after it (rare, but
// seen from pasted text) would otherwise persist outside the tag on save. Unwrap it
// here so newly saved verses stop reintroducing the empty-<p> rendering artifact.
function unwrapRedundantParagraph(html: string): string {
  const match = html.match(/^\s*<p[^>]*>([\s\S]*)<\/p>\s*([\s\S]*)$/i);
  if (!match) return html;
  if ((match[1].match(/<p[^>]*>/gi) || []).length > 0) return html; // multi-paragraph — leave as-is
  return (match[1] + match[2]).trim();
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

// Vue Router reuses this component instance when navigating between
// /admin/chapters/:id routes (e.g. via the Next/Previous Chapter buttons),
// so onMounted won't refire — reload here instead.
watch(() => route.params.id, (newId) => {
  const chapterId = Number(newId);
  if (!chapterId || isNaN(chapterId)) return;
  resetEditorState();
  loadData(chapterId);
});

function resetEditorState() {
  cancelEdit();
  showNotesForVerse.value = null;
  selectingVerseRange.value = false;
  selectedVerseIds.value = [];
  closeHistory();
}

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
    bookChapters.value = chapterData ? await getChaptersByBookId(chapterData.book_id) : [];

    // Load notes for all verses
    await loadAllNotesForVerses();
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

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function stripHtml(html: string | null): string {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

async function openHistory(verseId: number) {
  historyModalVerseId.value = verseId;
  historyEntries.value = [];
  loadingHistory.value = true;
  try {
    historyEntries.value = await getVerseHistory(verseId);
  } catch (e) {
    alert('Failed to load verse history: ' + (e instanceof Error ? e.message : 'Unknown error'));
  } finally {
    loadingHistory.value = false;
  }
}

function closeHistory() {
  historyModalVerseId.value = null;
  historyEntries.value = [];
}

async function restoreHistoryEntry(entry: VerseHistoryEntry) {
  if (!historyModalVerseId.value) return;
  const confirmed = confirm(
    `Restore this verse to its state from ${formatDateTime(entry.changed_at)}? The current version will be saved to history first, so this can be undone.`
  );
  if (!confirmed) return;

  rollingBackId.value = entry.history_id;
  try {
    await rollbackVerse(historyModalVerseId.value, entry.history_id);

    if (chapter.value) {
      const versesData = await getVersesByChapterId(chapter.value.chapter_id);
      verses.value = versesData;
    }

    await openHistory(historyModalVerseId.value);
  } catch (e) {
    alert('Failed to roll back verse: ' + (e instanceof Error ? e.message : 'Unknown error'));
  } finally {
    rollingBackId.value = null;
  }
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
          [{ 'script': 'sub'}, { 'script': 'super' }],
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
          [{ 'script': 'sub'}, { 'script': 'super' }],
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
  // Reset translation state
  translating.value = false;
  translatedText.value = '';
  showTranslation.value = false;
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
    editFormData.value.verse = unwrapRedundantParagraph(englishEditor.value.root.innerHTML);
  }
  if (teluguEditor.value) {
    editFormData.value.telugu_verse = unwrapRedundantParagraph(teluguEditor.value.root.innerHTML);
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
        telugu_verse: editFormData.value.telugu_verse || null,
        dt_modified: new Date(),
        history_count: (verses.value[index].history_count ?? 0) + 1
        // verse_index is preserved from the spread operator
      };
    }
    
    cancelEdit();
  } catch (e) {
    alert('Failed to save verse: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

// Translation functions
async function translateToTelugu() {
  if (!englishEditor.value) {
    alert('English editor not initialized');
    return;
  }
  
  // Get plain text from English editor (strip HTML)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = englishEditor.value.root.innerHTML;
  const englishText = tempDiv.textContent || tempDiv.innerText || '';
  
  if (!englishText.trim()) {
    alert('English verse is empty. Please enter text to translate.');
    return;
  }
  
  translating.value = true;
  showTranslation.value = false;
  
  try {
    // Using Google Translate API via a free proxy service
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(englishText)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Translation service unavailable');
    }
    
    const data = await response.json();
    
    // Extract translated text from response
    let translated = '';
    if (data && data[0]) {
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i][0]) {
          translated += data[0][i][0];
        }
      }
    }
    
    if (!translated) {
      throw new Error('Translation returned empty result');
    }
    
    translatedText.value = translated;
    showTranslation.value = true;
    
  } catch (e) {
    alert('Translation failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    console.error('Translation error:', e);
  } finally {
    translating.value = false;
  }
}

function replaceTeluguVerse() {
  if (!teluguEditor.value || !translatedText.value) {
    return;
  }
  
  // Set the translated text in the Telugu editor
  teluguEditor.value.root.innerHTML = translatedText.value;
  
  // Close the translation result display
  showTranslation.value = false;
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
    // Cast to VerseNoteData since the backend includes verse_note_id
    verseNotes.value[verseId] = notes as unknown as VerseNoteData[];
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
  if (noteEditor.value) {
    noteEditor.value = null;
  }
}

function setupNewNoteEditor(element: HTMLElement) {
  if (noteEditor.value) return;
  
  noteEditor.value = new Quill(element, {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
      ]
    }
  });
  
  noteEditor.value.root.innerHTML = newNote.value.content;
}

function setupNoteEditor(element: HTMLElement) {
  if (noteEditor.value) return;
  
  noteEditor.value = new Quill(element, {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
      ]
    }
  });
  
  noteEditor.value.root.innerHTML = editingNote.value.content;
}

function startEditNote(note: VerseNoteData) {
  editingNoteId.value = note.note_id;
  editingNote.value = {
    title: note.note_title || '',
    content: note.note_content
  };
  // Reset editor ref so it can be recreated
  noteEditor.value = null;
}

function cancelEditNote() {
  editingNoteId.value = null;
  editingNote.value = { title: '', content: '' };
  if (noteEditor.value) {
    noteEditor.value = null;
  }
}

async function saveEditedNote(noteId: number) {
  if (!noteEditor.value) return;
  
  try {
    const content = noteEditor.value.root.innerHTML;
    await updateNote(noteId, {
      note_title: editingNote.value.title || undefined,
      note_content: content
    });
    
    // Reload all verse data to get updated notes
    if (chapter.value) {
      const versesData = await getVersesByChapterId(chapter.value.chapter_id);
      verses.value = versesData;
      await loadAllNotesForVerses();
    }
    
    cancelEditNote();
  } catch (e) {
    alert('Failed to update note: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

async function loadAllNotesForVerses() {
  // Extract notes from verses data (already loaded from backend)
  for (const verse of verses.value) {
    if (verse.notes && verse.notes.length > 0) {
      verseNotes.value[verse.verse_id] = verse.notes;
    }
  }
}

async function deleteNoteFromVerse(_verseId: number, verseNoteId: number) {
  if (!confirm('Are you sure you want to delete this note?')) {
    return;
  }
  
  try {
    await unlinkNoteFromVerse(verseNoteId);
    // Reload all verse data to get updated notes/links
    if (chapter.value) {
      const versesData = await getVersesByChapterId(chapter.value.chapter_id);
      verses.value = versesData;
      await loadAllNotesForVerses();
    }
  } catch (e) {
    alert('Failed to delete note: ' + (e instanceof Error ? e.message : 'Unknown error'));
  }
}

// Range Note Functions
function startRangeSelection() {
  selectingVerseRange.value = true;
  selectedVerseIds.value = [];
  rangeNote.value = { title: '', content: '' };
}

function cancelRangeSelection() {
  selectingVerseRange.value = false;
  selectedVerseIds.value = [];
  rangeNote.value = { title: '', content: '' };
}

function toggleVerseSelection(verseId: number) {
  const index = selectedVerseIds.value.indexOf(verseId);
  if (index > -1) {
    selectedVerseIds.value.splice(index, 1);
  } else {
    selectedVerseIds.value.push(verseId);
  }
}

function getSelectedVerseNumbers(): string {
  const verseNumbers = selectedVerseIds.value
    .map(id => {
      const verse = verses.value.find(v => v.verse_id === id);
      return verse?.verse_index;
    })
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));
  return verseNumbers.join(', ');
}

async function saveRangeNote() {
  if (!rangeNote.value.content || selectedVerseIds.value.length === 0) {
    alert('Please enter note content and select at least one verse');
    return;
  }

  try {
    // Create the note
    const noteData = await createNote({
      note_title: rangeNote.value.title || undefined,
      note_content: rangeNote.value.content
    });

    // Link the note to all selected verses
    for (const verseId of selectedVerseIds.value) {
      await linkNoteToVerse({ verse_id: verseId, note_id: noteData.note_id });
    }

    alert(`Note added to ${selectedVerseIds.value.length} verse(s) successfully!`);
    cancelRangeSelection();
    
    // Reload verses to show new notes
    if (chapter.value) {
      await loadData(chapter.value.chapter_id);
    }
  } catch (error) {
    console.error('Failed to save range note:', error);
    alert('Failed to save note. Please try again.');
  }
}

async function saveNote(verseId: number) {
  if (!noteEditor.value) {
    alert('Editor not initialized');
    return;
  }
  
  const content = noteEditor.value.root.innerHTML;
  if (!content.trim() || content === '<p><br></p>') {
    alert('Note content cannot be empty');
    return;
  }
  
  try {
    // Create the note
    const result = await createNote({
      note_title: newNote.value.title || undefined,
      note_content: content
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


</script>

<style scoped>
.chapter-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #f4f5f7;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e0e0e0;
}

.page-header-titles {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.page-header h1 {
  color: #1f2430;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.chapter-subtitle {
  color: #666;
  margin: 0;
  font-size: 0.875rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

.editor-container {
  background: transparent;
}

.loading, .error, .empty {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
  background: white;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
}

.error {
  color: #e74c3c;
}

.verses-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.verse-item {
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
  background: white;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.verse-item:hover {
  box-shadow: 0 4px 14px rgba(16, 24, 40, 0.08);
  border-color: #d8dce6;
}

.verse-item.selected-for-range {
  background: #eef5ff;
  border-color: #667eea;
}

.verse-item.is-editing {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
}

.verse-number-section {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.verse-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.range-note-form {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1.5rem;
  border-top: 2px solid #667eea;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -4px 16px rgba(16, 24, 40, 0.1);
  margin-top: 0.5rem;
}

.range-note-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.selected-verses-info {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.range-note-actions {
  display: flex;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.chapter-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.chapter-nav-position {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
}

.verse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
}

.verse-number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.35rem;
  border-radius: 50%;
  background: #eef0ff;
  color: #4c56c9;
  font-size: 0.85rem;
  font-weight: 700;
}

.verse-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Unified pill-style action buttons */
.action-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  min-height: 36px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  color: white;
  transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.action-pill:active {
  transform: scale(0.97);
}

.action-pill:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.action-pill:disabled:active {
  transform: none;
}

.action-pill-primary {
  background: #667eea;
}
.action-pill-primary:hover {
  background: #5568d3;
}

.action-pill-notes {
  background: #28a745;
}
.action-pill-notes:hover {
  background: #218838;
}

.action-pill-history {
  background: #6c757d;
}
.action-pill-history:hover {
  background: #5a6268;
}

.action-pill-save {
  background: #28a745;
}
.action-pill-save:hover {
  background: #218838;
}

.action-pill-cancel {
  background: #6c757d;
}
.action-pill-cancel:hover {
  background: #5a6268;
}

.action-pill-outline {
  background: white;
  color: #28a745;
  border: 1px solid #28a745;
}
.action-pill-outline:hover {
  background: #f0fdf4;
}

.action-pill-nav {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
}
.action-pill-nav:hover:not(:disabled) {
  background: #eef0ff;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.verse-content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: left;
}

.verse-text-block {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding-left: 0.75rem;
  border-left: 3px solid #667eea;
}

.verse-text-block-telugu {
  border-left-color: #28a745;
}

.verse-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
  text-align: left;
  flex: 1;
}

.verse-telugu {
  font-size: 1rem;
  line-height: 1.6;
  color: #444;
  margin: 0;
  flex: 1;
}

.verse-meta-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: #999;
  margin-top: 0.15rem;
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

.telugu-label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.btn-translate {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
}

.translation-result {
  background: #e7f3ff;
  border: 2px solid #2196F3;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.translation-label {
  font-weight: 600;
  color: #1976D2;
  font-size: 0.8rem;
}

.btn-replace {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
}

.translation-content {
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  color: #333;
  line-height: 1.6;
  font-size: 0.9rem;
}

.quill-editor {
  background: white;
  min-height: 150px;
  border-radius: 8px;
  overflow: hidden;
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
  margin-top: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
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
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.note-content-wrapper {
  flex: 1;
}

.note-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-edit-note {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-delete-note {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.note-edit-form {
  width: 100%;
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
  border-radius: 4px;
}

.note-editor-container {
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  min-height: 150px;
}

.note-editor-container :deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid #ddd;
  background: #f8f9fa;
}

.note-editor-container :deep(.ql-container) {
  border: none;
  font-size: 0.8rem;
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

/* Verse History Modal */
.history-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.history-modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  text-align: left;
}

.history-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.history-modal-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.history-close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0;
}

.history-close-button:hover {
  color: #333;
}

.history-modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-entry {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.75rem;
}

.history-entry-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.7rem;
}

.history-entry-type {
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
  color: white;
}

.history-type-update {
  background: #667eea;
}

.history-type-delete {
  background: #e74c3c;
}

.history-entry-date {
  color: #666;
}

.history-entry-by {
  color: #999;
  font-style: italic;
}

.history-entry-text {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #333;
  margin-bottom: 0.35rem;
}

.history-entry-telugu {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #666;
  margin-bottom: 0.5rem;
}

.history-entry-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-restore {
  padding: 0.375rem 0.75rem;
  background: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-restore:hover:not(:disabled) {
  background: #218838;
}

.btn-restore:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

</style>

