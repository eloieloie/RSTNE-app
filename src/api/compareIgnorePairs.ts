import { API_HEADERS } from './client';

const API_URL = 'https://rstne.eloi.in/api';

export interface IgnorePair {
  pair_id: number;
  left_word: string;
  right_word: string;
}

export async function getIgnorePairs(): Promise<IgnorePair[]> {
  const response = await fetch(`${API_URL}/compare-ignore-pairs`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch ignore pairs');
  return response.json();
}

export async function createIgnorePair(left: string, right: string): Promise<IgnorePair> {
  const response = await fetch(`${API_URL}/compare-ignore-pairs`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ left, right })
  });
  if (!response.ok) throw new Error('Failed to create ignore pair');
  return response.json();
}

export async function deleteIgnorePair(pairId: number): Promise<void> {
  const response = await fetch(`${API_URL}/compare-ignore-pairs/${pairId}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'X-HTTP-Method-Override': 'DELETE' }
  });
  if (!response.ok) throw new Error('Failed to delete ignore pair');
}
