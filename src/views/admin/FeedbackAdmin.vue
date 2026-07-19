<template>
  <div class="feedback-admin">
    <header class="page-header">
      <h1>💬 User Feedback</h1>
      <router-link to="/admin" class="back-link">← Back to Dashboard</router-link>
    </header>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Category</label>
        <select v-model="filterCategory" @change="load">
          <option value="">All</option>
          <option value="bug">Bug Reports</option>
          <option value="feature">Feature Requests</option>
          <option value="general">General</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filterRead" @change="load">
          <option value="">All</option>
          <option value="0">Unread</option>
          <option value="1">Read</option>
        </select>
      </div>
      <div class="filter-stats">
        <span class="stat-badge unread">{{ unreadCount }} unread</span>
        <span class="stat-badge total">{{ items.length }} total</span>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-msg">No feedback found.</div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="feedback-table">
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
            <td><span :class="['category-badge', item.category]">{{ item.category }}</span></td>
            <td class="message-cell">{{ truncate(item.message, 80) }}</td>
            <td class="email-cell">{{ item.email || '—' }}</td>
            <td class="platform-cell">{{ item.platform || '—' }}</td>
            <td class="version-cell">{{ item.app_version || '—' }}</td>
            <td>
              <span :class="['read-badge', item.is_read ? 'read' : 'unread-badge']">
                {{ item.is_read ? 'Read' : 'Unread' }}
              </span>
            </td>
            <td class="actions-cell" @click.stop>
              <button
                class="action-btn"
                :title="item.is_read ? 'Mark unread' : 'Mark read'"
                @click="toggleRead(item)"
              >{{ item.is_read ? '✉️' : '✅' }}</button>
              <button class="action-btn danger" title="Delete" @click="deleteItem(item)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail modal -->
    <Transition name="modal">
      <div v-if="detail" class="modal-backdrop" @click.self="detail = null">
        <div class="modal-card">
          <div class="modal-header">
            <span :class="['category-badge', detail.category]">{{ detail.category }}</span>
            <span class="modal-date">{{ formatDate(detail.dt_added) }}</span>
            <button class="modal-close" @click="detail = null">✕</button>
          </div>
          <p class="modal-message">{{ detail.message }}</p>
          <div class="modal-meta">
            <span v-if="detail.email">📧 {{ detail.email }}</span>
            <span v-if="detail.platform">📱 {{ detail.platform }}</span>
            <span v-if="detail.app_version">v{{ detail.app_version }}</span>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="toggleRead(detail); detail = null">
              {{ detail.is_read ? 'Mark as Unread' : 'Mark as Read' }}
            </button>
            <button class="btn-danger" @click="deleteItem(detail); detail = null">Delete</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { API_URL as API_BASE, API_HEADERS } from '@/api/client';

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
.feedback-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: inherit;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }

.back-link {
  color: #6b7280;
  text-decoration: none;
  font-size: 0.9rem;
}
.back-link:hover { color: #1E40AF; }

/* Filters */
.filters-bar {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.filter-group select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
}

.filter-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.stat-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.stat-badge.unread { background: #fef3c7; color: #92400e; }
.stat-badge.total { background: #e0e7ff; color: #3730a3; }

/* Table */
.table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: auto;
}

.feedback-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.feedback-table thead th {
  text-align: left;
  padding: 10px 14px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  white-space: nowrap;
}

.feedback-row {
  cursor: pointer;
  transition: background 0.1s;
}
.feedback-row:hover { background: #f9fafb; }
.feedback-row.unread { background: #fffbeb; }
.feedback-row.unread:hover { background: #fef3c7; }

.feedback-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.date-cell { white-space: nowrap; color: #6b7280; font-size: 12px; }
.message-cell { max-width: 320px; line-height: 1.4; color: #111827; }
.email-cell { color: #6b7280; font-size: 13px; white-space: nowrap; }
.platform-cell, .version-cell { color: #6b7280; font-size: 12px; white-space: nowrap; }

.category-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.category-badge.bug { background: #fee2e2; color: #991b1b; }
.category-badge.feature { background: #d1fae5; color: #065f46; }
.category-badge.general { background: #e0e7ff; color: #3730a3; }

.read-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
}
.read-badge.read { background: #f3f4f6; color: #9ca3af; }
.read-badge.unread-badge { background: #fef9c3; color: #713f12; }

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.1s;
}
.action-btn:hover { background: #f3f4f6; }
.action-btn.danger:hover { background: #fee2e2; }

/* State messages */
.state-msg {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
.state-msg.error { color: #dc2626; }

/* Detail modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 560px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-date { font-size: 13px; color: #6b7280; flex: 1; }

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #6b7280;
  padding: 4px 6px;
  border-radius: 6px;
}
.modal-close:hover { background: #f3f4f6; }

.modal-message {
  font-size: 15px;
  line-height: 1.6;
  color: #111827;
  background: #f9fafb;
  border-radius: 8px;
  padding: 14px;
  white-space: pre-wrap;
  margin: 0;
}

.modal-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
  flex-wrap: wrap;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }

.btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.btn-danger:hover { background: #b91c1c; }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
