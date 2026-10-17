import { API_URL, API_HEADERS, getAuthHeaders } from './client';

export type PunctuationLang = 'en' | 'te';

export interface PunctuationReviewItem {
  verse_id: number;
  verse_index: number | null;
  chapter_id: number;
  chapter_number: string;
  book_id: number | null;
  book_name: string | null;
  text: string;
  length: number;
  punct_count: number;
  // Characters per punctuation mark — higher means worse.
  ratio: number;
  reviewed: boolean;
}

export interface PunctuationReviewPage {
  results: PunctuationReviewItem[];
  // Total matches regardless of the endpoint's 1000-row response cap.
  total: number;
}

export interface PunctuationReviewParams {
  lang: PunctuationLang;
  minLength: number;
  minRatio: number;
  reviewed: '0' | '1' | 'all';
}

export async function getPunctuationReview(p: PunctuationReviewParams): Promise<PunctuationReviewPage> {
  const qs = new URLSearchParams({
    lang: p.lang,
    min_length: String(p.minLength),
    min_ratio: String(p.minRatio),
    reviewed: p.reviewed,
  });
  const response = await fetch(`${API_URL}/verses/punctuation-review?${qs}`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch verses for punctuation review');
  return response.json();
}

export async function setPunctuationReviewed(verseId: number, lang: PunctuationLang, reviewed: boolean): Promise<void> {
  const response = await fetch(`${API_URL}/verses/punctuation-review`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ verse_id: verseId, lang, reviewed }),
  });
  if (!response.ok) throw new Error('Failed to update reviewed flag');
}
