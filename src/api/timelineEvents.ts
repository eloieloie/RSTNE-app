import type { TimelineEvent, TimelineEventInsert, TimelineEventUpdate } from '@/utils/collectionReferences';
import { API_URL, API_HEADERS } from './client';

export async function getAllTimelineEvents(): Promise<TimelineEvent[]> {
  const response = await fetch(`${API_URL}/timeline-events`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch timeline events');
  return response.json();
}

export async function getTimelineEventById(id: number): Promise<TimelineEvent> {
  const response = await fetch(`${API_URL}/timeline-events/${id}`, { headers: API_HEADERS });
  if (!response.ok) throw new Error('Failed to fetch timeline event');
  return response.json();
}

export async function createTimelineEvent(event: TimelineEventInsert): Promise<{ id: number }> {
  const response = await fetch(`${API_URL}/timeline-events`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error('Failed to create timeline event');
  return response.json();
}

export async function updateTimelineEvent(id: number, event: TimelineEventUpdate): Promise<void> {
  const response = await fetch(`${API_URL}/timeline-events/${id}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'PUT' },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error('Failed to update timeline event');
}

export async function deleteTimelineEvent(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/timeline-events/${id}`, {
    method: 'POST',
    headers: { ...API_HEADERS, 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'DELETE' },
    body: '{}',
  });
  if (!response.ok) throw new Error('Failed to delete timeline event');
}
