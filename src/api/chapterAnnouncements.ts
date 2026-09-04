import { API_URL, API_HEADERS, getAuthHeaders } from './client';
import type { VerseAudioLanguage } from '@/utils/collectionReferences';

export interface ChapterAnnouncementRow {
  id: number;
  chapter_id: number;
  language: VerseAudioLanguage;
  audio_url: string | null;
  storage_path: string | null;
  status: 'pending' | 'ready' | 'failed';
  error_message: string | null;
  dt_generated: string | null;
}

export interface ChapterAnnouncementSummary {
  chapter_id: number;
  chapter_number: string;
  en_status: ChapterAnnouncementRow['status'] | null;
  en_audio_url: string | null;
  en_dt_generated: string | null;
  en_error: string | null;
  te_status: ChapterAnnouncementRow['status'] | null;
  te_audio_url: string | null;
  te_dt_generated: string | null;
  te_error: string | null;
  he_status: ChapterAnnouncementRow['status'] | null;
  he_audio_url: string | null;
  he_dt_generated: string | null;
  he_error: string | null;
}

export async function getChapterAnnouncement(
  chapterId: number,
  lang: VerseAudioLanguage
): Promise<ChapterAnnouncementRow | null> {
  const res = await fetch(
    `${API_URL}/chapter-announcements?chapter_id=${chapterId}&lang=${lang}`,
    { headers: API_HEADERS }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch chapter announcement');
  return res.json();
}

export async function listChapterAnnouncements(
  bookId: number
): Promise<ChapterAnnouncementSummary[]> {
  const res = await fetch(
    `${API_URL}/chapter-announcements?book_id=${bookId}`,
    { headers: await getAuthHeaders() }
  );
  if (!res.ok) throw new Error('Failed to list chapter announcements');
  const data = await res.json();
  return data.results ?? [];
}

export async function flushChapterAnnouncements(): Promise<void> {
  const res = await fetch(`${API_URL}/chapter-announcements/flush`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
}

export async function generateChapterAnnouncement(
  chapterId: number,
  lang: VerseAudioLanguage,
  force = false
): Promise<ChapterAnnouncementRow> {
  const res = await fetch(`${API_URL}/chapter-announcements/generate`, {
    method: 'POST',
    headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapter_id: chapterId, language: lang, force }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data;
}
