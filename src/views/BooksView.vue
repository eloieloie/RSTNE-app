<template>
  <div
    class="books-page"
    :class="{ 'broadcast-mode': isBroadcastMode }"
    :style="{ '--books-font-scale': String(fontScale) }"
  >
    <div class="page-header">
      <div class="lang-selector">
        <motion.button
          v-for="opt in langOptions"
          :key="opt.value"
          :class="['lang-btn', { active: bookNameLanguage === opt.value }]"
          :while-tap="tapScale"
          @click="bookNameLanguage = opt.value"
        >{{ opt.label }}</motion.button>
        <span class="lang-separator"></span>
        <motion.button class="settings-btn" :while-tap="tapScale" @click="showSettingsModal = true" title="Settings" aria-label="Open settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </motion.button>
        <motion.button
          class="account-header-btn"
          :title="user ? user.email || 'Account' : 'Sign In'"
          :aria-label="user ? 'Account' : 'Sign In'"
          :while-tap="tapScale"
          @click="user ? (showSettingsModal = true) : router.push({ name: 'login' })"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span v-if="isAdmin" class="account-admin-dot" aria-hidden="true"></span>
        </motion.button>
      </div>

      <h1>Restoration Scriptures True Name Edition</h1>
      <p class="subtitle">Choose a book to start reading - HalleluYAHUA!</p>

      <div class="header-btns">
        <motion.button class="weekly-reading-btn" :while-hover="hoverLift" :while-tap="tapScale" @click="router.push({ name: 'weekly-reading' })">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          52-Week &amp; 12-Month Reading Plan
        </motion.button>
        <motion.button class="timeline-btn" :while-hover="hoverLift" :while-tap="tapScale" @click="router.push({ name: 'timeline' })">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <circle cx="7" cy="12" r="2"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="17" cy="12" r="2"></circle>
            <line x1="7" y1="8" x2="7" y2="10"></line>
            <line x1="12" y1="6" x2="12" y2="10"></line>
            <line x1="17" y1="8" x2="17" y2="10"></line>
          </svg>
          Biblical Timeline
        </motion.button>
        <motion.button class="feasts-btn" :while-hover="hoverLift" :while-tap="tapScale" @click="router.push({ name: 'feasts' })">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Annual Feasts
        </motion.button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">Loading books...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="books.length === 0" class="empty">
      No books found. Add some books to get started!
    </div>
    
    <div v-else class="books-container">
      <!-- First Covenant -->
      <div v-if="firstCovenantBooks.length > 0" class="category-section">
        <h2 class="category-title first-covenant">First Covenant</h2>
        <div class="books-grid">
          <motion.button
            v-for="(book, index) in firstCovenantBooks"
            :key="book.book_id"
            :initial="prefersReducedMotion ? false : { opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="staggerTransition(index)"
            :while-hover="hoverLift"
            :while-tap="tapScale"
            @click="openBook(book.book_id)"
            class="book-button first-covenant-book"
          >
            <div class="book-name">{{ getBookName(book) }}</div>
            <div class="book-chapters">{{ book.chapter_count || 0 }} ch.</div>
          </motion.button>
        </div>
      </div>

      <!-- New Covenant -->
      <div v-if="newCovenantBooks.length > 0" class="category-section">
        <h2 class="category-title new-covenant">New Covenant</h2>
        <div class="books-grid">
          <motion.button
            v-for="(book, index) in newCovenantBooks"
            :key="book.book_id"
            :initial="prefersReducedMotion ? false : { opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="staggerTransition(index)"
            :while-hover="hoverLift"
            :while-tap="tapScale"
            @click="openBook(book.book_id)"
            class="book-button new-covenant-book"
          >
            <div class="book-name">{{ getBookName(book) }}</div>
            <div class="book-chapters">{{ book.chapter_count || 0 }} ch.</div>
          </motion.button>
        </div>
      </div>

      <!-- Restored Apocryphal Books -->
      <div v-if="apocryphalBooks.length > 0" class="category-section">
        <h2 class="category-title apocryphal">Restored Apocryphal Books</h2>
        <div class="books-grid">
          <motion.button
            v-for="(book, index) in apocryphalBooks"
            :key="book.book_id"
            :initial="prefersReducedMotion ? false : { opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="staggerTransition(index)"
            :while-hover="hoverLift"
            :while-tap="tapScale"
            @click="openBook(book.book_id)"
            class="book-button apocryphal-book"
          >
            <div class="book-name">{{ getBookName(book) }}</div>
            <div class="book-chapters">{{ book.chapter_count || 0 }} ch.</div>
          </motion.button>
        </div>
      </div>
    </div>

    <footer class="page-footer">
      <router-link to="/privacy-policy">Privacy Policy</router-link>
      <span class="footer-divider">·</span>
      <router-link to="/terms-and-conditions">Terms &amp; Conditions</router-link>
      <span class="footer-divider">·</span>
      <a
        href="https://play.google.com/store/apps/details?id=com.rstne.app&hl=en"
        target="_blank"
        rel="noopener noreferrer"
        class="play-store-link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3.18 23.76c.3.17.65.19.97.07l12.67-7.31-2.79-2.79-10.85 10zm16.55-9.54L16.8 12.5l2.93-1.72-2.93-1.72L3.18.26C2.86.14 2.51.16 2.21.33L13.05 11.17l6.68 3.05zM2.21.33C1.84.56 1.6.97 1.6 1.44v21.12c0 .47.24.88.61 1.11L13.05 12.83 2.21.33zM17.22 9.27l2.51 1.51-2.93 1.72 2.93 1.72-2.51 1.51L14.44 12.5l2.78-3.23z"/>
        </svg>
        Get Android App
      </a>
    </footer>

    <div v-if="isBroadcastMode" class="broadcast-fixed-panel" aria-hidden="true"></div>

    <Settings :is-open="showSettingsModal" @close="showSettingsModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { motion } from 'motion-v';
