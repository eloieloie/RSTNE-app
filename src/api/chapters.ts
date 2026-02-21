import type { Chapter } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

export async function getChaptersByBookId(bookId: number): Promise<Chapter[]> {
  const response = await fetch(`${API_URL}/books/${bookId}/chapters`);
  if (!response.ok) throw new Error('Failed to fetch chapters');
  const data = await response.json();
  return data;
}

export async function getAllChapters(): Promise<Chapter[]> {
  const response = await fetch(`${API_URL}/chapters`);
  if (!response.ok) throw new Error('Failed to fetch chapters');
  return await response.json();
}

export async function getChapterById(chapterId: number): Promise<Chapter | null> {
  const response = await fetch(`${API_URL}/chapters/${chapterId}`);
  if (!response.ok) return null;
  return await response.json();
}

export async function createChapter(chapter: { book_id: number; chapter_number: string; chapter_description?: string; chapter_notes?: string }): Promise<void> {
  const response = await fetch(`${API_URL}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chapter)
  });
  if (!response.ok) throw new Error('Failed to create chapter');
}

export async function updateChapter(chapterId: number, chapter: { book_id?: number; chapter_number?: string; chapter_description?: string; chapter_notes?: string }): Promise<void> {
  const response = await fetch(`${API_URL}/chapters/${chapterId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chapter)
  });
  if (!response.ok) throw new Error('Failed to update chapter');
}

export async function deleteChapter(chapterId: number): Promise<void> {
  const response = await fetch(`${API_URL}/chapters/${chapterId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete chapter');
}
