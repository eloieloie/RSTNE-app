<template>
  <div class="push-admin admin-page">
    <header class="push-header admin-page-header">
      <h1 class="admin-title">Push Notifications</h1>
      <router-link to="/admin" class="back-link admin-back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Device count -->
    <div class="stats-bar">
      <div class="stat-card admin-card">
        <span class="stat-value">{{ deviceCount === null ? '…' : deviceCount }}</span>
        <span class="stat-label">Registered Devices</span>
      </div>
    </div>

    <!-- Compose form -->
    <div class="compose-card admin-card">
      <h2>Send Notification</h2>

      <div class="field admin-form-group">
        <label class="admin-label">Title *</label>
        <input v-model="form.title" type="text" placeholder="e.g. Daily Verse" maxlength="100" class="admin-input" />
      </div>

      <div class="field admin-form-group">
        <label class="admin-label">Message *</label>
        <textarea v-model="form.body" rows="3" placeholder="e.g. In the beginning Elohim created…" maxlength="500" class="admin-textarea" />
      </div>

      <!-- Deep link: book picker -->
      <div class="field admin-form-group">
        <label class="admin-label">Deep link — Book (optional)</label>
        <select v-model="form.bookId" @change="onBookChange" class="admin-select">
          <option value="">— no deep link —</option>
          <option v-for="book in books" :key="book.book_id" :value="String(book.book_id)">
            {{ book.book_name }}
          </option>
        </select>
      </div>

      <!-- Chapter picker (shown only when a book is selected) -->
      <div v-if="form.bookId && chapters.length" class="field admin-form-group">
        <label class="admin-label">Chapter</label>
        <select v-model="form.chapterId" @change="onChapterChange" class="admin-select">
          <option value="">— none —</option>
          <option v-for="ch in chapters" :key="ch.chapter_id" :value="String(ch.chapter_id)">
            Chapter {{ ch.chapter_number }}
          </option>
        </select>
      </div>

      <!-- Verse picker (shown only when a chapter is selected) -->
      <div v-if="form.chapterId && verses.length" class="field admin-form-group">
        <label class="admin-label">Verse (optional)</label>
        <select v-model="form.verse" class="admin-select">
          <option value="">— none —</option>
          <option v-for="v in verses" :key="v.verse_id" :value="String(v.verse_index)">
            {{ v.verse_index }} — {{ v.verse.slice(0, 60) }}{{ v.verse.length > 60 ? '…' : '' }}
          </option>
        </select>
      </div>

      <div class="field admin-form-group">
        <label class="admin-label">Send to</label>
        <div class="radio-group">
          <label class="radio-label">
            <input v-model="form.audience" type="radio" value="all" />
            All devices ({{ deviceCount === null ? '…' : deviceCount }})
          </label>
          <label class="radio-label">
            <input v-model="form.audience" type="radio" value="specific" />
            Specific tokens
          </label>
        </div>
      </div>

      <div v-if="form.audience === 'specific'" class="field admin-form-group">
        <label class="admin-label">FCM Tokens (one per line)</label>
        <textarea v-model="form.specificTokens" rows="4" placeholder="Paste FCM tokens here, one per line" class="admin-textarea" />
      </div>

      <div v-if="result" class="result-banner admin-badge" :class="result.ok ? 'result-ok admin-badge--success' : 'result-err admin-badge--error'">
        <span v-if="result.ok">
          Sent to {{ result.sent }} device{{ result.sent !== 1 ? 's' : '' }}
          <span v-if="result.failed"> ({{ result.failed }} failed)</span>
        </span>
        <span v-else>{{ result.error }}</span>
      </div>

      <button
        class="send-btn admin-btn admin-btn--primary"
        :disabled="sending || !form.title.trim() || !form.body.trim()"
        @click="send"
      >
        {{ sending ? 'Sending…' : 'Send Notification' }}
      </button>
    </div>

    <!-- History (session only) -->
    <div v-if="history.length" class="history-card admin-card">
      <h2>Sent This Session</h2>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Title</th>
              <th>Sent</th>
              <th>Failed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, i) in history" :key="i">
              <td>{{ entry.time }}</td>
              <td>{{ entry.title }}</td>
              <td>{{ entry.sent }}</td>
              <td>{{ entry.failed }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API_HEADERS } from '@/api/client'

