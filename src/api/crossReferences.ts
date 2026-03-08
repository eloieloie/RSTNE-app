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
  from_book_abbr?: string;
  from_book_id?: number;
  to_book_abbr?: string;
  to_book_id?: number;
  target_book_id?: number;
  target_chapter_id?: number;
  target_verse_id?: number;
}

// Get cross-references for a specific book, chapter, and verse
export async function getCrossReferences(
  bookId: number,
  chapter: string,
  verse: string
): Promise<CrossReferenceData[]> {
  const response = await fetch(
    `${API_BASE_URL}/cross-references?bookId=${bookId}&chapter=${encodeURIComponent(chapter)}&verse=${encodeURIComponent(verse)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch cross-references');
  }
  const data = await response.json();
  return data;
}

// Result shape returned by the batch expand-all endpoint
export interface CrossRefVerseText {
  cross_ref_id: number;
  verse_text: string | null;
  telugu_verse_text: string | null;
}

// Fetch all target verse texts for every cross-reference of a given from-verse
// in a single SQL round-trip.  Used by the broadcast-panel "Expand all" button.
export async function getAllCrossRefVerseTexts(
  bookId: number,
  chapter: string,
  verse: string
): Promise<CrossRefVerseText[]> {
  const response = await fetch(
    `${API_BASE_URL}/cross-references/expand-all?bookId=${bookId}&chapter=${encodeURIComponent(chapter)}&verse=${encodeURIComponent(verse)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch cross-reference verse texts');
  }
  return response.json();
}
