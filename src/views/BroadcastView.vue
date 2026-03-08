<template>
  <div class="broadcast-page">
    <ChaptersView
      ref="chaptersViewRef"
      :broadcast-mode="true"
      @broadcast-verse-change="onVerseChange"
      @settings-change="onSettingsChange"
    />

    <!-- Broadcast Mode Right Panel -->
    <div class="broadcast-mode-right-panel">
      <div v-if="!broadcastPanelVerse" class="panel-placeholder">
        <p>Click or scroll to a verse to view its cross-references</p>
      </div>

      <!-- Cross-references for clicked/scroll-visible verse -->
      <div v-if="broadcastPanelVerse" class="broadcast-crossrefs">
        <div class="broadcast-crossrefs-heading">
          <span class="broadcast-verse-label">
            {{ currentBook?.book_name }} {{ broadcastPanelVerse.chapterNumber }}:{{ broadcastPanelVerse.verse.verse_index }}
          </span>
          <div class="broadcast-crossrefs-heading-actions">
            <span class="broadcast-crossrefs-count" v-if="broadcastPanelVerse.verse.crossReferences && broadcastPanelVerse.verse.crossReferences.length">
              {{ broadcastPanelVerse.verse.crossReferences.length }} cross-reference{{ broadcastPanelVerse.verse.crossReferences.length !== 1 ? 's' : '' }}
            </span>
            <button
              v-if="broadcastPanelVerse.verse.crossReferences && broadcastPanelVerse.verse.crossReferences.length > 0"
              class="broadcast-expand-all-btn"
              @click="expandAllBroadcastCrossRefs"
              title="Expand all"
            >Expand all</button>
            <button
              v-if="broadcastPanelVerse.verse.crossReferences && broadcastPanelVerse.verse.crossReferences.length > 0"
              class="broadcast-expand-all-btn"
              @click="collapseAllBroadcastCrossRefs"
              title="Collapse all"
            >Collapse all</button>
          </div>
        </div>
        <!-- Highlight word textbox -->
        <div class="broadcast-highlight-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="broadcast-highlight-icon">
            <path d="M11.5 3.5L17 9l-9.5 9.5-3 .5.5-3L11.5 3.5z"/>
            <line x1="15" y1="5" x2="19" y2="9"/>
          </svg>
          <input
            v-model="broadcastHighlightWord"
            type="text"
            class="broadcast-highlight-input"
            placeholder="Highlight word…"
            autocomplete="off"
            spellcheck="false"
          />
          <button
            v-if="broadcastHighlightWord"
            class="broadcast-highlight-clear"
            title="Clear"
            @click="broadcastHighlightWord = ''"
          >&#x2715;</button>
        </div>

        <div v-if="broadcastPanelVerse.verse.crossReferences && broadcastPanelVerse.verse.crossReferences.length > 0" class="broadcast-crossrefs-list">
          <div
            v-for="crossRef in broadcastPanelVerse.verse.crossReferences"
            :key="crossRef.cross_ref_id"
            class="broadcast-crossref-wrapper"
          >
            <div class="broadcast-crossref-row">
              <a
                href="#"
                class="broadcast-crossref-item"
                :class="{ 'is-expanded': expandedBroadcastCrossRefs.has(crossRef.cross_ref_id) }"
                @click.prevent="toggleBroadcastCrossRef(crossRef)"
              >
                <span class="broadcast-crossref-ref">{{ crossRef.to_book_abbr || crossRef.to_book_name }} {{ crossRef.to_chapter }}:{{ crossRef.to_verse }}</span>
                <span class="broadcast-crossref-chevron" :class="{ 'rotated': expandedBroadcastCrossRefs.has(crossRef.cross_ref_id) }">&#9660;</span>
              </a>
              <button
                class="broadcast-crossref-preview-btn"
                title="Preview verse"
                @click.stop="previewCrossRef($event, crossRef)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
            </div>
            <div v-if="expandedBroadcastCrossRefs.has(crossRef.cross_ref_id)" class="broadcast-crossref-verse" :style="{ fontSize: currentFontSize + 'px' }">
              <div v-if="expandedBroadcastCrossRefs.get(crossRef.cross_ref_id)?.loading" class="broadcast-crossref-loading">
                <div class="loading-spinner small"></div>
              </div>
              <div v-else>
                <div v-if="currentShowEnglish && expandedBroadcastCrossRefs.get(crossRef.cross_ref_id)?.verseText" :class="{ 'hide-superscript': !currentShowSuperscript }" v-html="highlightCrossRefVerse(expandedBroadcastCrossRefs.get(crossRef.cross_ref_id)!.verseText, broadcastHighlightWord)"></div>
                <div v-if="currentShowTelugu && expandedBroadcastCrossRefs.get(crossRef.cross_ref_id)?.teluguVerseText" class="telugu-verse" v-html="highlightCrossRefVerse(expandedBroadcastCrossRefs.get(crossRef.cross_ref_id)!.teluguVerseText, broadcastHighlightWord)"></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="broadcast-crossrefs-empty">
          <p>No cross-references for this verse.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ChaptersView from '@/views/ChaptersView.vue';
