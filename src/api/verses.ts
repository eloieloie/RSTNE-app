import type { Verse, VerseInsert, VerseUpdate } from '@/utils/collectionReferences';

const API_BASE_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

export async function getVersesByChapterId(chapterId: number): Promise<Verse[]> {
  const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/verses`);
  if (!response.ok) {
    throw new Error('Failed to fetch verses');
  }
  return response.json();
}

export async function getVerseById(verseId: number): Promise<Verse> {
  const response = await fetch(`${API_BASE_URL}/verses/${verseId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch verse');
  }
  return response.json();
}

export async function createVerse(verse: VerseInsert): Promise<Verse> {
  const response = await fetch(`${API_BASE_URL}/verses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verse),
  });
  if (!response.ok) {
    throw new Error('Failed to create verse');
  }
  return response.json();
}

export async function updateVerse(verseId: number, verse: VerseUpdate): Promise<Verse> {
  const response = await fetch(`${API_BASE_URL}/verses/${verseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verse),
  });
  if (!response.ok) {
    throw new Error('Failed to update verse');
  }
  return response.json();
}

export async function deleteVerse(verseId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/verses/${verseId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete verse');
  }
}
