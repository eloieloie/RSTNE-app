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
            
            <div v-if="loadingVerses" class="loading-verses">
              Loading verses...
            </div>
            
            <div v-else-if="verses.length === 0" class="no-verses">
              No verses found for this chapter.
            </div>
            
            <div v-else class="verses-list">
              <div 
                v-for="verse in verses" 
                :key="verse.verse_id" 
                :data-verse-id="verse.verse_id"
                class="verse-item"
              >
                <span class="verse-number">{{ verse.verse_index }}</span>
                <div class="verse-content">
                  <div class="verse-text" v-html="formatVerseWithPaleoBora(verse.verse)"></div>
                  <div v-if="verse.telugu_verse" class="verse-telugu" v-html="formatVerseWithPaleoBora(verse.telugu_verse)"></div>
                  
                  <div v-if="verse.links && verse.links.length > 0" class="verse-links">
                    <a 
                      v-for="link in verse.links" 
                      :key="link.target_verse_id"
                      href="#"
                      class="link-badge"
                      :title="`Go to ${link.target_book_name} ${link.target_chapter_number}:${link.target_verse_index}`"
                      @click.prevent="(e) => { console.log('Link clicked:', link); navigateToVerse(link.target_book_id, link.target_chapter_id, link.target_verse_id); }"
                    >
                      {{ link.target_book_name }} {{ link.target_chapter_number }}:{{ link.target_verse_index }}
                    </a>
                  </div>
                  
                  <div v-if="verse.notes && verse.notes.length > 0" class="verse-notes">
                    <div v-for="note in verse.notes" :key="note.note_id" class="note-item">
                      <div v-if="note.note_title" class="note-title">{{ note.note_title }}</div>
                      <div class="note-content" v-html="note.note_content"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getChaptersByBookId } from '@/api/chapters';
import { getBookById } from '@/api/books';
import { getVersesByChapterId, type VerseWithLinks } from '@/api/verses';
import type { Chapter } from '@/utils/collectionReferences';
import '@/assets/fonts/fonts.css';

const route = useRoute();
const router = useRouter();
const chapters = ref<Chapter[]>([]);
const selectedChapter = ref<Chapter | null>(null);
const verses = ref<VerseWithLinks[]>([]);
const loadingVerses = ref(false);
const bookName = ref<string>('');
const loading = ref(true);
const error = ref<string | null>(null);

async function navigateToVerse(bookId: number, chapterId: number, verseId: number) {
  console.log('navigateToVerse called:', { bookId, chapterId, verseId });
  console.log('Current route.params.id:', route.params.id, 'Type:', typeof route.params.id);
  console.log('Comparison:', Number(route.params.id), '===', bookId, '=', Number(route.params.id) === bookId);
  
  // If same book, just select the chapter and scroll
  if (Number(route.params.id) === bookId) {
    console.log('Same book - finding chapter', chapterId);
    const chapter = chapters.value.find(ch => ch.chapter_id === chapterId);
    console.log('Found chapter:', chapter);
    if (chapter) {
      console.log('Selecting chapter and scrolling to verse', verseId);
      await selectChapter(chapter);
      await nextTick();
      scrollToVerse(verseId);
    } else {
      console.error('Chapter not found:', chapterId);
    }
  }
  // Otherwise navigate to the other book's chapter page with query params
  else {
    console.log('Different book - navigating to', bookId, 'with query params');
    router.push({
      path: `/chapters/${bookId}`,
      query: { chapterId: String(chapterId), verseId: String(verseId) }
    });
  }
}

function scrollToVerse(verseId: number) {
  console.log('scrollToVerse called for verseId:', verseId);
  setTimeout(() => {
    const verseElement = document.querySelector(`[data-verse-id="${verseId}"]`);
    console.log('Found verse element:', verseElement);
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the verse briefly
      verseElement.classList.add('highlight-verse');
      setTimeout(() => verseElement.classList.remove('highlight-verse'), 2000);
    } else {
      console.error('Verse element not found for verseId:', verseId);
    }
  }, 300);
}

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
    const chaptersData = await getChaptersByBookId(bookId);
    
    // Sort chapters by chapter_number
    chapters.value = chaptersData.sort((a, b) => {
      const numA = parseInt(String(a.chapter_number)) || 0;
      const numB = parseInt(String(b.chapter_number)) || 0;
      return numA - numB;
    });
    
    // Check if we have a target chapter and verse from query params
    const targetChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
    const targetVerseId = route.query.verseId ? Number(route.query.verseId) : null;
    
    if (targetChapterId && targetVerseId) {
      // Find and select the target chapter
      const targetChapter = chapters.value.find(ch => ch.chapter_id === targetChapterId);
      if (targetChapter) {
        await selectChapter(targetChapter);
        await nextTick();
        scrollToVerse(targetVerseId);
      }
    } else if (chapters.value.length > 0) {
      // Auto-select first chapter if no target specified
      await selectChapter(chapters.value[0]);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load chapters';
  } finally {
    loading.value = false;
  }
});

