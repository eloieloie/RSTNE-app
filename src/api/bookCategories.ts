import type { BookCategory } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

export async function getAllBookCategories(): Promise<BookCategory[]> {
  const response = await fetch(`${API_URL}/book-categories`);
  if (!response.ok) throw new Error('Failed to fetch book categories');
  return await response.json();
}
