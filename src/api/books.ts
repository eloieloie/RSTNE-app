import type { Book } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

export async function getAllBooks(): Promise<Book[]> {
  const startTime = performance.now();
  
  // Check cache first
  const cacheKey = 'rstne_books_cache';
  const cacheTimeKey = 'rstne_books_cache_time';
  const cached = sessionStorage.getItem(cacheKey);
  const cacheTime = sessionStorage.getItem(cacheTimeKey);
  
  // Cache for 1 hour
  if (cached && cacheTime) {
    const age = Date.now() - parseInt(cacheTime);
    if (age < 3600000) { // 1 hour in ms
      console.log(`[${new Date().toISOString()}] 💾 Using cached books (${(age / 1000).toFixed(0)}s old)`);
      return JSON.parse(cached);
    }
  }
  
  console.log(`[${new Date().toISOString()}] 🌐 API: GET /books`);
  const response = await fetch(`${API_URL}/books`);
  console.log(`[${new Date().toISOString()}] 📡 API Response received in ${(performance.now() - startTime).toFixed(2)}ms, status: ${response.status}`);
  if (!response.ok) throw new Error('Failed to fetch books');
  const data = await response.json();
  console.log(`[${new Date().toISOString()}] 📦 JSON parsed in ${(performance.now() - startTime).toFixed(2)}ms, ${data.length} books`);
  
  // Cache the results
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  sessionStorage.setItem(cacheTimeKey, Date.now().toString());
  
  return data;
}

export async function getBookById(bookId: number): Promise<Book | null> {
  const startTime = performance.now();
  console.log(`[${new Date().toISOString()}] 🌐 API: GET /books/${bookId}`);
  const response = await fetch(`${API_URL}/books/${bookId}`);
  console.log(`[${new Date().toISOString()}] 📡 API Response received in ${(performance.now() - startTime).toFixed(2)}ms, status: ${response.status}`);
  if (!response.ok) return null;
  const data = await response.json();
  console.log(`[${new Date().toISOString()}] 📦 Book data parsed in ${(performance.now() - startTime).toFixed(2)}ms`);
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
  console.log('=== API updateBook ===');
  console.log('Book ID:', bookId);
  console.log('Update payload:', JSON.stringify(book, null, 2));
  
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update failed:', errorText);
    throw new Error('Failed to update book');
  }
  
  console.log('✅ API update successful');
}

export async function deleteBook(bookId: number): Promise<void> {
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete book');
}