import { getAllBooks } from '@/api/books';
import type { Book } from '@/utils/collectionReferences';
import { useBookLanguage, type BookNameLanguage } from '@/composables/useBookLanguage';
import Settings from '@/components/Settings.vue';
import { useReaderSettings } from '@/composables/useReaderSettings';
import { useAuth } from '@/composables/useAuth';
import { useMotionPresets } from '@/composables/useMotionPresets';

const router = useRouter();
const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const showSettingsModal = ref(false);

const { bookNameLanguage, getBookName } = useBookLanguage();
const readerSettings = useReaderSettings();
const { user, isAdmin } = useAuth();
const { prefersReducedMotion, tapScale, hoverLift, staggerTransition } = useMotionPresets();
const isBroadcastMode = computed(() => Boolean(readerSettings?.settings?.broadcastMode));
const fontScale = computed(() => (readerSettings?.settings?.fontSize ?? 16) / 16);

const langOptions: { value: BookNameLanguage; label: string }[] = [
  { value: 'english', label: 'EN' },
  { value: 'hebrew', label: 'HE' },
  { value: 'telugu', label: 'TE' },
];

function openBook(bookId: number) {
  router.push({ name: 'reading-pane', state: { bookId } });
}

const sortedBooks = computed(() => {
  return [...books.value].sort((a, b) => {
    const indexA = a.book_index ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.book_index ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });
});

const firstCovenantBooks = computed(() => {
  return sortedBooks.value.filter(book => book.category_id === 1);
});

const newCovenantBooks = computed(() => {
  return sortedBooks.value.filter(book => book.category_id === 2);
});

const apocryphalBooks = computed(() => {
  return sortedBooks.value.filter(book => book.category_id === 3);
});

onMounted(async () => {
  try {
    books.value = await getAllBooks();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load books';
  } finally {
    loading.value = false;
  }
});

</script>

<style scoped>
.books-page {
  --books-font-scale: 1;
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
}

.books-page.broadcast-mode {
  padding-right: max(30vw, 320px);
}

.broadcast-fixed-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: max(30vw, 320px);
  height: 100vh;
  border-left: 1px solid #e8e8e8;
  background: linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%);
  pointer-events: none;
  z-index: 1;
}

.books-page.broadcast-mode .page-header,
.books-page.broadcast-mode .books-container,
.books-page.broadcast-mode .page-footer {
  max-width: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
  gap: 0.5rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}

.lang-selector {
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.lang-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1.5px solid #ccc;
  background: #f5f5f5;
  font-size: calc(0.78rem * var(--books-font-scale));
  font-weight: 600;
  cursor: pointer;
  color: #555;
  transition: all 0.15s ease;
}

.lang-separator {
  width: 1px;
  height: 20px;
  background: #ccc;
  align-self: center;
  margin: 0 0.1rem;
  flex-shrink: 0;
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 0 0.45rem;
  height: 30px;
  border-radius: 6px;
  border: 1.5px solid #c9c9c9;
  background: #ffffff;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.15s ease;
}

.settings-btn:hover {
  border-color: #9fa7b0;
  background: #f6f8fa;
  color: #1f2d3a;
}

.account-header-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 0 0.45rem;
  height: 30px;
  border-radius: 6px;
  border: 1.5px solid #c9c9c9;
  background: #ffffff;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.15s ease;
}

.account-header-btn:hover {
  border-color: #9fa7b0;
  background: #f6f8fa;
  color: #1f2d3a;
}

.account-admin-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8B4513;
  border: 1.5px solid #fff;
}

.lang-btn:hover {
  border-color: #888;
  color: #222;
}

