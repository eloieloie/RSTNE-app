import type { Book } from '@/utils/collectionReferences';
import { API_URL, API_HEADERS } from './client';

export async function getAllBooks(): Promise<Book[]> {
  const cacheKey = 'rstne_books_cache_v2';
  const cacheTimeKey = 'rstne_books_cache_time_v2';
  const cached = sessionStorage.getItem(cacheKey);
  const cacheTime = sessionStorage.getItem(cacheTimeKey);

  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < 3600000) {
      return JSON.parse(cached);
    }
  }

  const response = await fetch(`${API_URL}/books`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch books');
  const data = await response.json();

  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  sessionStorage.setItem(cacheTimeKey, Date.now().toString());

  return data;
}

export async function getBookById(bookId: number): Promise<Book | null> {
  const response = await fetch(`${API_URL}/books/${bookId}`, { headers: API_HEADERS });
  if (!response.ok) return null;
  const data = await response.json();
  return data;
}

export async function createBook(book: { book_name: string; hebrew_book_name?: string; telugu_book_name?: string; book_description?: string; book_index?: number }): Promise<void> {
  const response = await fetch(`${API_URL}/books`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  if (!response.ok) throw new Error('Failed to create book');
}

export async function updateBook(bookId: number, book: { book_name?: string; book_abbr?: string; hebrew_book_abbr?: string; telugu_book_abbr?: string; hebrew_book_name?: string; telugu_book_name?: string; book_description?: string; book_header?: string; book_footer?: string; book_link?: string; book_index?: number; category_id?: number }): Promise<void> {
  sessionStorage.removeItem('rstne_books_cache_v2');
  sessionStorage.removeItem('rstne_books_cache_time_v2');

  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'PUT' },
    body: JSON.stringify(book)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update failed:', errorText);
    throw new Error('Failed to update book');
  }
}

export async function deleteBook(bookId: number): Promise<void> {
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
    body: '{}',
  });
  if (!response.ok) throw new Error('Failed to delete book');
}