import { getChaptersByBookId } from '@/api/chapters';
import { getAllBooks } from '@/api/books';
import { getVersesByChapterId } from '@/api/verses';
import { getAllCrossRefVerseTexts, type CrossReferenceData } from '@/api/crossReferences';

const router = useRouter();

// Ref to ChaptersView instance for calling exposed methods (e.g. showCrossRefTooltip)
const chaptersViewRef = ref<InstanceType<typeof ChaptersView> | null>(null);

// Current verse shown in the broadcast right panel (received from ChaptersView)
const broadcastPanelVerse = ref<{ verse: any; chapterNumber: string } | null>(null);

// Current book received from ChaptersView
const currentBook = ref<any>(null);

// All books cache for cross-ref lookups
const allBooks = ref<any[]>([]);

// Settings mirrored from ChaptersView
const currentShowEnglish = ref(true);
const currentShowTelugu = ref(true);
const currentShowSuperscript = ref(true);
const currentFontSize = ref(16);

// Inline-expanded cross-refs in the right panel
const expandedBroadcastCrossRefs = ref<Map<number, { loading: boolean; verseText: string; teluguVerseText: string }>>(new Map());

// Word to highlight across all expanded broadcast cross-ref verses
const broadcastHighlightWord = ref('');

onMounted(async () => {
  allBooks.value = await getAllBooks();
});

// Called when ChaptersView emits a verse change
function onVerseChange(verse: { verse: any; chapterNumber: string } | null, book: any) {
  broadcastPanelVerse.value = verse;
  currentBook.value = book;
}

// Called when ChaptersView emits a settings change
function onSettingsChange(settings: any) {
  currentShowEnglish.value = settings.showEnglish;
  currentShowTelugu.value = settings.showTelugu;
  currentShowSuperscript.value = settings.showSuperscript;
  currentFontSize.value = settings.fontSize;

  // Navigate back to reading-pane when broadcast mode is turned off
  if (!settings.broadcastMode) {
    router.push({ name: 'reading-pane', state: { bookId: currentBook.value?.book_id } });
  }
}

// Clear expanded cross-refs when the active verse changes
watch(broadcastPanelVerse, () => {
  expandedBroadcastCrossRefs.value = new Map();
});

// Format verse HTML with PaleoBora font spans
function formatVerseWithPaleoBora(text: string): string {
  if (!text) return '';
  const patterns = [
    { search: /HWHY/g, replace: '<span class="paleobora-text">HWHY</span>' },
    { search: /hwhy/g, replace: '<span class="paleobora-text">hwhy</span>' },
    { search: /OSWHY/g, replace: '<span class="paleobora-text">OSWHY</span>' },
    { search: /oswhy/g, replace: '<span class="paleobora-text">oswhy</span>' },
    { search: /MYHLA/g, replace: '<span class="paleobora-text">MYHLA</span>' },
    { search: /Myhla/g, replace: '<span class="paleobora-text">Myhla</span>' },
    { search: /myhla/g, replace: '<span class="paleobora-text">myhla</span>' }
  ];
  let formatted = text;
  patterns.forEach(p => { formatted = formatted.replace(p.search, p.replace); });
  return formatted;
}