const API_BASE = 'https://rstne.eloi.in/api'
const FCM_BASE = 'https://us-central1-rstne-app-2025.cloudfunctions.net/api/api'

interface Book { book_id: number; book_name: string }
interface Chapter { chapter_id: number; chapter_number: number }
interface Verse { verse_id: number; verse_index: number; verse: string }
interface HistoryEntry { time: string; title: string; sent: number; failed: number }

const deviceCount = ref<number | null>(null)
const sending = ref(false)
const result = ref<{ ok: boolean; sent?: number; failed?: number; error?: string } | null>(null)
const history = ref<HistoryEntry[]>([])
const books = ref<Book[]>([])
const chapters = ref<Chapter[]>([])
const verses = ref<Verse[]>([])

const form = ref({
  title: '',
  body: '',
  bookId: '',
  chapterId: '',
  verse: '',
  audience: 'all',
  specificTokens: '',
})

onMounted(async () => {
  try {
    const [countRes, booksRes] = await Promise.all([
      fetch(`${FCM_BASE}/fcm-tokens/count`),
      fetch(`${API_BASE}/books`, { headers: API_HEADERS }),
    ])
    deviceCount.value = (await countRes.json()).count ?? 0
    books.value = await booksRes.json()
  } catch {
    deviceCount.value = 0
  }
})

async function onBookChange() {
  form.value.chapterId = ''
  form.value.verse = ''
  chapters.value = []
  verses.value = []
  if (!form.value.bookId) return
  try {
    const res = await fetch(`${API_BASE}/books/${form.value.bookId}/chapters`, { headers: API_HEADERS })
    chapters.value = await res.json()
  } catch {
    chapters.value = []
  }
}

async function onChapterChange() {
  form.value.verse = ''
  verses.value = []
  if (!form.value.chapterId) return
  try {
    const res = await fetch(`${API_BASE}/chapters/${form.value.chapterId}/verses`, { headers: API_HEADERS })
    verses.value = await res.json()
  } catch {
    verses.value = []
  }
}

async function send() {
  if (!form.value.title.trim() || !form.value.body.trim()) return
  sending.value = true
  result.value = null

  const data: Record<string, string> = {}
  if (form.value.bookId) data.bookId = form.value.bookId
  if (form.value.chapterId) data.chapterId = form.value.chapterId
  if (form.value.verse) data.verse = form.value.verse

  const tokens =
    form.value.audience === 'specific'
      ? form.value.specificTokens.split('\n').map((t) => t.trim()).filter(Boolean)
      : undefined

  try {
    const res = await fetch(`${FCM_BASE}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        data,
        ...(tokens ? { tokens } : {}),
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      result.value = { ok: false, error: json.error ?? 'Unknown error' }
    } else {
      result.value = { ok: true, sent: json.sent, failed: json.failed }
      history.value.unshift({
        time: new Date().toLocaleTimeString(),
        title: form.value.title.trim(),
        sent: json.sent,
        failed: json.failed,
      })
      form.value.title = ''
      form.value.body = ''
      form.value.bookId = ''
      form.value.chapterId = ''
      form.value.verse = ''
      form.value.specificTokens = ''
      form.value.audience = 'all'
      chapters.value = []
      verses.value = []
      const countRes = await fetch(`${FCM_BASE}/fcm-tokens/count`)
      deviceCount.value = (await countRes.json()).count ?? deviceCount.value
    }
  } catch (e: unknown) {
    result.value = { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
/* Colors, fonts, page header, cards, table, buttons, form fields, and badge
   tinting come from the shared .admin-page / .admin-card / .admin-table /
   .admin-btn / .admin-form-group / .admin-badge classes (src/assets/admin-ui.css).
   Only this page's own layout sizing remains here. */

.push-admin {
  max-width: 1200px;
  margin: 0 auto;
}

.push-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.stats-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 140px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-muted-foreground);
  margin-top: 2px;
}

.compose-card,
.history-card {
  margin-bottom: 2rem;
}

.compose-card {
  /* Page container matches the rest of /admin/* at 1200px, but a compose
     form of short text fields stretched that wide looks and feels wrong —
     same narrower-form-in-a-wider-page pattern as ManageBooks' edit form. */
  max-width: 640px;
}

.compose-card h2,
.history-card h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 1.25rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.result-banner {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

@media (max-width: 600px) {
  .field-row {
    grid-template-columns: 1fr;
  }

  .push-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
