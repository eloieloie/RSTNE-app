<template>
  <div class="timeline-page" :class="{ 'broadcast-mode': settings.broadcastMode }">
    <!-- Header -->
    <header class="tl-header">
      <div class="tl-header-left">
        <router-link to="/" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Home
        </router-link>
        <div class="tl-title-group">
          <h1 class="tl-title">
            <span class="tl-title-icon">📜</span>
            Biblical Timeline
          </h1>
          <p class="tl-subtitle">6,000 Years of Sacred History</p>
        </div>
      </div>
      <div class="tl-header-right">
        <motion.button class="settings-btn" :while-tap="tapScale" @click="showSettingsModal = true" title="Settings" aria-label="Open settings">
          <span class="settings-label">SE</span>
        </motion.button>
        <motion.div class="legend-toggle" :while-tap="tapScale" @click="showLegend = !showLegend">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span class="legend-toggle-label">Legend</span>
        </motion.div>
        <motion.button class="filter-icon-btn" :while-tap="tapScale" @click="showFilters = !showFilters" :class="{ active: activeFiltersCount > 0 }" title="Filters &amp; Era Navigation">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
          <span class="filter-icon-label">Filters</span>
          <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
        </motion.button>
      </div>
    </header>

    <!-- Legend panel -->
    <AnimatePresence>
      <motion.div
        v-if="showLegend"
        class="legend-panel"
        :initial="prefersReducedMotion ? false : { opacity: 0, y: -6 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
        :transition="{ duration: prefersReducedMotion ? 0 : 0.2 }"
      >
        <div class="legend-grid">
          <div v-for="cat in CATEGORIES" :key="cat.key" class="legend-item">
            <span class="legend-dot" :style="{ background: cat.color }"></span>
            <span>{{ cat.label }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot jubilee-dot"></span>
            <span>Jubilee Year</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot shemittah-dot"></span>
            <span>Shemittah Year</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>

    <!-- Loading / Error -->
    <div v-if="loading" class="tl-loading">
      <div class="spinner"></div>
      <span>Loading timeline…</span>
    </div>
    <div v-else-if="error" class="tl-error">{{ error }}</div>

    <!-- Vertical Timeline -->
    <main v-else class="tl-main">
      <div class="tl-container">

        <template v-for="era in ERAS" :key="era.label">
          <template v-if="eventsForEra(era).length > 0">

            <!-- Era section header (sticky) -->
            <div
              class="era-section-header"
              :style="{ '--era-color': era.color, '--era-bg': era.bgColor }"
              :data-era="era.label"
            >
              <div class="era-header-inner">
                <span class="era-header-label">{{ era.label }}</span>
                <span class="era-header-range">AM {{ era.startAM.toLocaleString() }} – {{ era.endAM.toLocaleString() }}</span>
                <span class="era-header-count">{{ eventsForEra(era).length }}</span>
              </div>
            </div>

            <!-- Events in era -->
            <div
              v-for="ev in eventsForEra(era)"
              :key="ev.event_id"
              class="tl-item"
            >
              <!-- Year column -->
              <div class="item-year-col">
                <div class="item-am">AM {{ ev.am_year }}</div>
                <div class="item-bcad">{{ formatYear(ev) }}</div>
              </div>

              <!-- Spine -->
              <div class="item-spine">
                <div
                  class="spine-dot"
                  :class="{ 'is-jubilee': ev.is_jubilee, 'is-shemittah': ev.is_shemittah, 'is-open': expandedEventId === ev.event_id }"
                  :style="{ '--dot-color': getCategoryColor(ev.category) }"
                ></div>
                <div class="spine-line"></div>
              </div>

              <!-- Card -->
              <div class="item-card-col">
                <div
                  class="tl-card"
                  :class="{ expanded: expandedEventId === ev.event_id }"
                  :style="{ '--cat-color': getCategoryColor(ev.category) }"
                  @click="toggleExpand(ev)"
                >
                  <div class="card-top">
                    <div class="card-main">
                      <div class="card-badges">
                        <span class="cat-badge" :style="{ background: getCategoryColor(ev.category) }">{{ getCategoryLabel(ev.category) }}</span>
                        <span v-if="ev.is_jubilee" class="spec-badge jubilee-badge">Jubilee</span>
                        <span v-else-if="ev.is_shemittah" class="spec-badge shemittah-badge">Shemittah</span>
                      </div>
                      <div class="card-title">{{ ev.title }}</div>
                    </div>
                    <div class="expand-chevron" :class="{ open: expandedEventId === ev.event_id }">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>

                  <!-- Expanded details -->
                  <AnimatePresence>
                  <motion.div
                    v-if="expandedEventId === ev.event_id"
                    class="card-details"
                    :initial="prefersReducedMotion ? false : { opacity: 0, y: -6 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0, y: -6 }"
                    :transition="{ duration: prefersReducedMotion ? 0 : 0.2 }"
                  >
                      <div class="detail-years-row">
                        <div class="detail-year-block">
                          <div class="dy-value am">AM {{ ev.am_year }}</div>
                          <div class="dy-label">Anno Mundi</div>
                        </div>
                        <div class="dy-sep">·</div>
                        <div class="detail-year-block">
                          <div class="dy-value bc">{{ formatYearFull(ev) }}</div>
                          <div class="dy-label">{{ ev.is_bc ? 'Before Messiah' : 'After Messiah' }}</div>
                        </div>
                        <template v-if="ev.month_name">
                          <div class="dy-sep">·</div>
                          <div class="detail-year-block">
                            <div class="dy-value heb">{{ ev.month_name }}{{ ev.day_number ? ' ' + ev.day_number : '' }}</div>
                            <div class="dy-label">Hebrew Date</div>
                          </div>
                        </template>
                      </div>

                      <p v-if="ev.description" class="detail-desc">{{ ev.description }}</p>

                      <div class="detail-meta-row">
                        <div v-if="ev.jubilee_ref" class="meta-chip">
                          <span class="meta-chip-label">Jubilee Ref</span>
                          <span class="meta-chip-val jubilee-val">{{ ev.jubilee_ref }}</span>
                        </div>
                        <div v-if="ev.bible_ref" class="meta-chip">
                          <span class="meta-chip-label">Scripture</span>
                          <span class="meta-chip-val bible-val">{{ ev.bible_ref }}</span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </template>
        </template>

      </div>
    </main>

    <div v-if="settings.broadcastMode" class="timeline-broadcast-panel" aria-hidden="true"></div>

    <Settings :is-open="showSettingsModal" @close="showSettingsModal = false" />

    <!-- Empty state -->
    <div v-if="!loading && !error && filteredEvents.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No events match the current filter.</p>
      <motion.button :while-tap="tapScale" @click="resetFilters" class="reset-btn">Reset Filters</motion.button>
    </div>

    <!-- Filter Modal -->
    <AnimatePresence>
      <motion.div
        v-if="showFilters"
        class="filter-modal-overlay"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="overlayFade"
        @click.self="showFilters = false"
      >
        <motion.div
          class="filter-modal"
          :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: -8 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :exit="{ opacity: 0, scale: 0.95, y: -8 }"
          :transition="tooltipSpring"
        >
          <div class="filter-modal-header">
            <h3 class="filter-modal-title">Filters &amp; Navigation</h3>
            <motion.button class="filter-modal-close" :while-tap="tapScale" @click="showFilters = false">✕</motion.button>
          </div>
          <div class="filter-modal-body">
            <div class="filter-section">
              <label class="filter-label">Navigate to Era</label>
              <select class="filter-select" @change="onEraSelect($event)" :value="activeEra ?? ''">
                <option value="">— Select Era —</option>
                <option v-for="era in ERAS" :key="era.label" :value="era.label">{{ era.label }}</option>
              </select>
            </div>
            <div class="filter-section">
              <label class="filter-label">Filter by Category</label>
              <select class="filter-select" v-model="activeCategory">
                <option :value="null">All Events</option>
                <option v-for="cat in CATEGORIES" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
              </select>
            </div>
            <div class="filter-section">
              <label class="filter-label">Special Events</label>
              <div class="filter-toggles">
                <motion.button class="filter-toggle-chip" :class="{ active: showOnlyJubilee }" :while-tap="tapScale" @click="showOnlyJubilee = !showOnlyJubilee">Jubilee Years</motion.button>
                <motion.button class="filter-toggle-chip" :class="{ active: showOnlyShemittah }" :while-tap="tapScale" @click="showOnlyShemittah = !showOnlyShemittah">Shemittah Years</motion.button>
              </div>
            </div>
          </div>
          <div class="filter-modal-footer">
            <motion.button class="reset-filters-btn" :while-tap="tapScale" @click="resetFilters">Reset All</motion.button>
            <motion.button class="apply-filters-btn" :while-tap="tapScale" @click="showFilters = false">Apply</motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import { getAllTimelineEvents } from '@/api/timelineEvents';
import Settings from '@/components/Settings.vue';
import { useReaderSettings } from '@/composables/useReaderSettings';
import { useMotionPresets } from '@/composables/useMotionPresets';
import type { TimelineEvent } from '@/utils/collectionReferences';

const { prefersReducedMotion, tooltipSpring, tapScale, overlayFade } = useMotionPresets();

const ERAS = [
  { label: 'Creation',   startAM: 1,    endAM: 1656, color: '#059669', bgColor: 'rgba(5,150,105,0.07)' },
  { label: 'Flood',      startAM: 1656, endAM: 1948, color: '#0891b2', bgColor: 'rgba(8,145,178,0.07)' },
  { label: 'Patriarchs', startAM: 1948, endAM: 2448, color: '#d97706', bgColor: 'rgba(217,119,6,0.07)' },
  { label: 'Exodus',     startAM: 2448, endAM: 2935, color: '#ea580c', bgColor: 'rgba(234,88,12,0.07)' },
  { label: 'Temple',     startAM: 2935, endAM: 3338, color: '#7c3aed', bgColor: 'rgba(124,58,237,0.07)' },
  { label: 'Captivity',  startAM: 3338, endAM: 3957, color: '#be123c', bgColor: 'rgba(190,18,60,0.07)' },
  { label: 'Messiah',    startAM: 3957, endAM: 5873, color: '#1d4ed8', bgColor: 'rgba(29,78,216,0.07)' },
  { label: 'Modern',     startAM: 5873, endAM: 6001, color: '#b45309', bgColor: 'rgba(180,83,9,0.07)' },
];

const CATEGORIES = [
  { key: 'creation',   label: 'Creation',   color: '#059669' },
  { key: 'patriarchs', label: 'Patriarchs', color: '#d97706' },
  { key: 'kings',      label: 'Kings',      color: '#7c3aed' },
  { key: 'covenant',   label: 'Covenant',   color: '#0891b2' },
  { key: 'exodus',     label: 'Exodus',     color: '#ea580c' },
  { key: 'temple',     label: 'Temple',     color: '#9333ea' },
  { key: 'judgment',   label: 'Judgment',   color: '#be123c' },
  { key: 'messiah',    label: 'Messiah',    color: '#1d4ed8' },
  { key: 'israel',     label: 'Israel',     color: '#0369a1' },
  { key: 'prophecy',   label: 'Prophecy',   color: '#b45309' },
];

const events = ref<TimelineEvent[]>([]);
const loading = ref(true);
const error = ref('');
const expandedEventId = ref<number | null>(null);
const activeCategory = ref<string | null>(null);
const showOnlyJubilee = ref(false);
const showOnlyShemittah = ref(false);
const activeEra = ref<string | null>(null);
const showLegend = ref(false);
const showFilters = ref(false);
const showSettingsModal = ref(false);
const { settings } = useReaderSettings();

const filteredEvents = computed(() => {
  let evs = events.value;
  if (activeCategory.value) evs = evs.filter(e => e.category === activeCategory.value);
  if (showOnlyJubilee.value)  evs = evs.filter(e => e.is_jubilee === 1);
  if (showOnlyShemittah.value) evs = evs.filter(e => e.is_shemittah === 1);
  return evs.sort((a, b) => a.am_year - b.am_year);
});

function eventsForEra(era: typeof ERAS[0]): TimelineEvent[] {
  const isLast = era === ERAS[ERAS.length - 1];
  return filteredEvents.value.filter(ev =>
    ev.am_year >= era.startAM && (isLast ? ev.am_year <= era.endAM : ev.am_year < era.endAM)
  );
}

const activeFiltersCount = computed(() => {
  let count = 0;
  if (activeCategory.value) count++;
  if (showOnlyJubilee.value) count++;
  if (showOnlyShemittah.value) count++;
  return count;
});

function toggleExpand(ev: TimelineEvent) {
  expandedEventId.value = expandedEventId.value === ev.event_id ? null : ev.event_id;
}

function getCategoryColor(category: string | null): string {
  return CATEGORIES.find(c => c.key === category)?.color ?? '#6b7280';
}

function getCategoryLabel(category: string | null): string {
  return CATEGORIES.find(c => c.key === category)?.label ?? 'General';
}

function formatYear(ev: TimelineEvent): string {
  const yr = ev.bc_ad_year;
  if (yr === null) return `AM ${ev.am_year}`;
  return ev.is_bc ? `${yr} BC` : `AD ${yr}`;
}

function formatYearFull(ev: TimelineEvent): string {
  if (ev.bc_ad_year === null) return '—';
  return ev.is_bc ? `${ev.bc_ad_year} BC` : `AD ${ev.bc_ad_year}`;
}

function onEraSelect(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  if (!val) return;
  activeEra.value = val;
  showFilters.value = false;
  setTimeout(() => {
    const el = document.querySelector(`[data-era="${val}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

function resetFilters() {
  activeCategory.value = null;
  showOnlyJubilee.value = false;
  showOnlyShemittah.value = false;
}

watch(filteredEvents, () => {
  if (expandedEventId.value && !filteredEvents.value.find(e => e.event_id === expandedEventId.value)) {
    expandedEventId.value = null;
  }
});

onMounted(async () => {
  try {
    events.value = await getAllTimelineEvents();
  } catch (e) {
    error.value = 'Failed to load timeline events. Please try again.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ── Page layout ─────────────────────────────────────────────────── */
.timeline-page {
  min-height: 100vh;
  background: #f8f6f0;
  display: flex;
  flex-direction: column;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.timeline-page.broadcast-mode {
  padding-right: max(30vw, 320px);
}

.timeline-broadcast-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: max(30vw, 320px);
  height: 100vh;
  border-left: 1px solid #e8e8e8;
  background: linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%);
  pointer-events: none;
  z-index: 1;
}

/* ── Header ─────────────────────────────────────────────────────── */
.tl-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(135deg, #1a0a00 0%, #3b1a00 50%, #1a0a00 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  min-height: 56px;
}

.tl-header-left { display: flex; align-items: center; gap: 1rem; }
.tl-header-right { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 0.45rem;
  border-radius: 6px;
  border: 1.5px solid #c9c9c9;
  background: #fff;
  color: #000;
  cursor: pointer;
  transition: all 0.15s ease;
}

.settings-btn:hover {
  border-color: #9fa7b0;
  background: #f6f8fa;
}

.settings-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #000;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 0.35rem 0.65rem;
  border-radius: 7px;
  background: rgba(255,255,255,0.1);
  transition: background 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.back-link:hover { background: rgba(255,255,255,0.2); color: white; }

.tl-title-group { display: flex; flex-direction: column; gap: 0.05rem; }

.tl-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.tl-title-icon { font-size: 1.1rem; }

.tl-subtitle {
  color: rgba(255,255,255,0.55);
  font-size: 0.75rem;
  margin: 0;
}

.legend-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.35rem 0.65rem;
  border-radius: 7px;
  background: rgba(255,255,255,0.1);
  transition: background 0.2s;
  white-space: nowrap;
}
.legend-toggle:hover { background: rgba(255,255,255,0.2); }

.filter-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.35rem 0.65rem;
  border-radius: 7px;
  background: rgba(255,255,255,0.1);
  border: none;
  transition: background 0.2s;
  white-space: nowrap;
}
.filter-icon-btn:hover { background: rgba(255,255,255,0.2); color: white; }
.filter-icon-btn.active { background: rgba(255,255,255,0.22); color: white; }
.filter-count-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.58rem;
  font-weight: 700;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #1a0a00;
}

/* ── Legend ─────────────────────────────────────────────────────── */
.legend-panel {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.65rem 1.5rem;
}
.legend-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  max-width: 860px;
  margin: 0 auto;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #374151;
}
.legend-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
}
.jubilee-dot { background: #f59e0b; border: 2px solid #d97706; }
.shemittah-dot { background: #8b5cf6; border: 2px solid #7c3aed; }

/* ── Loading / Error ─────────────────────────────────────────────── */
.tl-loading, .tl-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #6b7280;
}
.spinner {
  width: 24px; height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #8B4513;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Main ────────────────────────────────────────────────────────── */
.tl-main { flex: 1; }

.tl-container {
  max-width: 820px;
  margin: 0 auto;
  padding: 0.5rem 1.25rem 4rem;
}

/* ── Era section header ─────────────────────────────────────────── */
.era-section-header {
  position: sticky;
  top: 56px;
  z-index: 20;
  background: #f8f6f0;
  padding: 0.75rem 0 0.4rem;
  margin-top: 0.5rem;
}

.era-header-inner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.9rem;
  background: var(--era-bg);
  border-left: 4px solid var(--era-color);
  border-radius: 0 8px 8px 0;
}

.era-header-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--era-color);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.era-header-range {
  font-size: 0.72rem;
  color: #6b7280;
  font-weight: 500;
}

.era-header-count {
  font-size: 0.68rem;
  color: #9ca3af;
  background: white;
  padding: 0.08rem 0.4rem;
  border-radius: 8px;
  font-weight: 700;
  margin-left: auto;
}

/* ── Timeline item ──────────────────────────────────────────────── */
.tl-item {
  display: grid;
  grid-template-columns: 76px 26px 1fr;
}

/* ── Year column ────────────────────────────────────────────────── */
.item-year-col {
  text-align: right;
  padding: 9px 8px 0 0;
}
.item-am {
  font-size: 0.68rem;
  font-weight: 800;
  color: #8B4513;
  white-space: nowrap;
  line-height: 1.3;
}
.item-bcad {
  font-size: 0.6rem;
  color: #9ca3af;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.3;
}

/* ── Spine ──────────────────────────────────────────────────────── */
.item-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spine-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--dot-color);
  border: 2.5px solid white;
  box-shadow: 0 0 0 2px var(--dot-color);
  flex-shrink: 0;
  margin-top: 9px;
  z-index: 1;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.spine-dot.is-open {
  transform: scale(1.35);
  box-shadow: 0 0 0 3px var(--dot-color), 0 0 10px rgba(0,0,0,0.12);
}

.spine-dot.is-jubilee {
  width: 17px;
  height: 17px;
  background: #f59e0b;
  box-shadow: 0 0 0 2.5px #f59e0b;
  margin-top: 7px;
}

.spine-dot.is-shemittah {
  box-shadow: 0 0 0 2px #8b5cf6;
}

.spine-line {
  flex: 1;
  width: 2px;
  background: #d1d5db;
  min-height: 6px;
}

/* ── Card column ────────────────────────────────────────────────── */
.item-card-col {
  padding: 0 0 10px 9px;
}

.tl-card {
  background: white;
  border: 1.5px solid #e5e7eb;
  border-left: 3px solid var(--cat-color);
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.tl-card:hover {
  border-color: var(--cat-color);
  box-shadow: 0 3px 12px rgba(0,0,0,0.1);
  transform: translateX(2px);
}

.tl-card.expanded {
  border-color: var(--cat-color);
  box-shadow: 0 4px 18px rgba(0,0,0,0.1);
  background: #fafafa;
  transform: none;
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.card-main { flex: 1; min-width: 0; }

.card-badges {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-bottom: 0.18rem;
}

.cat-badge {
  display: inline-block;
  color: white;
  font-size: 0.58rem;
  font-weight: 700;
  padding: 0.08rem 0.42rem;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.spec-badge {
  display: inline-block;
  font-size: 0.58rem;
  font-weight: 700;
  padding: 0.08rem 0.42rem;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.jubilee-badge  { background: #fef3c7; color: #92400e; }
.shemittah-badge { background: #ede9fe; color: #5b21b6; }

.card-title {
  font-size: 0.87rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.35;
}

.expand-chevron {
  color: #9ca3af;
  flex-shrink: 0;
  margin-top: 3px;
  transition: transform 0.25s ease, color 0.2s;
}
.expand-chevron.open {
  transform: rotate(180deg);
  color: var(--cat-color, #6b7280);
}

/* ── Expanded details ───────────────────────────────────────────── */
.card-details {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.detail-years-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.detail-year-block { text-align: center; }

.dy-value { font-size: 0.95rem; font-weight: 800; color: #111827; }
.dy-value.am  { color: #8B4513; }
.dy-value.bc  { color: #1d4ed8; }
.dy-value.heb { color: #059669; }

.dy-label {
  font-size: 0.58rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dy-sep { color: #d1d5db; font-size: 1.2rem; font-weight: 300; }

.detail-desc {
  font-size: 0.86rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.detail-meta-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.meta-chip {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  padding: 0.28rem 0.6rem;
}

.meta-chip-label {
  font-size: 0.58rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.meta-chip-val {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1f2937;
}

.jubilee-val { font-family: monospace; color: #7c3aed; }
.bible-val   { color: #8B4513; }


/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  gap: 1rem;
  color: #6b7280;
}
.empty-icon { font-size: 2.5rem; }
.empty-state p { font-size: 1rem; margin: 0; }
.reset-btn {
  padding: 0.55rem 1.4rem;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.reset-btn:hover { background: #723a10; }

/* ── Legend transition ───────────────────────────────────────────── */

/* ── Filter Modal ────────────────────────────────────────────────── */
.filter-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.filter-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 380px;
  overflow: hidden;
}
.filter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #1a0a00 0%, #3b1a00 100%);
  color: white;
}
.filter-modal-title { font-size: 0.95rem; font-weight: 700; margin: 0; }
.filter-modal-close {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 28px; height: 28px;
  font-size: 0.75rem;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.filter-modal-close:hover { background: rgba(255,255,255,0.28); }
.filter-modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.filter-section { display: flex; flex-direction: column; gap: 0.45rem; }
.filter-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.filter-select {
  width: 100%;
  padding: 0.55rem 2.25rem 0.55rem 0.85rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #1f2937;
  background-color: #f9fafb;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  transition: border-color 0.15s;
}
.filter-select:focus { outline: none; border-color: #8B4513; }
.filter-toggles { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.filter-toggle-chip {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  border: 1.5px solid #e5e7eb;
  background: white;
  color: #374151;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-toggle-chip:hover { border-color: #9ca3af; }
.filter-toggle-chip.active { background: #374151; color: white; border-color: #374151; }
.filter-modal-footer {
  display: flex;
  gap: 0.65rem;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid #f3f4f6;
  justify-content: flex-end;
}
.reset-filters-btn {
  padding: 0.45rem 1rem;
  background: #f3f4f6;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.reset-filters-btn:hover { background: #e5e7eb; color: #374151; }
.apply-filters-btn {
  padding: 0.45rem 1.25rem;
  background: #8B4513;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}
.apply-filters-btn:hover { background: #723a10; }

/* ── Modal transitions ───────────────────────────────────────────── */

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .tl-header { padding: 0.6rem 0.85rem; min-height: 50px; }
  .tl-title { font-size: 1rem; }
  .tl-title-icon { font-size: 0.95rem; }
  .tl-subtitle { display: none; }
  .back-link { font-size: 0.78rem; padding: 0.3rem 0.5rem; }
  .legend-toggle-label { display: none; }
  .legend-toggle { padding: 0.3rem 0.5rem; }
  .filter-icon-label { display: none; }
  .filter-icon-btn { padding: 0.3rem 0.5rem; }
  .era-section-header { top: 50px; }
  .tl-container { padding: 0.5rem 0.85rem 3rem; }
  .filter-modal-overlay { align-items: flex-end; padding: 0; }
  .filter-modal { border-radius: 20px 20px 0 0; max-width: 100%; }

  .timeline-page.broadcast-mode { padding-right: 0.85rem; }
  .timeline-broadcast-panel { display: none; }
}

@media (max-width: 480px) {
  .tl-item { grid-template-columns: 62px 24px 1fr; }
  .item-am { font-size: 0.62rem; }
  .item-bcad { font-size: 0.56rem; }
  .card-title { font-size: 0.82rem; }
  .tl-card { padding: 0.5rem 0.7rem; }
  .tl-container { padding: 0.25rem 0.65rem 3rem; }
}
</style>
