import type { BookCategory } from '@/utils/collectionReferences';

const API_URL = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api';

/**
 * Fetches all book categories from the API
 * 
 * API Response Structure:
 * Returns an array of book category objects:
 * [
 *   {
 *     "category_id": 1,              // Unique identifier for the category
 *     "category_name": "First Covenant",  // Display name of the category
 *     "category_order": 1,           // Order in which categories should be displayed
 *     "dt_added": "2026-01-11T02:33:30.000Z"  // Timestamp when category was added
 *   },
 *   {
 *     "category_id": 2,
 *     "category_name": "New Covenant",
 *     "category_order": 2,
 *     "dt_added": "2026-01-11T02:33:30.000Z"
 *   },
 *   {
 *     "category_id": 3,
 *     "category_name": "Restored Apocryphal Books",
 *     "category_order": 3,
 *     "dt_added": "2026-01-11T02:33:30.000Z"
 *   }
 * ]
 * 
 * Categories include:
 * - First Covenant (Old Testament)
 * - New Covenant (New Testament)
 * - Restored Apocryphal Books
 */
export async function getAllBookCategories(): Promise<BookCategory[]> {
  const response = await fetch(`${API_URL}/book-categories`);
  if (!response.ok) throw new Error('Failed to fetch book categories');
  return await response.json();
}
