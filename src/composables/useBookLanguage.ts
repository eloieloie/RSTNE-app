import { ref, watch } from 'vue';

export type BookNameLanguage = 'english' | 'hebrew' | 'telugu';

const STORAGE_KEY = 'rstne-book-name-language';

// Module-level singleton ref — shared across all components that import this composable
const bookNameLanguage = ref<BookNameLanguage>(
  (localStorage.getItem(STORAGE_KEY) as BookNameLanguage) || 'english'
);

watch(bookNameLanguage, (val) => {
  localStorage.setItem(STORAGE_KEY, val);
});

export function useBookLanguage() {
  function getBookName(book: {
    book_name: string;
    hebrew_book_name?: string | null;
    telugu_book_name?: string | null;
  }): string {
    if (bookNameLanguage.value === 'hebrew') return book.hebrew_book_name || book.book_name;
    if (bookNameLanguage.value === 'telugu') return book.telugu_book_name || book.book_name;
    return book.book_name;
  }

  function getBookAbbr(book: {
    book_abbr?: string | null;
    hebrew_book_abbr?: string | null;
    telugu_book_abbr?: string | null;
    book_name: string;
  }): string {
    if (bookNameLanguage.value === 'hebrew') return book.hebrew_book_abbr || book.book_abbr || book.book_name;
    if (bookNameLanguage.value === 'telugu') return book.telugu_book_abbr || book.book_abbr || book.book_name;
    return book.book_abbr || book.book_name;
  }

  return { bookNameLanguage, getBookName, getBookAbbr };
}
