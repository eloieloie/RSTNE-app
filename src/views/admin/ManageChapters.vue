<template>
  <div class="manage-chapters">
    <header class="page-header">
      <div>
        <h1>Manage Chapters</h1>
        <p class="page-subtitle">Select a book to browse and edit its chapters</p>
      </div>
      <div class="header-actions">
        <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
      </div>
    </header>

    <div class="chapters-container">
      <div v-if="loading" class="loading-state">
        <div class="skeleton-tabs">
          <div class="skeleton skeleton-tab" v-for="i in 3" :key="i"></div>
        </div>
        <div class="skeleton skeleton-search"></div>
        <div v-for="i in 6" :key="i" class="skeleton skeleton-row"></div>
      </div>
      <div v-else-if="error" class="error">⚠ {{ error }}</div>
      <div v-else-if="Object.keys(groupedChapters).length === 0" class="empty">No chapters found</div>

      <div v-else>
        <!-- Sticky Category Tabs -->
        <div class="category-tabs-wrapper">
          <div class="category-tabs">
            <button
              v-for="tab in categoryTabs"
              :key="tab.key"
              class="category-tab"
              :class="{ active: activeCategory === tab.key }"
              @click="setActiveCategory(tab.key)"
            >
              <span class="tab-label">{{ tab.label }}</span>
              <span class="tab-badge">{{ categoryCounts[tab.key]?.books ?? 0 }}</span>
            </button>
          </div>
        </div>

        <!-- Search + Stats Bar -->
        <div class="search-stats-bar">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search books…"
              @input="onSearch"
            />
            <button v-if="searchQuery" class="clear-search" @click="clearSearch" title="Clear">✕</button>
          </div>
          <div class="stats-row">
            <span class="stat-chip">
              📚 {{ visibleBooks.length }} {{ visibleBooks.length === 1 ? 'book' : 'books' }}
            </span>
            <span class="stat-chip">
              📖 {{ visibleChapterCount }} chapters
            </span>
          </div>
        </div>

        <!-- Books List -->
        <div class="books-list">
          <div v-if="visibleBooks.length === 0" class="no-results">
            No books match "<strong>{{ searchQuery }}</strong>"
          </div>

          <div
            v-for="book in visibleBooks"
            :key="book.book_id"
            class="book-section"
            :ref="el => { if (el) bookRefs[book.book_id] = el as HTMLElement }"
          >
            <div
              class="book-title"
              :class="{ expanded: expandedBookId === book.book_id }"
              @click="toggleBook(book.book_id)"
            >
              <span class="book-index">{{ book.book_index }}</span>
              <div class="book-names">
                <span class="book-hebrew">{{ book.hebrew_book_name || book.book_name }}</span>
                <span class="book-separator">·</span>
                <span class="book-english">{{ book.book_name }}</span>
              </div>
              <span class="chapter-count-badge">
                {{ groupedChapters[book.book_id]?.length ?? 0 }}
                {{ (groupedChapters[book.book_id]?.length ?? 0) === 1 ? 'ch' : 'chs' }}
              </span>
              <span class="expand-icon">{{ expandedBookId === book.book_id ? '▾' : '▸' }}</span>
            </div>

            <AnimatePresence>
              <motion.div
                v-if="expandedBookId === book.book_id"
                class="chapters-grid"
                :initial="prefersReducedMotion ? false : { opacity: 0, y: -8 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0, y: -8 }"
                :transition="{ duration: prefersReducedMotion ? 0 : 0.2 }"
              >
                <router-link
                  v-for="chapter in groupedChapters[book.book_id]"
                  :key="chapter.chapter_id"
                  :to="`/admin/chapters/${chapter.chapter_id}`"
                  class="chapter-link"
                >
                  <span class="chapter-number">{{ chapter.chapter_number }}</span>
                </router-link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import { useMotionPresets } from '@/composables/useMotionPresets';

