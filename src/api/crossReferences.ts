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
  const startTime = performance.now();
  console.log(`[${new Date().toISOString()}] 🌐 API: GET /cross-references?bookId=${bookId}&chapter=${chapter}&verse=${verse}`);
  const response = await fetch(
    `${API_BASE_URL}/cross-references?bookId=${bookId}&chapter=${encodeURIComponent(chapter)}&verse=${encodeURIComponent(verse)}`
  );
  console.log(`[${new Date().toISOString()}] 📡 API Response received in ${(performance.now() - startTime).toFixed(2)}ms, status: ${response.status}`);
  if (!response.ok) {
    throw new Error('Failed to fetch cross-references');
  }
  const data = await response.json();
  console.log(`[${new Date().toISOString()}] 📦 Cross-references parsed in ${(performance.now() - startTime).toFixed(2)}ms, ${data.length} refs`);
  return data;
}
