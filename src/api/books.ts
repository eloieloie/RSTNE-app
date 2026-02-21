import type { Book } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

export async function getAllBooks(): Promise<Book[]> {
  // Check cache first
  const cacheKey = 'rstne_books_cache';
  const cacheTimeKey = 'rstne_books_cache_time';
  const cached = sessionStorage.getItem(cacheKey);
  const cacheTime = sessionStorage.getItem(cacheTimeKey);
  
  // Cache for 1 hour
  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < 3600000) { // 1 hour in ms
      return JSON.parse(cached);
    }
  }
  
  const response = await fetch(`${API_URL}/books`);
  if (!response.ok) throw new Error('Failed to fetch books');
  const data = await response.json();
  
  // Cache the results
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  sessionStorage.setItem(cacheTimeKey, Date.now().toString());
  
  return data;
}

export async function getBookById(bookId: number): Promise<Book | null> {
  const response = await fetch(`${API_URL}/books/${bookId}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data;
}

export async function createBook(book: { book_name: string; hebrew_book_name?: string; telugu_book_name?: string; book_description?: string; book_index?: number }): Promise<void> {
  const response = await fetch(`${API_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  if (!response.ok) throw new Error('Failed to create book');
}

export async function updateBook(bookId: number, book: { book_name?: string; book_abbr?: string; hebrew_book_name?: string; telugu_book_name?: string; book_description?: string; book_header?: string; book_footer?: string; book_index?: number; category_id?: number }): Promise<void> {
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete book');
}
