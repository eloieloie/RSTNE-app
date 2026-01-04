import type { Note, NoteInsert, NoteUpdate, VerseNote, VerseNoteInsert } from '@/utils/collectionReferences';

const API_BASE_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

// Extended Note type with verse_note_id for deletion
export interface NoteWithVerseNoteId extends Note {
  verse_note_id: number;
}

// Notes API
export async function getAllNotes(): Promise<Note[]> {
  const response = await fetch(`${API_BASE_URL}/notes`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
}

export async function getNoteById(noteId: number): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
}

export async function createNote(note: NoteInsert): Promise<{ note_id: number }> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });
  if (!response.ok) {
    throw new Error('Failed to create note');
  }
  return response.json();
}

export async function updateNote(noteId: number, note: NoteUpdate): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });
  if (!response.ok) {
    throw new Error('Failed to update note');
  }
}

export async function deleteNote(noteId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
}

// Verse Notes API (linking notes to verses)
export async function getNotesByVerseId(verseId: number): Promise<NoteWithVerseNoteId[]> {
  const response = await fetch(`${API_BASE_URL}/verses/${verseId}/notes`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes for verse');
  }
  return response.json();
}

export async function linkNoteToVerse(verseNoteData: VerseNoteInsert): Promise<{ verse_note_id: number }> {
  const response = await fetch(`${API_BASE_URL}/verse-notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verseNoteData),
  });
  if (!response.ok) {
    throw new Error('Failed to link note to verse');
  }
  return response.json();
}

export async function unlinkNoteFromVerse(verseNoteId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/verse-notes/${verseNoteId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to unlink note from verse');
  }
}

export async function getVersesByNoteId(noteId: number): Promise<number[]> {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}/verses`);
  if (!response.ok) {
    throw new Error('Failed to fetch verses for note');
  }
  return response.json();
}
