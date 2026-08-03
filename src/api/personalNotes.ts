import type { PersonalNote, PersonalNoteInsert, PersonalNoteUpdate } from '@/utils/collectionReferences';
import { API_URL, getAuthHeaders } from './client';

export interface PersonalNoteWithVerseNoteId extends PersonalNote {
  personal_verse_note_id: number;
}

export async function getAllPersonalNotes(): Promise<PersonalNote[]> {
  const response = await fetch(`${API_URL}/personal-notes`, { headers: await getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch personal notes');
  }
  return response.json();
}

export async function createPersonalNote(note: PersonalNoteInsert): Promise<{ personal_note_id: number }> {
  const response = await fetch(`${API_URL}/personal-notes`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!response.ok) {
    throw new Error('Failed to create personal note');
  }
  return response.json();
}

export async function updatePersonalNote(noteId: number, note: PersonalNoteUpdate): Promise<void> {
  const response = await fetch(`${API_URL}/personal-notes/${noteId}`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'PUT' },
    body: JSON.stringify(note),
  });
  if (!response.ok) {
    throw new Error('Failed to update personal note');
  }
}

export async function deletePersonalNote(noteId: number): Promise<void> {
  const response = await fetch(`${API_URL}/personal-notes/${noteId}`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
    body: '{}',
  });
  if (!response.ok) {
    throw new Error('Failed to delete personal note');
  }
}

export async function getPersonalNotesByVerseId(verseId: number): Promise<PersonalNoteWithVerseNoteId[]> {
  const response = await fetch(`${API_URL}/verses/${verseId}/my-notes`, { headers: await getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch personal notes for verse');
  }
  return response.json();
}

export async function linkPersonalNoteToVerse(verseId: number, noteId: number): Promise<{ personal_verse_note_id: number }> {
  const response = await fetch(`${API_URL}/personal-verse-notes`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ verse_id: verseId, note_id: noteId }),
  });
  if (!response.ok) {
    throw new Error('Failed to link personal note to verse');
  }
  return response.json();
}

export async function unlinkPersonalNoteFromVerse(personalVerseNoteId: number): Promise<void> {
  const response = await fetch(`${API_URL}/personal-verse-notes/${personalVerseNoteId}`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
    body: '{}',
  });
  if (!response.ok) {
    throw new Error('Failed to unlink personal note from verse');
  }
}
