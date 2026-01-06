import type { Verse, VerseInsert, VerseUpdate } from '@/utils/collectionReferences';

const API_BASE_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

// Types for data returned in verses endpoint
export interface VerseLinkData {
  link_id: number;
  source_verse_id: number;
  target_verse_id: number;
  target_verse_index: number;
  target_chapter_number: string;
  target_book_name: string;
  target_book_id: number;
  target_chapter_id: number;
}

export interface VerseNoteData {
  verse_note_id: number;
  verse_id: number;
  note_id: number;
  note_title: string | null;
  note_content: string;
  dt_modified: Date;
}

export interface VerseWithLinks extends Verse {
  links?: VerseLinkData[];
  notes?: VerseNoteData[];
}

export async function getVersesByChapterId(chapterId: number): Promise<VerseWithLinks[]> {
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

export interface VerseSearchResult extends VerseWithLinks {
  book_name: string;
  book_id: number;
  chapter_id: number;
  chapter_number: string;
}

export async function searchVersesByText(searchText: string): Promise<VerseSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/verses/search?q=${encodeURIComponent(searchText)}`);
  if (!response.ok) {
    throw new Error('Failed to search verses');
  }
  return response.json();
}