const { prefersReducedMotion } = useMotionPresets();
import { getAllBooks } from '@/api/books';
import { getAllChapters } from '@/api/chapters';
import type { Book, Chapter } from '@/utils/collectionReferences';

const books = ref<Book[]>([]);
const chapters = ref<Chapter[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const expandedBookId = ref<number | null>(null);
const activeCategory = ref<'first_covenant' | 'new_covenant' | 'apocrypha'>('first_covenant');
const searchQuery = ref('');
const bookRefs = ref<Record<number, HTMLElement>>({});

const categoryTabs = [
  { key: 'first_covenant' as const, label: 'First Covenant' },
  { key: 'new_covenant' as const, label: 'New Covenant' },
  { key: 'apocrypha' as const, label: 'Apocryphal Books' },
];

function toggleBook(bookId: number) {
  if (expandedBookId.value === bookId) {
    expandedBookId.value = null;
  } else {
    expandedBookId.value = bookId;
    nextTick(() => {
      const el = bookRefs.value[bookId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

function setActiveCategory(category: 'first_covenant' | 'new_covenant' | 'apocrypha') {
  activeCategory.value = category;
  expandedBookId.value = null;
  searchQuery.value = '';
}

function onSearch() {
  // Auto-expand when exactly one book matches
  if (visibleBooks.value.length === 1) {
    expandedBookId.value = visibleBooks.value[0].book_id;
  } else {
    expandedBookId.value = null;
  }
}

function clearSearch() {
  searchQuery.value = '';
  expandedBookId.value = null;
}

const sortedBooks = computed(() =>
  [...books.value].sort((a, b) => (a.book_index ?? 9999) - (b.book_index ?? 9999))
);

const categoryIdMap: Record<string, number> = {
  first_covenant: 1,
  new_covenant: 2,
  apocrypha: 3,
};

const filteredByCategory = computed(() =>
  sortedBooks.value.filter(b => b.category_id === categoryIdMap[activeCategory.value])
);

const visibleBooks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return filteredByCategory.value;
  return filteredByCategory.value.filter(b =>
    b.book_name.toLowerCase().includes(q) ||
    (b.hebrew_book_name ?? '').toLowerCase().includes(q) ||
    (b.telugu_book_name ?? '').toLowerCase().includes(q)
  );
});

const visibleChapterCount = computed(() =>
  visibleBooks.value.reduce((sum, b) => sum + (groupedChapters.value[b.book_id]?.length ?? 0), 0)
);

const groupedChapters = computed(() => {
  const grouped: Record<number, Chapter[]> = {};
  chapters.value.forEach(ch => {
    (grouped[ch.book_id] ??= []).push(ch);
  });
  Object.values(grouped).forEach(arr =>
    arr.sort((a, b) => (parseFloat(a.chapter_number) || 0) - (parseFloat(b.chapter_number) || 0))
  );
  return grouped;
});

const categoryCounts = computed(() => {
  const result: Record<string, { books: number; chapters: number }> = {};
  for (const tab of categoryTabs) {
    const catId = categoryIdMap[tab.key];
    const catBooks = sortedBooks.value.filter(b => b.category_id === catId);
    result[tab.key] = {
      books: catBooks.length,
      chapters: catBooks.reduce((sum, b) => sum + (groupedChapters.value[b.book_id]?.length ?? 0), 0),
    };
  }
  return result;
});

// When search changes to a single result, expand it
watch(visibleBooks, (books) => {
  if (books.length === 1 && searchQuery.value) {
    expandedBookId.value = books[0].book_id;
  }
});

onMounted(async () => {
  try {
    loading.value = true;
    const [booksData, chaptersData] = await Promise.all([getAllBooks(), getAllChapters()]);
    books.value = booksData;
    chapters.value = chaptersData;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load data';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.manage-chapters {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #1a1f36;
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}

.back-link:hover { text-decoration: underline; }

/* Skeleton loaders */
.loading-state { padding: 0.5rem; }

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-tabs { display: flex; gap: 1rem; margin-bottom: 1rem; }
.skeleton-tab { flex: 1; height: 52px; }
.skeleton-search { height: 44px; margin-bottom: 1rem; }
.skeleton-row { height: 56px; margin-bottom: 0.5rem; }

/* Error / empty */
.error {
  text-align: center;
  padding: 2rem;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 10px;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 10px;
  font-size: 0.95rem;
}

/* Sticky tabs */
.category-tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.category-tabs {
  display: flex;
  gap: 0.75rem;
}

.category-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #f8f9fa;
  color: #374151;
  border: 2px solid transparent;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab:hover {
  background: #e9ecef;
  border-color: #667eea33;
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.tab-label { white-space: nowrap; }

.tab-badge {
  background: rgba(0,0,0,0.12);
  color: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  min-width: 1.5rem;
  text-align: center;
}

.category-tab.active .tab-badge {
  background: rgba(255,255,255,0.25);
}

/* Search + stats */
.search-stats-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.25rem 0.6rem 2.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.clear-search {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.15rem;
  border-radius: 4px;
  transition: color 0.15s;
}

.clear-search:hover { color: #374151; }

.stats-row {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.stat-chip {
  background: #f3f4f6;
  color: #374151;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* Book rows */
.books-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.book-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
  user-select: none;
}

.book-title:hover {
  background: #eef0fb;
  border-color: #667eea44;
}

.book-title.expanded {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  border-radius: 10px 10px 0 0;
}

.book-index {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9ca3af;
  min-width: 1.5rem;
  text-align: right;
  flex-shrink: 0;
}

.book-title.expanded .book-index { color: rgba(255,255,255,0.6); }

.book-names {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex-wrap: wrap;
}

.book-hebrew {
  font-weight: 700;
  color: #667eea;
  font-size: 1rem;
}

.book-title.expanded .book-hebrew,
.book-title.expanded .book-english {
  color: white;
}

.book-separator {
  color: #d1d5db;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.book-title.expanded .book-separator { color: rgba(255,255,255,0.4); }

.book-english {
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
}

.chapter-count-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;
  white-space: nowrap;
}

.book-title.expanded .chapter-count-badge {
  background: rgba(255,255,255,0.2);
  color: white;
}

.expand-icon {
  color: #9ca3af;
  font-size: 1rem;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.book-title.expanded .expand-icon { color: white; }

/* Chapter grid */
.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f1f3fb;
  border: 2px solid #667eea44;
  border-top: none;
  border-radius: 0 0 10px 10px;
  margin-bottom: 0.25rem;
}

.chapter-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  min-height: 48px;
}

.chapter-link:hover {
  background: #667eea;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.25);
}

.chapter-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
}

.chapter-link:hover .chapter-number { color: white; }


/* Responsive */
@media (max-width: 768px) {
  .manage-chapters { padding: 1rem; }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .page-header h1 { font-size: 1.4rem; }

  .category-tabs { gap: 0.5rem; }

  .category-tab {
    padding: 0.6rem 0.5rem;
    font-size: 0.8rem;
  }

  .tab-badge { display: none; }

  .search-stats-bar { gap: 0.75rem; }

  .stats-row { width: 100%; }

  .book-title { padding: 0.65rem 0.75rem; gap: 0.5rem; }

  .book-english { display: none; }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
    gap: 0.4rem;
    padding: 0.6rem;
  }
}

@media (max-width: 480px) {
  .manage-chapters { padding: 0.5rem; }

  .page-header h1 { font-size: 1.2rem; }

  .category-tabs { flex-direction: column; gap: 0.4rem; }

  .category-tab { padding: 0.65rem 1rem; font-size: 0.875rem; }

  .tab-badge { display: inline-block; }

  .book-english { display: initial; }

  .book-names { flex-direction: column; align-items: flex-start; gap: 0.1rem; }

  .book-separator { display: none; }

  .chapters-grid {
    grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
    gap: 0.35rem;
  }
}
</style>
