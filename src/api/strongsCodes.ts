import { API_URL, API_HEADERS, getAuthHeaders } from './client';
import { auth } from '@/firebase';

export type StrongsLang = 'en' | 'te';

export interface StrongsCodeItem {
  verse_id: number;
  verse_index: number | null;
  chapter_id: number;
  chapter_number: string;
  book_id: number | null;
  book_name: string | null;
  // Stored text, and the same text with bare Strong's numbers in [square brackets].
  text: string;
  proposed: string;
}

export interface StrongsCodesPage {
  results: StrongsCodeItem[];
  // Total matches regardless of the endpoint's 1000-row response cap.
  total: number;
}

export async function getStrongsCodes(lang: StrongsLang): Promise<StrongsCodesPage> {
  const response = await fetch(`${API_URL}/verses/strongs-codes?lang=${lang}`, { headers: API_HEADERS });
  if (!response.ok) throw new Error("Failed to fetch verses with Strong's codes");
  return response.json();
}

export async function bracketStrongsCodes(lang: StrongsLang, verseIds: number[]): Promise<{ updated: number }> {
  const response = await fetch(`${API_URL}/verses/strongs-codes`, {
    method: 'POST',
    headers: {
      ...(await getAuthHeaders()),
      'Content-Type': 'application/json',
      'X-Changed-By': auth.currentUser?.email || '',
    },
    body: JSON.stringify({ lang, verse_ids: verseIds }),
  });
  if (!response.ok) throw new Error("Failed to bracket Strong's codes");
  return response.json();
}
