<template>
  <div class="range-ref-fixes admin-page">
    <header class="page-header admin-page-header">
      <div>
        <h1 class="admin-title">🔗 Same-Chapter Range-Ref Fixes (TEMP)</h1>
        <p class="subtitle admin-subtitle">
          Verses where a same-chapter reference like <code>(→ v.25)</code> is immediately followed
          by a stray <code>,26</code> outside the colored span — meant to be a range but stored in a
          shape nothing recognizes as one. Nothing is changed automatically. Review each proposed
          fix below and apply it yourself; applying uses the normal verse-update endpoint, which
          archives the previous text to verse history first, same as editing in the Chapter Editor.
        </p>
      </div>
      <router-link to="/admin" class="back-link admin-back-link">← Back to Dashboard</router-link>
    </header>

    <div v-if="loading" class="state-msg admin-state">Loading current verse text…</div>
    <div v-else-if="error" class="state-msg admin-state admin-state--error">{{ error }}</div>

    <div v-else class="table-wrap admin-table-wrap">
      <table class="verses-table admin-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Current</th>
            <th>Proposed</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.verseId" class="verse-row">
            <td class="ref-cell">
              <span class="ref-book">{{ row.bookName }}</span>
              <span class="ref-loc">{{ row.chapterNumber }}:{{ row.verseIndex }}</span>
            </td>
            <td class="text-cell" v-html="highlightOld(row.currentText, row.oldSubstring)"></td>
            <td class="text-cell">
              <span v-if="!row.confident" class="needs-decision">{{ row.note }}</span>
              <span v-else-if="row.state === 'stale'" class="needs-decision">
                Current text no longer contains the expected pattern — it may have already been
                edited elsewhere. Skipped to avoid an incorrect overwrite.
              </span>
              <span v-else v-html="highlightNew(row.proposedText, row.newSubstring)"></span>
            </td>
            <td class="status-cell">
              <span v-if="row.state === 'fixed'" class="admin-badge admin-badge--success">✓ applied</span>
              <span v-else-if="row.state === 'applying'" class="admin-badge admin-badge--info">applying…</span>
              <span v-else-if="row.state === 'error'" class="admin-badge admin-badge--error" :title="row.errorMessage ?? undefined">failed</span>
              <span v-else-if="row.state === 'stale'" class="admin-badge admin-badge--warning">needs review</span>
              <span v-else-if="!row.confident" class="admin-badge admin-badge--warning">needs your decision</span>
              <span v-else class="admin-badge admin-badge--neutral">pending</span>
            </td>
            <td class="actions-cell">
              <button
                v-if="row.confident && row.state !== 'stale'"
                class="action-btn admin-btn admin-btn--primary admin-btn--sm"
                :disabled="row.state === 'applying' || row.state === 'fixed'"
                @click="applyFix(row)"
              >{{ row.state === 'fixed' ? 'Applied' : 'Apply Fix' }}</button>
              <button class="action-btn admin-btn admin-btn--ghost admin-btn--sm" title="Open in reading pane" @click="openVerse(row)">Open ↗</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getVerseById, updateVerse } from '@/api/verses';

type RowState = 'pending' | 'applying' | 'fixed' | 'error' | 'stale';

interface Candidate {
  verseId: number;
  chapterId: number;
  bookName: string;
  chapterNumber: string;
  verseIndex: number;
  oldSubstring: string;
  newSubstring: string;
  confident: boolean;
  note?: string;
}

interface Row extends Candidate {
  currentText: string;
  proposedText: string;
  englishVerse: string;
  verseIndexValue: number | null;
  state: RowState;
  errorMessage: string | null;
}

