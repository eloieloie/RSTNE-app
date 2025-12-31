import type { Book } from '@/utils/collectionReferences';

const API_URL = '/api';

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

export async function createBook(book: { book_name: string; book_description?: string }): Promise<void> {
  const response = await fetch(`${API_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  if (!response.ok) throw new Error('Failed to create book');
}

export async function updateBook(bookId: number, book: { book_name?: string; book_description?: string }): Promise<void> {
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  });
  if (!response.ok) throw new Error('Failed to update book');
}

export async function deleteBook(bookId: number): Promise<void> {
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete book');
}