.lang-btn.active {
  background: #2c3e50;
  border-color: #2c3e50;
  color: #fff;
}

.page-header h1 {
  color: var(--color-foreground);
  margin: 0;
  font-size: calc(clamp(1.5rem, 4vw, 2.5rem) * var(--books-font-scale));
}

.subtitle {
  color: var(--color-muted-foreground);
  font-size: calc(clamp(1rem, 2.5vw, 1.2rem) * var(--books-font-scale));
  margin: 0;
  font-weight: 500;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem 1rem;
  font-size: calc(1.1rem * var(--books-font-scale));
}

.error {
  color: #e74c3c;
}

.books-container {
  max-width: 1400px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 3rem;
}

.category-title {
  text-align: center;
  font-size: calc(1.8rem * var(--books-font-scale));
  font-weight: 700;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
}

.category-title.first-covenant {
  color: #8B4513;
}

.category-title.new-covenant {
  color: #1E40AF;
}

.category-title.apocryphal {
  color: #6B21A8;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
}

.book-button {
  padding: 1rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 75px;
}

.first-covenant-book {
  background: #FFF8DC;
  color: #8B4513;
  border-color: #DEB887;
}

.first-covenant-book:hover {
  background: #FFEFD5;
  border-color: #8B4513;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);
}

.new-covenant-book {
  background: #E6F2FF;
  color: #1E40AF;
  border-color: #93C5FD;
}

.new-covenant-book:hover {
  background: #DBEAFE;
  border-color: #1E40AF;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.2);
}

.apocryphal-book {
  background: #F3E8FF;
  color: #6B21A8;
  border-color: #D8B4FE;
}

.apocryphal-book:hover {
  background: #EDE9FE;
  border-color: #6B21A8;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(107, 33, 168, 0.2);
}

.book-name {
  font-size: calc(1.2rem * var(--books-font-scale));
  line-height: 1.2;
  font-weight: 700;
}

.book-chapters {
  font-size: calc(0.75rem * var(--books-font-scale));
  opacity: 0.8;
  font-weight: 500;
}

/* Tablet and smaller */
@media (max-width: 1024px) {
  .books-page.broadcast-mode {
    padding: 1rem;
  }

  .broadcast-fixed-panel {
    display: none;
  }

  .books-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .books-page {
    padding: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .category-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .category-section {
    margin-bottom: 2rem;
  }

  .books-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .book-button {
    padding: 0.75rem 0.5rem;
    min-height: 70px;
  }

  .book-name {
    font-size: calc(0.8rem * var(--books-font-scale));
  }

  .book-chapters {
    font-size: calc(0.7rem * var(--books-font-scale));
  }

  .lang-selector {
    position: static;
    justify-content: center;
    flex-wrap: wrap;
    margin: 0.35rem auto 0;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .books-page {
    padding: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .category-title {
    font-size: 1.3rem;
  }

  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0;
  }

  .book-button {
    padding: 0.75rem 0.4rem;
    min-height: 65px;
    gap: 0.2rem;
  }

  .book-name {
    font-size: calc(0.75rem * var(--books-font-scale));
  }

  .book-chapters {
    font-size: calc(0.65rem * var(--books-font-scale));
  }
}

.header-btns {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.25rem;
}

.weekly-reading-btn,
.timeline-btn,
.feasts-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.2rem;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: calc(0.88rem * var(--books-font-scale));
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.weekly-reading-btn {
  background: linear-gradient(135deg, #8B4513, #c0763a);
  box-shadow: 0 2px 8px rgba(139,69,19,0.3);
}
.weekly-reading-btn:hover {
  box-shadow: 0 4px 14px rgba(139,69,19,0.4);
  background: linear-gradient(135deg, #7a3a0f, #a8632e);
}

.timeline-btn {
  background: linear-gradient(135deg, #1a0a00, #3b1a00);
  box-shadow: 0 2px 8px rgba(26,10,0,0.35);
}
.timeline-btn:hover {
  box-shadow: 0 4px 14px rgba(26,10,0,0.45);
  background: linear-gradient(135deg, #0d0500, #2a1200);
}

.feasts-btn {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 2px 8px rgba(5,150,105,0.35);
}
.feasts-btn:hover {
  box-shadow: 0 4px 14px rgba(5,150,105,0.45);
  background: linear-gradient(135deg, #047857, #065f46);
}

.page-footer {
  text-align: center;
  padding: 2rem 0 1rem;
  font-size: calc(0.85rem * var(--books-font-scale));
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.page-footer a {
  color: #8B4513;
  text-decoration: none;
}

.page-footer a:hover {
  text-decoration: underline;
}

.footer-divider {
  margin: 0 0.5rem;
  color: #ccc;
}

.play-store-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #1a7f37 !important;
  font-weight: 600;
}

.play-store-link:hover {
  text-decoration: underline;
}
</style>
