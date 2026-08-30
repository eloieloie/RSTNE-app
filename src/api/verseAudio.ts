import { API_URL, API_HEADERS, getAuthHeaders } from './client';
import type { VerseAudio, VerseAudioLanguage, VerseAudioStatus } from '@/utils/collectionReferences';

export interface ChapterAudioRow {
  verse_id: number;
  verse_index: number | null;
  audio_url: string | null;
  duration_ms: number | null;
  status: VerseAudioStatus | null;
  dt_generated: string | null;
}

export interface VerseAudioStatusRow extends VerseAudio {
  verse_index: number | null;
  chapter_id: number;
  chapter_number: string;
  book_id: number;
  book_name: string | null;
}

export async function getChapterAudio(chapterId: number, lang: VerseAudioLanguage): Promise<ChapterAudioRow[]> {
  // The endpoint sends a 5-minute Cache-Control header (fine for eventual
  // consumer playback UI), but the admin generator needs to see live status
  // right after generating/resetting — bypass the browser HTTP cache entirely.
  const res = await fetch(`${API_URL}/chapters/${chapterId}/audio?lang=${lang}`, {
    headers: API_HEADERS,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch chapter audio');
  const data = await res.json();
  return data.results ?? [];
}

export async function getVerseAudio(verseId: number, lang: VerseAudioLanguage): Promise<VerseAudio | null> {
  const res = await fetch(`${API_URL}/verses/${verseId}/audio?lang=${lang}`, { headers: API_HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch verse audio');
  return res.json();
}

export async function getVerseAudioStatusList(
  params: { status?: VerseAudioStatus; bookId?: number } = {}
): Promise<VerseAudioStatusRow[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.bookId) qs.set('book_id', String(params.bookId));
  const res = await fetch(`${API_URL}/verse-audio/status?${qs.toString()}`, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch audio status');
  const data = await res.json();
  return data.results ?? [];
}

// Clears tracked verse_audio_tbl rows, scoped to a chapter (and optionally a
// language) when provided. Does not delete files from disk — only useful for
// recovering the tracking table after files were removed manually.
export async function resetVerseAudioData(
  params: { chapterId?: number; language?: VerseAudioLanguage } = {}
): Promise<void> {
  const res = await fetch(`${API_URL}/verse-audio/reset`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapter_id: params.chapterId, language: params.language }),
  });
  if (!res.ok) throw new Error('Failed to reset audio data');
}

export async function generateVerseAudio(
  verseId: number,
  lang: VerseAudioLanguage,
  force = false
): Promise<VerseAudio> {
  const res = await fetch(`${API_URL}/verse-audio/generate`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ verse_id: verseId, language: lang, force }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}
