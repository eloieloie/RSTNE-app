import { auth } from '@/firebase';

export const API_URL = 'https://rstne.eloi.in/api';

export const API_HEADERS: Record<string, string> = {
  'X-API-Key': '789ccdbc5dd6e360769994ea1648ce7f3b0b8549218c4efe1a09a0d26c0d46e3',
};

// Same as API_HEADERS, plus a Firebase bearer token when the user is signed in.
// Use this for endpoints that need to identify the caller (personal notes, admin
// note edits, /api/auth/*) — plain reads can keep using the static API_HEADERS.
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return { ...API_HEADERS };
  const token = await user.getIdToken();
  return { ...API_HEADERS, Authorization: `Bearer ${token}` };
}
