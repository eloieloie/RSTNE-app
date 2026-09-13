<template>
  <div class="manage-timeline admin-page">
    <header class="mte-header admin-page-header">
      <h1 class="admin-title">📜 Timeline Events</h1>
      <div class="header-actions">
        <router-link to="/timeline" class="preview-link admin-btn admin-btn--secondary" target="_blank">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Preview Timeline
        </router-link>
        <router-link to="/admin" class="admin-back-link">← Admin</router-link>
      </div>
    </header>

    <!-- Notification -->
    <AnimatePresence>
      <motion.div
        v-if="notification"
        :class="['notification', notification.type]"
        :initial="prefersReducedMotion ? false : { opacity: 0, y: -8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ duration: prefersReducedMotion ? 0 : 0.25 }"
      >
        {{ notification.message }}
      </motion.div>
    </AnimatePresence>

    <div class="mte-body">
      <!-- Left: event list -->
      <div class="event-list-panel">
        <div class="list-toolbar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search events…"
            class="search-input admin-input"
          />
          <button class="add-btn admin-btn admin-btn--primary" @click="startNew">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Event
          </button>
        </div>

        <div v-if="loading" class="list-loading admin-state">
          <div class="spinner"></div> Loading…
        </div>
        <div v-else-if="filteredList.length === 0" class="list-empty admin-state">
          No events found.
        </div>
        <div v-else class="event-list admin-list">
          <div
            v-for="ev in filteredList"
            :key="ev.event_id"
            class="event-row admin-list-item"
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
              <span v-if="ev.is_jubilee" class="mini-badge jubilee admin-badge admin-badge--warning">J</span>
              <span v-if="ev.is_shemittah" class="mini-badge shemittah admin-badge admin-badge--info">S</span>
              <button class="delete-btn admin-btn admin-btn--danger admin-btn--sm" @click.stop="confirmDelete(ev)" title="Delete event">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: form -->
      <div class="event-form-panel">
        <div v-if="!editingEvent && !isNew" class="form-placeholder admin-state">
          <div class="placeholder-icon">📜</div>
          <p>Select an event to edit, or click <strong>Add Event</strong> to create a new one.</p>
        </div>

        <form v-else @submit.prevent="saveEvent" class="event-form">
          <div class="form-title-row">
            <h2>{{ isNew ? 'New Event' : 'Edit Event' }}</h2>
            <button type="button" class="cancel-btn admin-btn admin-btn--secondary admin-btn--sm" @click="cancelEdit">Cancel</button>
          </div>

          <!-- Title -->
          <div class="field admin-form-group">
            <label class="admin-label">Title <span class="required">*</span></label>
            <input v-model="form.title" type="text" required placeholder="e.g. Creation, Nisan 1" class="admin-input" />
          </div>

          <!-- Description -->
          <div class="field admin-form-group">
            <label class="admin-label">Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Brief description of the event…" class="admin-textarea"></textarea>
          </div>

          <!-- Year fields -->
          <div class="field-row">
            <div class="field admin-form-group">
              <label class="admin-label">AM Year <span class="required">*</span></label>
              <input v-model.number="form.am_year" type="number" required min="1" max="6001" placeholder="e.g. 1" class="admin-input" />
              <span class="field-hint">Anno Mundi (year since Creation)</span>
            </div>
            <div class="field admin-form-group">
              <label class="admin-label">BC / AD Year</label>
              <input v-model.number="form.bc_ad_year" type="number" placeholder="e.g. 3925" class="admin-input" />
            </div>
            <div class="field admin-form-group field-sm">
              <label class="admin-label">Era</label>
              <select v-model.number="form.is_bc" class="admin-select">
                <option :value="1">BC</option>
                <option :value="0">AD</option>
              </select>
            </div>
          </div>

          <!-- Date fields -->
          <div class="field-row">
            <div class="field admin-form-group">
              <label class="admin-label">Hebrew Month</label>
              <select v-model="form.month_name" class="admin-select">
                <option value="">— none —</option>
                <option v-for="m in HEBREW_MONTHS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="field admin-form-group field-sm">
              <label class="admin-label">Day</label>
              <input v-model.number="form.day_number" type="number" min="1" max="30" placeholder="e.g. 1" class="admin-input" />
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
          <div class="field admin-form-group">
            <label class="admin-label">Jubilee Reference</label>
            <input v-model="form.jubilee_ref" type="text" placeholder="e.g. Y1 S1 J1 O1" class="admin-input" />
            <span class="field-hint">Format: Y{year} S{shemittah} J{jubilee} O{onah}</span>
          </div>

          <!-- Category -->
          <div class="field-row">
            <div class="field admin-form-group">
              <label class="admin-label">Category</label>
              <select v-model="form.category" class="admin-select">
                <option value="">— none —</option>
                <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
              </select>
            </div>
            <div class="field admin-form-group field-sm">
              <label class="admin-label">Sort Order</label>
              <input v-model.number="form.sort_order" type="number" placeholder="e.g. 10" class="admin-input" />
            </div>
          </div>

          <!-- Bible Reference -->
          <div class="field admin-form-group">
            <label class="admin-label">Bible Reference</label>
            <input v-model="form.bible_ref" type="text" placeholder="e.g. Genesis 1:1" class="admin-input" />
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="submit" class="save-btn admin-btn admin-btn--primary" :disabled="saving">
              <svg v-if="!saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <div v-else class="spinner-sm"></div>
              {{ saving ? 'Saving…' : isNew ? 'Create Event' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <AnimatePresence>
      <motion.div
        v-if="deletingEvent"
        class="modal-backdrop admin-modal-overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="overlayFade"
        @click.self="deletingEvent = null"
      >
        <motion.div
          class="admin-modal"
          :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :exit="{ opacity: 0, scale: 0.94, y: 8 }"
          :transition="tooltipSpring"
        >
          <h3>Delete Event</h3>
          <p>Delete <strong>{{ deletingEvent.title }}</strong>? This cannot be undone.</p>
          <div class="modal-actions admin-modal-actions">
            <motion.button class="modal-cancel admin-btn admin-btn--secondary" :while-tap="tapScale" @click="deletingEvent = null">Cancel</motion.button>
            <motion.button class="modal-confirm admin-btn admin-btn--danger" :while-tap="tapScale" @click="doDelete" :disabled="saving">
              {{ saving ? 'Deleting…' : 'Delete' }}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import { useMotionPresets } from '@/composables/useMotionPresets';
import {
  getAllTimelineEvents,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from '@/api/timelineEvents';
import type { TimelineEvent, TimelineEventInsert } from '@/utils/collectionReferences';

const { prefersReducedMotion, tooltipSpring, tapScale, overlayFade } = useMotionPresets();

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
/* Layout, colors, fonts, buttons, form fields, list items, badges, and modal
   come from the shared .admin-page / .admin-btn / .admin-list / .admin-badge /
   .admin-form-group / .admin-modal classes (src/assets/admin-ui.css). Only this
   page's two-panel split layout and category/jubilee accent colors live here. */

.manage-timeline {
  /* Fixed height (not min-height) so .mte-body's flex:1 + min-height:0 can
     actually cap the two-panel body at the viewport and let the event list
     scroll internally — a min-height here lets 230+ events stretch the
     whole page instead (pre-existing bug, made slightly worse by this
     refactor's taller .admin-list-item padding; fixed while touching this file). */
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ─────────────────────────────────────────────────────── */
.header-actions { display: flex; gap: var(--space-3); align-items: center; }

/* ── Notification ────────────────────────────────────────────────── */
.notification {
  padding: var(--space-3) var(--space-8);
  font-size: var(--font-size-base);
  font-weight: 600;
}
.notification.success { background: color-mix(in srgb, var(--color-success) 16%, transparent); color: var(--color-success); }
.notification.error   { background: color-mix(in srgb, var(--color-error) 16%, transparent);   color: var(--color-error); }

/* ── Body layout (two-panel split — page-specific) ──────────────────── */
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
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-toolbar {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-2);
}
.search-input { flex: 1; }

.list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.event-list { padding: var(--space-4); overflow-y: auto; flex: 1; }

.event-row {
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.event-row:hover  { background: var(--color-background-alt); }
.event-row.active { background: var(--color-primary-light); border-left: 3px solid var(--color-primary); }

.row-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.row-cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.row-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.row-year { font-size: var(--font-size-xs); color: var(--color-muted-foreground); }

.row-badges { display: flex; align-items: center; gap: var(--space-1); flex-shrink: 0; }
.mini-badge { padding: 2px var(--space-2); font-weight: 800; }

/* ── Form panel ──────────────────────────────────────────────────── */
.event-form-panel {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6) var(--space-8);
}

.form-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: var(--space-3);
}
.placeholder-icon { font-size: 2.5rem; }

.form-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.form-title-row h2 { font-size: var(--font-size-lg); font-weight: 700; margin: 0; }

.event-form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 680px; }

.required { color: var(--color-error); }
.field-hint { font-size: var(--font-size-xs); color: var(--color-muted-foreground); }

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.field-row.checkboxes { align-items: center; gap: var(--space-6); }
.field-sm { max-width: 120px; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.cb-text { font-size: var(--font-size-base); font-weight: 600; }
.jubilee-text   { color: var(--color-warning); }
.shemittah-text { color: var(--color-primary); }

.form-actions { padding-top: var(--space-2); }

/* ── Spinner ─────────────────────────────────────────────────────── */
.spinner {
  width: 20px; height: 20px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid color-mix(in srgb, var(--color-primary-foreground) 40%, transparent);
  border-top-color: var(--color-primary-foreground);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .mte-body { flex-direction: column; }
  .event-list-panel { width: 100%; border-right: none; border-bottom: 1px solid var(--color-border); max-height: 280px; }
  .event-form-panel { padding: var(--space-4); }
  .field-row { grid-template-columns: 1fr; }
  .field-sm { max-width: none; }
}
</style>
