import type { Book } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

export async function getAllBooks(): Promise<Book[]> {
  const response = await fetch(`${API_URL}/books`);
  if (!response.ok) throw new Error('Failed to fetch books');
  return await response.json();
}

export async function getBookById(bookId: number): Promise<Book | null> {
  const response = await fetch(`${API_URL}/books/${bookId}`);
  if (!response.ok) return null;
  return await response.json();
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