// Highlight every occurrence of `word` in an HTML string (skipping tag text)
function highlightCrossRefVerse(html: string, word: string): string {
  if (!word.trim()) return html;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})(?![^<]*>)`, 'gi');
  return html.replace(regex, '<mark class="crossref-highlight">$1</mark>');
}

async function expandAllBroadcastCrossRefs() {
  const panelVerse = broadcastPanelVerse.value;
  const refs = panelVerse?.verse?.crossReferences;
  if (!refs || refs.length === 0) return;

  const fromBookId = currentBook.value?.book_id;
  const fromChapter = String(panelVerse.chapterNumber);
  const fromVerse = String(panelVerse.verse.verse_index);

  if (!fromBookId) return;

  // Mark all not-yet-expanded refs as loading immediately
  for (const crossRef of refs) {
    if (!expandedBroadcastCrossRefs.value.has(crossRef.cross_ref_id)) {
      expandedBroadcastCrossRefs.value.set(crossRef.cross_ref_id, {
        loading: true,
        verseText: '',
        teluguVerseText: '',
      });
    }
  }
  expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);

  try {
    const verseTexts = await getAllCrossRefVerseTexts(fromBookId, fromChapter, fromVerse);
    const textMap = new Map(verseTexts.map((r: any) => [r.cross_ref_id, r]));

    for (const crossRef of refs) {
      const state = expandedBroadcastCrossRefs.value.get(crossRef.cross_ref_id);
      if (!state) continue;
      const result = textMap.get(crossRef.cross_ref_id);
      if (result) {
        state.verseText = formatVerseWithPaleoBora(result.verse_text || '');
        state.teluguVerseText = formatVerseWithPaleoBora(result.telugu_verse_text || '');
      } else {
        state.verseText = 'Verse not found';
        state.teluguVerseText = '';
      }
      state.loading = false;
    }
    expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
  } catch (err) {
    console.error('Error loading all broadcast cross-reference verses:', err);
    for (const crossRef of refs) {
      const state = expandedBroadcastCrossRefs.value.get(crossRef.cross_ref_id);
      if (state && state.loading) {
        state.verseText = 'Error loading verse';
        state.loading = false;
      }
    }
    expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
  }
}

function collapseAllBroadcastCrossRefs() {
  expandedBroadcastCrossRefs.value = new Map();
}

async function toggleBroadcastCrossRef(crossRef: CrossReferenceData) {
  const id = crossRef.cross_ref_id;
  if (expandedBroadcastCrossRefs.value.has(id)) {
    expandedBroadcastCrossRefs.value.delete(id);
    expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
    return;
  }
  const state = { loading: true, verseText: '', teluguVerseText: '' };
  expandedBroadcastCrossRefs.value.set(id, state);
  expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
  try {
    let targetBook;
    if (crossRef.to_book_id) {
      targetBook = allBooks.value.find((b: any) => b.book_id === crossRef.to_book_id);
    } else {
      targetBook = allBooks.value.find((b: any) =>
        b.book_abbr === crossRef.to_book_name ||
        b.book_name.toLowerCase() === crossRef.to_book_name.toLowerCase()
      );
    }
    if (!targetBook) {
      state.verseText = 'Book not found';
      state.loading = false;
      expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
      return;
    }
    const targetChapters = await getChaptersByBookId(targetBook.book_id);
    const targetChapter = targetChapters.find((ch: any) => String(ch.chapter_number) === String(crossRef.to_chapter));
    if (!targetChapter) {
      state.verseText = 'Chapter not found';
      state.loading = false;
      expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
      return;
    }
    const targetVerses = await getVersesByChapterId(targetChapter.chapter_id);
    const targetVerse = targetVerses.find((v: any) => String(v.verse_index) === crossRef.to_verse);
    if (!targetVerse) {
      state.verseText = 'Verse not found';
      state.loading = false;
      expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
      return;
    }
    state.verseText = formatVerseWithPaleoBora(targetVerse.verse || '');
    state.teluguVerseText = formatVerseWithPaleoBora(targetVerse.telugu_verse || '');
    state.loading = false;
    expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
  } catch (err) {
    console.error('Error loading broadcast cross-reference:', err);
    state.verseText = 'Error loading verse';
    state.loading = false;
    expandedBroadcastCrossRefs.value = new Map(expandedBroadcastCrossRefs.value);
  }
}

// Trigger ChaptersView's cross-ref tooltip for a preview
function previewCrossRef(event: MouseEvent, crossRef: CrossReferenceData) {
  chaptersViewRef.value?.showCrossRefTooltip(event, crossRef);
}
</script>

<style scoped>
.broadcast-page {
  min-height: 100vh;
  position: relative;
}

/* ---- right panel ---- */
.broadcast-mode-right-panel {
  position: fixed;
  right: 0;
  top: 90px;
  width: 30%;
  height: calc(100vh - 100px);
  background: white;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 1rem;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

.broadcast-crossrefs {
  padding: 0.5rem 0;
}

.broadcast-crossrefs-heading {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem 0 0.75rem 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 0.75rem;
}

.broadcast-crossrefs-heading-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.broadcast-expand-all-btn {
  background: none;
  border: 1px solid #d1fae5;
  border-radius: 4px;
  color: #059669;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.broadcast-expand-all-btn:hover {
  background: #d1fae5;
  border-color: #059669;
}

.broadcast-verse-label {
  font-weight: 700;
  font-size: 15px;
  color: #2c3e50;
}

.broadcast-crossrefs-count {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
}

.broadcast-crossrefs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.broadcast-crossref-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.broadcast-crossref-row {
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.broadcast-crossref-row .broadcast-crossref-item {
  flex: 1;
}

.broadcast-crossref-preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border-radius: 6px;
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  color: #059669;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.broadcast-crossref-preview-btn:hover {
  background: #d1fae5;
  border-color: #059669;
}

.broadcast-crossref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  background: #f0fdf4;
  color: #065f46;
  text-decoration: none;
  font-size: 14px;
  border: 1px solid #d1fae5;
  transition: background 0.15s, border-color 0.15s;
}

.broadcast-crossref-item:hover,
.broadcast-crossref-item.is-expanded {
  background: #d1fae5;
  border-color: #059669;
}

.broadcast-crossref-item.is-expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.broadcast-crossref-ref {
  font-weight: 600;
}

.broadcast-crossref-chevron {
  font-size: 10px;
  color: #059669;
  transition: transform 0.2s ease;
  display: inline-block;
}

.broadcast-crossref-chevron.rotated {
  transform: rotate(180deg);
}

.broadcast-crossref-verse {
  background: #f8fffe;
  border: 1px solid #d1fae5;
  border-top: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  padding: 8px 10px;
  line-height: 1.6;
  color: #1f2937;
  text-align: left;
}

.broadcast-crossref-loading {
  display: flex;
  justify-content: center;
  padding: 6px 0;
}

.broadcast-crossrefs-empty {
  color: #888;
  font-size: 14px;
  padding: 0.5rem 0;
}

.broadcast-highlight-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 5px 10px;
}

.broadcast-highlight-icon {
  color: #d97706;
  flex-shrink: 0;
}

.broadcast-highlight-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1f2937;
  min-width: 0;
}

.broadcast-highlight-input::placeholder {
  color: #a78bfa;
  opacity: 0.8;
}

.broadcast-highlight-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: #d97706;
  font-size: 13px;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}

.broadcast-highlight-clear:hover {
  color: #b45309;
}

mark.crossref-highlight {
  background: #fef08a;
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

.panel-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 14px;
  text-align: center;
  padding: 2rem;
}

/* Loading spinner */
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #42b983;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* PaleoBora font for v-html content */
.broadcast-crossref-verse :deep(.paleobora-text) {
  font-family: 'PaleoBora', serif !important;
}

/* Telugu verse styling */
.broadcast-crossref-verse .telugu-verse {
  margin-top: 0.4rem;
  color: #555;
}

/* Superscript hiding */
.hide-superscript :deep(sup) {
  display: none;
}
</style>
