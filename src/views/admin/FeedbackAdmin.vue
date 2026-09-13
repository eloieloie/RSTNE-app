<template>
  <div class="feedback-admin admin-page">
    <header class="page-header admin-page-header">
      <h1 class="admin-title">💬 User Feedback</h1>
      <router-link to="/admin" class="admin-back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Filters -->
    <div class="filters-bar admin-toolbar admin-card">
      <div class="filter-group">
        <label>Category</label>
        <select v-model="filterCategory" class="admin-select" @change="load">
          <option value="">All</option>
          <option value="bug">Bug Reports</option>
          <option value="feature">Feature Requests</option>
          <option value="general">General</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filterRead" class="admin-select" @change="load">
          <option value="">All</option>
          <option value="0">Unread</option>
          <option value="1">Read</option>
        </select>
      </div>
      <div class="filter-stats">
        <span class="stat-badge unread admin-badge admin-badge--warning">{{ unreadCount }} unread</span>
        <span class="stat-badge total admin-badge admin-badge--info">{{ items.length }} total</span>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-msg admin-state">Loading…</div>
    <div v-else-if="error" class="state-msg admin-state admin-state--error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg admin-state">No feedback found.</div>

    <!-- Table -->
    <div v-else class="table-wrap admin-table-wrap">
      <table class="feedback-table admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Message</th>
            <th>Email</th>
            <th>Platform</th>
            <th>Version</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.feedback_id"
            :class="{ unread: !item.is_read }"
            @click="openDetail(item)"
            class="feedback-row"
          >
            <td class="date-cell">{{ formatDate(item.dt_added) }}</td>
            <td><span :class="['category-badge', item.category, 'admin-badge', item.category === 'bug' ? 'admin-badge--error' : item.category === 'feature' ? 'admin-badge--success' : 'admin-badge--neutral']">{{ item.category }}</span></td>
            <td class="message-cell">{{ truncate(item.message, 80) }}</td>
            <td class="email-cell">{{ item.email || '—' }}</td>
            <td class="platform-cell">{{ item.platform || '—' }}</td>
            <td class="version-cell">{{ item.app_version || '—' }}</td>
            <td>
              <span :class="['read-badge', 'admin-badge', item.is_read ? 'read admin-badge--neutral' : 'unread-badge admin-badge--warning']">
                {{ item.is_read ? 'Read' : 'Unread' }}
              </span>
            </td>
            <td class="actions-cell" @click.stop>
              <button
                class="action-btn admin-btn admin-btn--ghost admin-btn--sm"
                :title="item.is_read ? 'Mark unread' : 'Mark read'"
                @click="toggleRead(item)"
              >{{ item.is_read ? '✉️' : '✅' }}</button>
              <button class="action-btn danger admin-btn admin-btn--danger admin-btn--sm" title="Delete" @click="deleteItem(item)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail modal -->
    <AnimatePresence>
      <motion.div
        v-if="detail"
        class="modal-backdrop admin-modal-overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="overlayFade"
        @click.self="detail = null"
      >
        <motion.div
          class="modal-card admin-modal"
          :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :exit="{ opacity: 0, scale: 0.94, y: 8 }"
          :transition="tooltipSpring"
        >
          <div class="modal-header">
            <span :class="['category-badge', detail.category, 'admin-badge', detail.category === 'bug' ? 'admin-badge--error' : detail.category === 'feature' ? 'admin-badge--success' : 'admin-badge--neutral']">{{ detail.category }}</span>
            <span class="modal-date">{{ formatDate(detail.dt_added) }}</span>
            <motion.button class="modal-close admin-btn admin-btn--ghost admin-btn--sm" :while-tap="tapScale" @click="detail = null">✕</motion.button>
          </div>
          <p class="modal-message">{{ detail.message }}</p>
          <div class="modal-meta">
            <span v-if="detail.email">📧 {{ detail.email }}</span>
            <span v-if="detail.platform">📱 {{ detail.platform }}</span>
            <span v-if="detail.app_version">v{{ detail.app_version }}</span>
          </div>
          <div class="modal-actions admin-modal-actions">
            <motion.button class="btn-secondary admin-btn admin-btn--secondary" :while-tap="tapScale" @click="toggleRead(detail); detail = null">
              {{ detail.is_read ? 'Mark as Unread' : 'Mark as Read' }}
            </motion.button>
            <motion.button class="btn-danger admin-btn admin-btn--danger" :while-tap="tapScale" @click="deleteItem(detail); detail = null">Delete</motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import { API_URL as API_BASE, API_HEADERS } from '@/api/client';
