import type { BookCategory } from '@/utils/collectionReferences';
import { API_URL, API_HEADERS } from './client';

export async function getAllBookCategories(): Promise<BookCategory[]> {
  const response = await fetch(`${API_URL}/book-categories`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch book categories');
  return await response.json();
}
