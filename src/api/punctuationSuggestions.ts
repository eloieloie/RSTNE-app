import { API_URL, API_HEADERS } from './client';

export interface PunctuationSuggestion {
  suggestion_id: number;
  verse_id: number;
  english_reference: string | null;
  original_telugu: string;
  suggested_telugu: string;
  content_hash: string;
  model_used: string;
  status: 'pending' | 'approved' | 'rejected';
  dt_added: string;
  dt_reviewed: string | null;
  verse_index: number | null;
  chapter_id: number;
  chapter_number: string;
  book_id: number;
  book_name: string | null;
}

export interface PunctuationSuggestionsPage {
  results: PunctuationSuggestion[];
  // Total matching rows regardless of the endpoint's 1000-row response cap —
  // use this for counts/stats, not results.length.
  total: number;
}

export async function getPunctuationSuggestions(status?: string): Promise<PunctuationSuggestionsPage> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${API_URL}/punctuation-suggestions${qs}`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch punctuation suggestions');
  const data = await response.json();
  const results = data.results ?? data;
  return { results, total: data.total ?? results.length };
}

export async function approvePunctuationSuggestion(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/punctuation-suggestions/${id}/approve`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) throw new Error('Failed to approve suggestion');
}

export async function rejectPunctuationSuggestion(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/punctuation-suggestions/${id}/reject`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) throw new Error('Failed to reject suggestion');
}

export async function deletePunctuationSuggestion(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/punctuation-suggestions/${id}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
    body: '{}',
  });
  if (!response.ok) throw new Error('Failed to delete suggestion');
}
