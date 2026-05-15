<template>
  <div class="manage-timeline">
    <header class="mte-header">
      <h1>📜 Timeline Events</h1>
      <div class="header-actions">
        <router-link to="/timeline" class="preview-link" target="_blank">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Preview Timeline
        </router-link>
        <router-link to="/admin" class="back-link">← Admin</router-link>
      </div>
    </header>

    <!-- Notification -->
    <transition name="notif-fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </transition>

    <div class="mte-body">
      <!-- Left: event list -->
      <div class="event-list-panel">
        <div class="list-toolbar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search events…"
            class="search-input"
          />
          <button class="add-btn" @click="startNew">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Event
          </button>
        </div>

        <div v-if="loading" class="list-loading">
          <div class="spinner"></div> Loading…
        </div>
        <div v-else-if="filteredList.length === 0" class="list-empty">
          No events found.
        </div>
        <div v-else class="event-list">
          <div
            v-for="ev in filteredList"
            :key="ev.event_id"
            class="event-row"
            :class="{ active: editingEvent?.event_id === ev.event_id }"
            @click="startEdit(ev)"
          >
            <div class="row-left">
              <span class="row-cat-dot" :style="{ background: getCategoryColor(ev.category) }"></span>
              <div>
                <div class="row-title">{{ ev.title }}</div>
                <div class="row-year">AM {{ ev.am_year }} · {{ formatYear(ev) }}</div>
              </div>
            </div>
            <div class="row-badges">
              <span v-if="ev.is_jubilee" class="mini-badge jubilee">J</span>
              <span v-if="ev.is_shemittah" class="mini-badge shemittah">S</span>
              <button class="delete-btn" @click.stop="confirmDelete(ev)" title="Delete event">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: form -->
      <div class="event-form-panel">
        <div v-if="!editingEvent && !isNew" class="form-placeholder">
          <div class="placeholder-icon">📜</div>
          <p>Select an event to edit, or click <strong>Add Event</strong> to create a new one.</p>
        </div>

        <form v-else @submit.prevent="saveEvent" class="event-form">
          <div class="form-title-row">
            <h2>{{ isNew ? 'New Event' : 'Edit Event' }}</h2>
            <button type="button" class="cancel-btn" @click="cancelEdit">Cancel</button>
          </div>

          <!-- Title -->
          <div class="field">
            <label>Title <span class="required">*</span></label>
            <input v-model="form.title" type="text" required placeholder="e.g. Creation, Nisan 1" />
          </div>

          <!-- Description -->
          <div class="field">
            <label>Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Brief description of the event…"></textarea>
          </div>

          <!-- Year fields -->
          <div class="field-row">
            <div class="field">
              <label>AM Year <span class="required">*</span></label>
              <input v-model.number="form.am_year" type="number" required min="1" max="6001" placeholder="e.g. 1" />
              <span class="field-hint">Anno Mundi (year since Creation)</span>
            </div>
            <div class="field">
              <label>BC / AD Year</label>
              <input v-model.number="form.bc_ad_year" type="number" placeholder="e.g. 3925" />
            </div>
            <div class="field field-sm">
              <label>Era</label>
              <select v-model.number="form.is_bc">
                <option :value="1">BC</option>
                <option :value="0">AD</option>
              </select>
            </div>
          </div>

          <!-- Date fields -->
          <div class="field-row">
            <div class="field">
              <label>Hebrew Month</label>
              <select v-model="form.month_name">
                <option value="">— none —</option>
                <option v-for="m in HEBREW_MONTHS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="field field-sm">
              <label>Day</label>
              <input v-model.number="form.day_number" type="number" min="1" max="30" placeholder="e.g. 1" />
            </div>
          </div>

          <!-- Jubilee / Shemittah flags -->
          <div class="field-row checkboxes">
            <label class="checkbox-label">
              <input type="checkbox" :checked="form.is_jubilee === 1" @change="(e) => form.is_jubilee = (e.target as HTMLInputElement).checked ? 1 : 0" />
              <span class="cb-text jubilee-text">Jubilee Year</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" :checked="form.is_shemittah === 1" @change="(e) => form.is_shemittah = (e.target as HTMLInputElement).checked ? 1 : 0" />
              <span class="cb-text shemittah-text">Shemittah Year</span>
            </label>
          </div>

          <!-- Jubilee Reference -->
          <div class="field">
            <label>Jubilee Reference</label>
            <input v-model="form.jubilee_ref" type="text" placeholder="e.g. Y1 S1 J1 O1" />
            <span class="field-hint">Format: Y{year} S{shemittah} J{jubilee} O{onah}</span>
          </div>

          <!-- Category -->
          <div class="field-row">
            <div class="field">
              <label>Category</label>
              <select v-model="form.category">
                <option value="">— none —</option>
                <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
              </select>
            </div>
            <div class="field field-sm">
              <label>Sort Order</label>
              <input v-model.number="form.sort_order" type="number" placeholder="e.g. 10" />
            </div>
          </div>

          <!-- Bible Reference -->
          <div class="field">
            <label>Bible Reference</label>
            <input v-model="form.bible_ref" type="text" placeholder="e.g. Genesis 1:1" />
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="submit" class="save-btn" :disabled="saving">
              <svg v-if="!saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <div v-else class="spinner-sm"></div>
              {{ saving ? 'Saving…' : isNew ? 'Create Event' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deletingEvent" class="modal-backdrop" @click.self="deletingEvent = null">
      <div class="modal">
        <h3>Delete Event</h3>
        <p>Delete <strong>{{ deletingEvent.title }}</strong>? This cannot be undone.</p>
        <div class="modal-actions">
          <button class="modal-cancel" @click="deletingEvent = null">Cancel</button>
          <button class="modal-confirm" @click="doDelete" :disabled="saving">
            {{ saving ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getAllTimelineEvents,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from '@/api/timelineEvents';
import type { TimelineEvent, TimelineEventInsert } from '@/utils/collectionReferences';

const HEBREW_MONTHS = ['Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar II'];

const CATEGORIES = [
  { key: 'creation',   label: 'Creation' },
  { key: 'patriarchs', label: 'Patriarchs' },
  { key: 'kings',      label: 'Kings' },
  { key: 'covenant',   label: 'Covenant' },
  { key: 'exodus',     label: 'Exodus' },
  { key: 'temple',     label: 'Temple' },
  { key: 'judgment',   label: 'Judgment' },
  { key: 'messiah',    label: 'Messiah' },
  { key: 'israel',     label: 'Israel' },
  { key: 'prophecy',   label: 'Prophecy' },
];

const CATEGORY_COLORS: Record<string, string> = {
  creation: '#059669', patriarchs: '#d97706', kings: '#7c3aed',
  covenant: '#0891b2', exodus: '#ea580c', temple: '#9333ea',
  judgment: '#be123c', messiah: '#1d4ed8', israel: '#0369a1', prophecy: '#b45309',
};

const emptyForm = (): TimelineEventInsert => ({
  title: '', description: '', am_year: 1, bc_ad_year: undefined, is_bc: 1,
  month_name: '', day_number: undefined, is_shemittah: 0, is_jubilee: 0,
  jubilee_ref: '', category: '', bible_ref: '', sort_order: undefined,
});

const events = ref<TimelineEvent[]>([]);
const loading = ref(true);
const saving = ref(false);
const searchQuery = ref('');
const editingEvent = ref<TimelineEvent | null>(null);
const deletingEvent = ref<TimelineEvent | null>(null);
const isNew = ref(false);
const form = ref<TimelineEventInsert>(emptyForm());
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const filteredList = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return events.value;
  return events.value.filter(e =>
    e.title.toLowerCase().includes(q) ||
    (e.category ?? '').toLowerCase().includes(q) ||
    String(e.am_year).includes(q)
  );
});

function getCategoryColor(category: string | null): string {
  return CATEGORY_COLORS[category ?? ''] ?? '#6b7280';
}

function formatYear(ev: TimelineEvent): string {
  if (ev.bc_ad_year === null) return '';
  return ev.is_bc ? `${ev.bc_ad_year} BC` : `AD ${ev.bc_ad_year}`;
}

function startNew() {
  isNew.value = true;
  editingEvent.value = null;
  form.value = emptyForm();
}

function startEdit(ev: TimelineEvent) {
  isNew.value = false;
  editingEvent.value = ev;
  form.value = {
    title: ev.title,
    description: ev.description ?? '',
    am_year: ev.am_year,
    bc_ad_year: ev.bc_ad_year ?? undefined,
    is_bc: ev.is_bc,
    month_name: ev.month_name ?? '',
    day_number: ev.day_number ?? undefined,
    is_shemittah: ev.is_shemittah,
    is_jubilee: ev.is_jubilee,
    jubilee_ref: ev.jubilee_ref ?? '',
    category: ev.category ?? '',
    bible_ref: ev.bible_ref ?? '',
    sort_order: ev.sort_order ?? undefined,
  };
}

function cancelEdit() {
  editingEvent.value = null;
  isNew.value = false;
}

function notify(message: string, type: 'success' | 'error') {
  notification.value = { message, type };
  setTimeout(() => { notification.value = null; }, 3000);
}

async function saveEvent() {
  saving.value = true;
  try {
    const payload: TimelineEventInsert = {
      ...form.value,
      description: form.value.description || undefined,
      month_name: form.value.month_name || undefined,
      jubilee_ref: form.value.jubilee_ref || undefined,
      category: form.value.category || undefined,
      bible_ref: form.value.bible_ref || undefined,
    };
    if (isNew.value) {
      await createTimelineEvent(payload);
      notify('Event created successfully', 'success');
    } else if (editingEvent.value) {
      await updateTimelineEvent(editingEvent.value.event_id, payload);
      notify('Event updated successfully', 'success');
    }
    events.value = await getAllTimelineEvents();
    if (isNew.value) {
      isNew.value = false;
      editingEvent.value = events.value[events.value.length - 1] ?? null;
    }
  } catch {
    notify('Failed to save event. Please try again.', 'error');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(ev: TimelineEvent) {
  deletingEvent.value = ev;
}

async function doDelete() {
  if (!deletingEvent.value) return;
  saving.value = true;
  try {
    await deleteTimelineEvent(deletingEvent.value.event_id);
    notify('Event deleted', 'success');
    if (editingEvent.value?.event_id === deletingEvent.value.event_id) {
      editingEvent.value = null;
      isNew.value = false;
    }
    events.value = await getAllTimelineEvents();
  } catch {
    notify('Failed to delete event.', 'error');
  } finally {
    saving.value = false;
    deletingEvent.value = null;
  }
}

onMounted(async () => {
  try {
    events.value = await getAllTimelineEvents();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.manage-timeline {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
}

/* ── Header ─────────────────────────────────────────────────────── */
.mte-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.mte-header h1 { font-size: 1.5rem; margin: 0; }
.header-actions { display: flex; gap: 0.75rem; align-items: center; }

.preview-link, .back-link {
  color: white;
  text-decoration: none;
  padding: 0.4rem 0.9rem;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.2s;
}
.preview-link:hover, .back-link:hover { background: rgba(255,255,255,0.3); }

/* ── Notification ────────────────────────────────────────────────── */
.notification {
  padding: 0.75rem 2rem;
  font-size: 0.9rem;
  font-weight: 600;
}
.notification.success { background: #d1fae5; color: #065f46; }
.notification.error   { background: #fee2e2; color: #991b1b; }
.notif-fade-enter-active, .notif-fade-leave-active { transition: all 0.25s ease; }
.notif-fade-enter-from, .notif-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── Body layout ─────────────────────────────────────────────────── */
.mte-body {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
}

/* ── Event list ──────────────────────────────────────────────────── */
.event-list-panel {
  width: 340px;
  min-width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-toolbar {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  gap: 0.5rem;
}
.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: #667eea; }

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.85rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.add-btn:hover { background: #5568d3; }

.list-loading, .list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.event-list { flex: 1; overflow-y: auto; }

.event-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.1s;
  gap: 0.5rem;
}
.event-row:hover  { background: #f9fafb; }
.event-row.active { background: #eff6ff; border-left: 3px solid #667eea; }

.row-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.row-cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.row-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.row-year { font-size: 0.72rem; color: #6b7280; }

.row-badges { display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0; }
.mini-badge {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.1rem 0.35rem;
  border-radius: 6px;
}
.mini-badge.jubilee   { background: #fef3c7; color: #92400e; }
.mini-badge.shemittah { background: #ede9fe; color: #5b21b6; }

.delete-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}
.delete-btn:hover { color: #dc2626; background: #fee2e2; }

/* ── Form panel ──────────────────────────────────────────────────── */
.event-form-panel {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.form-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #9ca3af;
  gap: 0.75rem;
  text-align: center;
}
.placeholder-icon { font-size: 2.5rem; }
.form-placeholder p { font-size: 0.9rem; }

.form-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.form-title-row h2 { font-size: 1.2rem; font-weight: 700; color: #111827; margin: 0; }

.cancel-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  color: #374151;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s;
}
.cancel-btn:hover { background: #e5e7eb; }

.event-form { display: flex; flex-direction: column; gap: 1rem; max-width: 680px; }

.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.required { color: #dc2626; }
.field-hint { font-size: 0.72rem; color: #9ca3af; }

.field input, .field select, .field textarea {
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1f2937;
  outline: none;
  transition: border-color 0.15s;
  background: white;
  font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: #667eea; }
.field textarea { resize: vertical; min-height: 80px; }

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.field-row.checkboxes { align-items: center; gap: 1.5rem; }
.field-sm { max-width: 120px; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
  cursor: pointer;
}
.cb-text { font-size: 0.88rem; font-weight: 600; }
.jubilee-text   { color: #92400e; }
.shemittah-text { color: #5b21b6; }

.form-actions { padding-top: 0.5rem; }
.save-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.save-btn:hover:not(:disabled) { background: #5568d3; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Spinner ─────────────────────────────────────────────────────── */
.spinner {
  width: 20px; height: 20px;
  border: 2.5px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Delete modal ────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.modal p { color: #4b5563; font-size: 0.9rem; margin: 0 0 1.25rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.modal-cancel {
  padding: 0.5rem 1.25rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.modal-confirm {
  padding: 0.5rem 1.25rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .mte-body { flex-direction: column; }
  .event-list-panel { width: 100%; border-right: none; border-bottom: 1px solid #e5e7eb; max-height: 280px; }
  .event-form-panel { padding: 1rem; }
  .field-row { grid-template-columns: 1fr; }
  .field-sm { max-width: none; }
}
</style>
