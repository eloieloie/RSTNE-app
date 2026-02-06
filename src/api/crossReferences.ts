import type { CrossReference } from '@/utils/collectionReferences';

const API_BASE_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

// Type for cross-reference data with target verse details
export interface CrossReferenceData {
  cross_ref_id: number;
  from_book_name: string;
  from_chapter: string;
  from_verse: string;
  to_book_name: string;
  to_chapter: string;
  to_verse: string;
  votes: number;
  target_book_id?: number;
  target_chapter_id?: number;
  target_verse_id?: number;
}

// Get cross-references for a specific book, chapter, and verse
export async function getCrossReferences(
  bookName: string,
  chapter: string,
  verse: string
): Promise<CrossReferenceData[]> {
  const response = await fetch(
    `${API_BASE_URL}/cross-references?book=${encodeURIComponent(bookName)}&chapter=${encodeURIComponent(chapter)}&verse=${encodeURIComponent(verse)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch cross-references');
  }
  return response.json();
}
