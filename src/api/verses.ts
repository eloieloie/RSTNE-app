import type { Verse, VerseInsert, VerseUpdate } from '@/utils/collectionReferences';
import { API_URL, API_HEADERS, getAuthHeaders } from './client';
import { auth } from '@/firebase';

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

export interface PersonalVerseNoteData {
  personal_verse_note_id: number;
  verse_id: number;
  personal_note_id: number;
  firebase_uid: string;
  note_title: string | null;
  note_content: string;
  dt_modified: Date;
}

export interface VerseWithLinks extends Verse {
  links?: VerseLinkData[];
  notes?: VerseNoteData[];
  my_notes?: PersonalVerseNoteData[];
  history_count?: number;
}

export async function getVersesByChapterId(chapterId: number): Promise<VerseWithLinks[]> {
  const response = await fetch(`${API_URL}/chapters/${chapterId}/verses`, { headers: await getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch verses');
  }
  const data = await response.json();
  return data;
}

export async function getVerseById(verseId: number): Promise<Verse> {
  const response = await fetch(`${API_URL}/verses/${verseId}`, { headers: API_HEADERS });
  if (!response.ok) {
    throw new Error('Failed to fetch verse');
  }
  return response.json();
}

export async function createVerse(verse: VerseInsert): Promise<Verse> {
  const response = await fetch(`${API_URL}/verses`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(verse),
  });
  if (!response.ok) {
    throw new Error('Failed to create verse');
  }
  return response.json();
}

export async function updateVerse(verseId: number, verse: VerseUpdate): Promise<Verse> {
  const response = await fetch(`${API_URL}/verses/${verseId}`, {
    method: 'POST',
    headers: {
      ...(await getAuthHeaders()),
      'Content-Type': 'application/json',
      'X-HTTP-Method-Override': 'PUT',
      'X-Changed-By': auth.currentUser?.email || '',
    },
    body: JSON.stringify(verse),
  });
  if (!response.ok) {
    throw new Error('Failed to update verse');
  }
  return response.json();
}

export async function deleteVerse(verseId: number): Promise<void> {
  const response = await fetch(`${API_URL}/verses/${verseId}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
    body: '{}',
  });
  if (!response.ok) {
    throw new Error('Failed to delete verse');
  }
}

export interface VerseHistoryEntry {
  history_id: number;
  verse_id: number;
  chapter_id: number;
  verse_index: number | null;
  verse: string;
  telugu_verse: string | null;
  citation_required: number;
  changed_at: string;
  changed_by: string | null;
  change_type: 'UPDATE' | 'DELETE';
}

export async function getVerseHistory(verseId: number): Promise<VerseHistoryEntry[]> {
  const response = await fetch(`${API_URL}/verses/${verseId}/history`, { headers: await getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch verse history');
  }
  return response.json();
}

export async function rollbackVerse(verseId: number, historyId: number): Promise<void> {
  const response = await fetch(`${API_URL}/verses/${verseId}/rollback`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ history_id: historyId }),
  });
  if (!response.ok) {
    throw new Error('Failed to roll back verse');
  }
}

export interface VerseSearchResult extends VerseWithLinks {
  book_name: string;
  book_id: number;
  chapter_id: number;
  chapter_number: string;
}

export async function searchVersesByText(searchText: string): Promise<VerseSearchResult[]> {
  const response = await fetch(`${API_URL}/verses/search?q=${encodeURIComponent(searchText)}`, { headers: API_HEADERS });
  if (!response.ok) {
    throw new Error('Failed to search verses');
  }
  const data = await response.json();
  return data;
}

export interface VerseTextMatch {
  verse_id: number;
  book_name: string;
  chapter_number: string;
  verse_index: number;
  content: string;
  field: 'verse' | 'telugu_verse';
}

export async function searchVerseText(options: {
  searchWord: string;
  searchInEnglish?: boolean;
  searchInTelugu?: boolean;
  caseSensitive?: boolean;
}): Promise<VerseTextMatch[]> {
  const params = new URLSearchParams({
    searchWord: options.searchWord,
    searchInEnglish: String(options.searchInEnglish ?? true),
    searchInTelugu: String(options.searchInTelugu ?? true),
    caseSensitive: String(options.caseSensitive ?? false),
  });
  const response = await fetch(`${API_URL}/verses/search-text?${params}`, { headers: API_HEADERS });
  if (!response.ok) {
    throw new Error('Failed to search verse text');
  }
  return response.json();
}

export async function replaceVerseText(options: {
  searchWord: string;
  replaceWord: string;
  verseIds: { verse_id: number; field: 'verse' | 'telugu_verse' }[];
  caseSensitive?: boolean;
}): Promise<{ success: boolean; replacedCount: number }> {
  const response = await fetch(`${API_URL}/verses/replace-text`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchWord: options.searchWord,
      replaceWord: options.replaceWord,
      verseIds: options.verseIds,
      caseSensitive: options.caseSensitive ?? false,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to replace verse text');
  }
  return response.json();
}