// Found by scanning every verse containing "→ v." (203 total) for the one shape
// that's actually broken: a same-chapter range ref immediately followed by a
// bare ",N" outside the colored span, instead of a proper "N-M" range inside it.
const CANDIDATES: Candidate[] = [
  {
    verseId: 103232, chapterId: 2646, bookName: 'Exodus', chapterNumber: '16', verseIndex: 4,
    oldSubstring: '<strong><span style="color: red;">(→ v.26)</span>,28</strong>',
    newSubstring: '<strong><span style="color: red;">(→ v.26-28)</span></strong>',
    confident: true,
  },
  {
    verseId: 103319, chapterId: 2649, bookName: 'Exodus', chapterNumber: '19', verseIndex: 12,
    oldSubstring: '<span style="color: rgb(192, 0, 0);"><span style="color: red;">(→ v.20)</span>,21</span>',
    newSubstring: '<span style="color: rgb(192, 0, 0);"><span style="color: red;">(→ v.20-21)</span></span>',
    confident: true,
  },
  {
    verseId: 104183, chapterId: 2677, bookName: 'Leviticus', chapterNumber: '7', verseIndex: 23,
    oldSubstring: '<span style="color: red;">(→ v.25)</span>,26',
    newSubstring: '<span style="color: red;">(→ v.25-26)</span>',
    confident: true,
  },
  {
    verseId: 117613, chapterId: 3187, bookName: 'Job', chapterNumber: '31', verseIndex: 2,
    oldSubstring: '<span style="color: red;">(→ v.9)</span>,10',
    newSubstring: '<span style="color: red;">(→ v.9-10)</span>',
    confident: true,
  },
  {
    verseId: 118933, chapterId: 3241, bookName: 'Nehemiah', chapterNumber: '8', verseIndex: 1,
    oldSubstring: '<span style="color: red;">(→ v.8)</span>,9',
    newSubstring: '<span style="color: red;">(→ v.8-9)</span>',
    confident: true,
  },
  {
    verseId: 123759, chapterId: 3379, bookName: 'Luke', chapterNumber: '24', verseIndex: 7,
    oldSubstring: '',
    newSubstring: '',
    confident: false,
    note: 'Already has a range "(→ v.25-27)" plus a separate ", 44" styled in a different color (blue, not red) — not the same red-span-plus-stray-comma shape as the other five. Merging into "(→ v.25-44)" would wrongly imply a continuous range through verse 44. Left for you to decide — e.g. whether 44 should become its own "(→ v.44)".',
  },
];

const router = useRouter();
const rows = ref<Row[]>([]);
const loading = ref(false);
const error = ref('');

function highlightOld(text: string, oldSubstring: string): string {
  if (!oldSubstring) return text;
  return text.replace(oldSubstring, `<mark class="range-ref-hit">${oldSubstring}</mark>`);
}

function highlightNew(text: string, newSubstring: string): string {
  if (!newSubstring) return text;
  return text.replace(newSubstring, `<mark class="range-ref-fix">${newSubstring}</mark>`);
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    rows.value = await Promise.all(
      CANDIDATES.map(async (c): Promise<Row> => {
        const verse = await getVerseById(c.verseId);
        const currentText = verse.telugu_verse ?? '';
        const englishVerse = verse.verse;
        const verseIndexValue = verse.verse_index;
        if (!c.confident) {
          return { ...c, currentText, proposedText: currentText, englishVerse, verseIndexValue, state: 'pending', errorMessage: null };
        }
        const stale = !currentText.includes(c.oldSubstring);
        const proposedText = stale ? currentText : currentText.replace(c.oldSubstring, c.newSubstring);
        return { ...c, currentText, proposedText, englishVerse, verseIndexValue, state: stale ? 'stale' : 'pending', errorMessage: null };
      })
    );
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load verses';
  } finally {
    loading.value = false;
  }
}

async function applyFix(row: Row) {
  row.state = 'applying';
  row.errorMessage = null;
  try {
    // The update endpoint isn't a true partial update — it writes verse_index
    // and verse (English) from the request body too, defaulting to NULL if
    // omitted — so the English text and index must be resent unchanged here.
    await updateVerse(row.verseId, {
      verse_index: row.verseIndexValue ?? undefined,
      verse: row.englishVerse,
      telugu_verse: row.proposedText,
    });
    row.state = 'fixed';
  } catch (e: unknown) {
    row.state = 'error';
    row.errorMessage = e instanceof Error ? e.message : 'Update failed';
  }
}

function openVerse(row: Row) {
  router.push({
    name: 'book-chapter-verse',
    params: {
      bookName: row.bookName.replace(/ /g, '-'),
      chapterNumber: row.chapterNumber,
      verseNumber: String(row.verseIndex),
    },
  });
}

onMounted(load);
</script>

<style scoped>
/* Colors, fonts, page header, table, badges, buttons, and state messages come
   from the shared .admin-page / .admin-table / .admin-badge / .admin-btn
   classes (src/assets/admin-ui.css). Only this page's own layout sizing and
   highlight-mark styling live here. */

.range-ref-fixes {
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.subtitle { max-width: 760px; }

.verse-row { transition: background 0.1s; }
.verse-row:hover { background: var(--color-background-alt); }

.ref-cell { white-space: nowrap; }
.ref-book { font-weight: 600; color: var(--color-foreground); }
.ref-loc { color: var(--color-muted-foreground); margin-left: 6px; }

.text-cell { line-height: 1.5; color: var(--color-foreground); max-width: 420px; }

.text-cell :deep(.range-ref-hit) {
  background: var(--color-warning-background, #fef3c7);
  color: var(--color-warning, #92400e);
  border-radius: 4px;
  padding: 0 3px;
  font-weight: 600;
}

.text-cell :deep(.range-ref-fix) {
  background: color-mix(in srgb, var(--color-success) 20%, transparent);
  color: var(--color-success);
  border-radius: 4px;
  padding: 0 3px;
  font-weight: 600;
}

.needs-decision {
  color: var(--color-warning, #92400e);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.status-cell { white-space: nowrap; }

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}
</style>
