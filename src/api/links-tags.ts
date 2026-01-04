import type { VerseLink, VerseLinkInsert, Tag, TagInsert, TagUpdate, VerseTagInsert } from '@/utils/collectionReferences';

const API_BASE_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

// Verse Links API
export async function getLinkedVerses(verseId: number): Promise<{ source: number[], target: number[] }> {
  const response = await fetch(`${API_BASE_URL}/verses/${verseId}/links`);
  if (!response.ok) {
    throw new Error('Failed to fetch linked verses');
  }
  return response.json();
}

export async function getLinkDetails(linkId: number): Promise<VerseLink> {
  const response = await fetch(`${API_BASE_URL}/verse-links/${linkId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch link details');
  }
  return response.json();
}

export async function createVerseLink(linkData: VerseLinkInsert): Promise<{ link_id: number }> {
  const response = await fetch(`${API_BASE_URL}/verse-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(linkData),
  });
  if (!response.ok) {
    throw new Error('Failed to create verse link');
  }
  return response.json();
}

export async function deleteVerseLink(linkId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/verse-links/${linkId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete verse link');
  }
}

// Tags API
export async function getAllTags(): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/tags`);
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  return response.json();
}

export async function getTagById(tagId: number): Promise<Tag> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tag');
  }
  return response.json();
}

export async function createTag(tag: TagInsert): Promise<{ tag_id: number }> {
  const response = await fetch(`${API_BASE_URL}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tag),
  });
  if (!response.ok) {
    throw new Error('Failed to create tag');
  }
  return response.json();
}

export async function updateTag(tagId: number, tag: TagUpdate): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tag),
  });
  if (!response.ok) {
    throw new Error('Failed to update tag');
  }
}

export async function deleteTag(tagId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete tag');
  }
}

// Verse Tags API
export async function getTagsByVerseId(verseId: number): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/verses/${verseId}/tags`);
  if (!response.ok) {
    throw new Error('Failed to fetch tags for verse');
  }
  return response.json();
}

export async function linkTagToVerse(verseTagData: VerseTagInsert): Promise<{ verse_tag_id: number }> {
  const response = await fetch(`${API_BASE_URL}/verse-tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verseTagData),
  });
  if (!response.ok) {
    throw new Error('Failed to link tag to verse');
  }
  return response.json();
}

export async function unlinkTagFromVerse(verseTagId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/verse-tags/${verseTagId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to unlink tag from verse');
  }
}

export async function getVersesByTagId(tagId: number): Promise<number[]> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}/verses`);
  if (!response.ok) {
    throw new Error('Failed to fetch verses for tag');
  }
  return response.json();
}

// Verse search for linking
export async function searchVerses(query: string): Promise<Array<{ 
  verse_id: number, 
  chapter_id: number, 
  verse_index: number, 
  verse: string,
  chapter_number: string,
  book_name: string,
  book_index: number
}>> {
  const response = await fetch(`${API_BASE_URL}/verses/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search verses');
  }
  return response.json();
}