import { useMotionPresets } from '@/composables/useMotionPresets';

const { prefersReducedMotion, tooltipSpring, tapScale, overlayFade } = useMotionPresets();

interface FeedbackItem {
  feedback_id: number;
  message: string;
  email: string | null;
  category: 'bug' | 'feature' | 'general';
  app_version: string | null;
  platform: string | null;
  is_read: boolean;
  dt_added: string;
}

const items = ref<FeedbackItem[]>([]);
const loading = ref(false);
const error = ref('');
const filterCategory = ref('');
const filterRead = ref('');
const detail = ref<FeedbackItem | null>(null);

const unreadCount = computed(() => items.value.filter(i => !i.is_read).length);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const params = new URLSearchParams();
    if (filterCategory.value) params.set('category', filterCategory.value);
    if (filterRead.value !== '') params.set('is_read', filterRead.value);
    const qs = params.toString() ? `?${params}` : '';
    const res = await fetch(`${API_BASE}/feedback${qs}`, { headers: API_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items.value = await res.json();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load feedback';
  } finally {
    loading.value = false;
  }
}

async function toggleRead(item: FeedbackItem) {
  const newVal = !item.is_read;
  item.is_read = newVal;
  try {
    await fetch(`${API_BASE}/feedback/${item.feedback_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...API_HEADERS },
      body: JSON.stringify({ is_read: newVal }),
    });
  } catch {
    item.is_read = !newVal; // revert on failure
  }
}

async function deleteItem(item: FeedbackItem) {
  if (!confirm(`Delete this feedback from "${item.platform || 'unknown'}"?`)) return;
  items.value = items.value.filter(i => i.feedback_id !== item.feedback_id);
  try {
    await fetch(`${API_BASE}/feedback/${item.feedback_id}`, {
      method: 'DELETE',
      headers: API_HEADERS,
    });
  } catch {
    // Re-fetch if delete failed
    load();
  }
}

function openDetail(item: FeedbackItem) {
  detail.value = item;
  if (!item.is_read) toggleRead(item);
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

onMounted(load);
</script>

<style scoped>
/* Layout, colors, fonts, table, badges, buttons, and modal come from the shared
   .admin-page / .admin-table / .admin-badge / .admin-btn / .admin-modal classes
   (src/assets/admin-ui.css). Only this page's column-specific typography and
   filter-toolbar caption labels live here. */

.feedback-admin {
  max-width: 1200px;
  margin: 0 auto;
}

/* Filters */
.filters-bar {
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.filter-group label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted-foreground);
}

.filter-stats {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-left: auto;
}

/* Table */
.feedback-table thead th {
  white-space: nowrap;
}

.feedback-row.unread { background: color-mix(in srgb, var(--color-warning) 10%, transparent); }
.feedback-row.unread:hover { background: color-mix(in srgb, var(--color-warning) 18%, transparent); }

.feedback-table td { vertical-align: top; }

.date-cell { white-space: nowrap; color: var(--color-muted-foreground); font-size: var(--font-size-xs); }
.message-cell { max-width: 320px; line-height: 1.4; }
.email-cell { color: var(--color-muted-foreground); font-size: var(--font-size-sm); white-space: nowrap; }
.platform-cell, .version-cell { color: var(--color-muted-foreground); font-size: var(--font-size-xs); white-space: nowrap; }

.category-badge, .read-badge {
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.actions-cell {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

/* Detail modal */
.modal-card {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.modal-date { font-size: var(--font-size-sm); color: var(--color-muted-foreground); flex: 1; }

.modal-message {
  font-size: var(--font-size-md);
  line-height: 1.6;
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  white-space: pre-wrap;
  margin: 0;
}

.modal-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-muted-foreground);
  flex-wrap: wrap;
}
</style>