// Watch for route changes (when navigating from verse links)
watch(() => route.params.id, async (newBookId, oldBookId) => {
  if (newBookId && newBookId !== oldBookId) {
    console.log('Book changed from', oldBookId, 'to', newBookId);
    loading.value = true;
    try {
      const bookId = Number(newBookId);
      const book = await getBookById(bookId);
      if (book) {
        bookName.value = book.book_name;
        const chaptersData = await getChaptersByBookId(bookId);
        chapters.value = chaptersData.sort((a, b) => {
          const numA = parseInt(String(a.chapter_number)) || 0;
          const numB = parseInt(String(b.chapter_number)) || 0;
          return numA - numB;
        });
        
        // Check for target chapter/verse from query params
        const targetChapterId = route.query.chapterId ? Number(route.query.chapterId) : null;
        const targetVerseId = route.query.verseId ? Number(route.query.verseId) : null;
        
        if (targetChapterId && targetVerseId) {
          console.log('Loading target chapter:', targetChapterId, 'and verse:', targetVerseId);
          const targetChapter = chapters.value.find(ch => ch.chapter_id === targetChapterId);
          if (targetChapter) {
            await selectChapter(targetChapter);
            await nextTick();
            scrollToVerse(targetVerseId);
          }
        } else if (chapters.value.length > 0) {
          await selectChapter(chapters.value[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load new book:', e);
    } finally {
      loading.value = false;
    }
  }
});

async function selectChapter(chapter: Chapter) {
  selectedChapter.value = chapter;
  await loadVerses(chapter.chapter_id);
}

async function loadVerses(chapterId: number) {
  try {
    loadingVerses.value = true;
    verses.value = await getVersesByChapterId(chapterId);
    console.log('Loaded verses:', verses.value.length);
    console.log('First verse with links:', verses.value.find(v => v.links && v.links.length > 0));
  } catch (e) {
    console.error('Failed to load verses:', e);
    verses.value = [];
  } finally {
    loadingVerses.value = false;
  }
}

function formatVerseWithPaleoBora(verseText: string | null): string {
  if (!verseText) return '';
  // Replace Myhla or myhla with span that uses PaleoBora font
  return verseText.replace(/(Myhla|myhla)/gi, '<span class="paleobora-text">$1</span>');
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
  text-align: left;
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

.loading-verses, .no-verses {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.verses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.verse-item {
  display: flex;
  gap: 1rem;
  line-height: 1.8;
  padding: 0.5rem 0;
  transition: background-color 0.3s;
}

.verse-item.highlight-verse {
  background-color: #fff3cd;
  padding: 0.5rem;
  border-radius: 4px;
}

.verse-number {
  flex-shrink: 0;
  font-weight: 700;
  color: #42b983;
  font-size: 0.9rem;
  min-width: 30px;
}

.verse-content {
  flex: 1;
}

.verse-text {
  color: #333;
  margin-bottom: 0.25rem;
}

.verse-telugu {
  color: #666;
  font-size: 0.95rem;
}

.verse-links {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.link-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e7f3ff;
  color: #0366d6;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.link-badge:hover {
  background: #0366d6;
  color: white;
  transform: translateY(-1px);
}

.verse-notes {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
}

.note-item {
  margin-bottom: 0.5rem;
}

.note-item:last-child {
  margin-bottom: 0;
}

.note-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.note-content {
  color: #78350f;
  font-size: 0.85rem;
  line-height: 1.5;
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
  
  .verse-item {
    gap: 0.5rem;
    padding: 0.5rem 0;
    font-size: 0.95rem;
  }
  
  .verse-number {
    min-width: 25px;
    font-size: 0.85rem;
  }
  
  .verse-telugu {
    font-size: 0.9rem;
  }
  
  .select-prompt {
    padding: 2rem 0.75rem;
    font-size: 1rem;
  }
}
</style>
