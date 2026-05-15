<template>
  <div class="timeline-page">
    <!-- Header -->
    <header class="tl-header">
      <div class="tl-header-left">
        <router-link to="/" class="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Home
        </router-link>
        <h1 class="tl-title">
          <span class="tl-title-icon">📜</span>
          Biblical Timeline
        </h1>
        <p class="tl-subtitle">6,000 Years of Sacred History</p>
      </div>
      <div class="tl-header-right">
        <div class="tl-zoom">
          <button class="zoom-btn" @click="decreaseZoom" :disabled="zoom <= 1" title="Zoom out">−</button>
          <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
          <button class="zoom-btn" @click="increaseZoom" :disabled="zoom >= 6" title="Zoom in">+</button>
        </div>
        <div class="legend-toggle" @click="showLegend = !showLegend">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          Legend
        </div>
        <button class="filter-icon-btn" @click="showFilters = !showFilters" :class="{ active: activeFiltersCount > 0 }" title="Filters & Era Navigation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
          <span class="filter-icon-label">Filters</span>
          <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
        </button>
      </div>
    </header>

    <!-- Legend panel -->
    <transition name="legend-fade">
      <div v-if="showLegend" class="legend-panel">
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
      </div>
    </transition>

    <!-- Loading / Error -->
    <div v-if="loading" class="tl-loading">
      <div class="spinner"></div>
      <span>Loading timeline…</span>
    </div>
    <div v-else-if="error" class="tl-error">{{ error }}</div>

    <!-- Timeline -->
    <div v-else class="tl-scroll-container" ref="scrollContainer">
      <div class="tl-canvas" :style="{ width: canvasWidth + 'px' }">

        <!-- Era backgrounds -->
        <div class="era-backgrounds">
          <div
            v-for="era in ERAS"
            :key="era.label"
            class="era-bg"
            :style="{
              left: amToX(era.startAM) + 'px',
              width: (amToX(era.endAM) - amToX(era.startAM)) + 'px',
              background: era.bgColor,
            }"
          >
            <span class="era-label" :style="{ color: era.color }">{{ era.label }}</span>
          </div>
        </div>

        <!-- Events above the line -->
        <div class="events-above">
          <div
            v-for="(ev, i) in aboveEvents"
            :key="ev.event_id"
            class="event-above"
            :style="{ left: amToX(ev.am_year) + 'px', '--stagger': i % 4 }"
          >
            <div
              class="event-card"
              :class="[`cat-${ev.category || 'default'}`, { 'is-jubilee': ev.is_jubilee, 'is-shemittah': ev.is_shemittah, 'is-active': selectedEvent?.event_id === ev.event_id }]"
              :style="{ '--cat-color': getCategoryColor(ev.category) }"
              @click="selectEvent(ev)"
            >
              <span v-if="ev.is_jubilee" class="badge jubilee-badge">Jubilee</span>
              <span v-else-if="ev.is_shemittah" class="badge shemittah-badge">Shemittah</span>
              <div class="card-title">{{ ev.title }}</div>
              <div class="card-year">{{ formatYear(ev) }}</div>
            </div>
            <div class="connector-line"></div>
          </div>
        </div>

        <!-- The timeline line -->
        <div class="tl-line" ref="timelineLine">
          <!-- Year scale ticks -->
          <div
            v-for="tick in yearTicks"
            :key="tick.year"
            class="year-tick"
            :class="{ major: tick.major }"
            :style="{ left: amToX(tick.year) + 'px' }"
          >
            <div class="tick-mark" :class="{ major: tick.major }"></div>
            <div v-if="tick.major" class="tick-label">AM {{ tick.year }}</div>
          </div>

          <!-- Event dots -->
          <div
            v-for="ev in filteredEvents"
            :key="'dot-' + ev.event_id"
            class="event-dot-wrapper"
            :style="{ left: amToX(ev.am_year) + 'px' }"
            @click="selectEvent(ev)"
            :title="ev.title"
          >
            <div
              class="event-dot"
              :class="{ 'is-jubilee': ev.is_jubilee, 'is-shemittah': ev.is_shemittah, 'is-active': selectedEvent?.event_id === ev.event_id }"
              :style="{ background: getCategoryColor(ev.category) }"
            ></div>
          </div>
        </div>

        <!-- Events below the line -->
        <div class="events-below">
          <div
            v-for="(ev, i) in belowEvents"
            :key="ev.event_id"
            class="event-below"
            :style="{ left: amToX(ev.am_year) + 'px', '--stagger': i % 4 }"
          >
            <div class="connector-line"></div>
            <div
              class="event-card"
              :class="[`cat-${ev.category || 'default'}`, { 'is-jubilee': ev.is_jubilee, 'is-shemittah': ev.is_shemittah, 'is-active': selectedEvent?.event_id === ev.event_id }]"
              :style="{ '--cat-color': getCategoryColor(ev.category) }"
              @click="selectEvent(ev)"
            >
              <span v-if="ev.is_jubilee" class="badge jubilee-badge">Jubilee</span>
              <span v-else-if="ev.is_shemittah" class="badge shemittah-badge">Shemittah</span>
              <div class="card-title">{{ ev.title }}</div>
              <div class="card-year">{{ formatYear(ev) }}</div>
            </div>
          </div>
        </div>

        <!-- Year scale labels at bottom -->
        <div class="year-scale">
          <div
            v-for="tick in majorYearTicks"
            :key="'scale-' + tick.year"
            class="scale-label"
            :style="{ left: amToX(tick.year) + 'px' }"
          >
            <div class="scale-year">AM {{ tick.year }}</div>
            <div class="scale-bc">{{ tick.year <= 3925 ? (3926 - tick.year) + ' BC' : (tick.year - 3925) + ' AD' }}</div>
          </div>
        </div>

      </div><!-- end tl-canvas -->
    </div><!-- end tl-scroll-container -->

    <!-- Event detail panel (fade-in) -->
    <transition name="detail-fade">
      <div v-if="selectedEvent" class="detail-panel">
        <button class="detail-close" @click="selectedEvent = null">✕</button>

        <div class="detail-header">
          <div class="detail-badge-row">
            <span
              class="detail-cat-badge"
              :style="{ background: getCategoryColor(selectedEvent.category) }"
            >{{ getCategoryLabel(selectedEvent.category) }}</span>
            <span v-if="selectedEvent.is_jubilee" class="badge jubilee-badge">Jubilee Year</span>
            <span v-if="selectedEvent.is_shemittah" class="badge shemittah-badge">Shemittah Year</span>
          </div>
          <h2 class="detail-title">{{ selectedEvent.title }}</h2>
        </div>

        <div class="detail-body">
          <div class="detail-years">
            <div class="detail-year-block am">
              <div class="year-value">AM {{ selectedEvent.am_year }}</div>
              <div class="year-sub">Anno Mundi</div>
            </div>
            <div class="detail-year-sep">·</div>
            <div class="detail-year-block bc">
              <div class="year-value">{{ formatYearFull(selectedEvent) }}</div>
              <div class="year-sub">{{ selectedEvent.is_bc ? 'Before Messiah' : 'After Messiah' }}</div>
            </div>
            <div v-if="selectedEvent.month_name" class="detail-year-sep">·</div>
            <div v-if="selectedEvent.month_name" class="detail-year-block date">
              <div class="year-value">{{ selectedEvent.month_name }}{{ selectedEvent.day_number ? ' ' + selectedEvent.day_number : '' }}</div>
              <div class="year-sub">Hebrew Date</div>
            </div>
          </div>

          <p v-if="selectedEvent.description" class="detail-description">{{ selectedEvent.description }}</p>

          <div class="detail-meta">
            <div v-if="selectedEvent.jubilee_ref" class="meta-item">
              <span class="meta-label">Jubilee Ref</span>
              <span class="meta-value jubilee-ref">{{ selectedEvent.jubilee_ref }}</span>
            </div>
            <div v-if="selectedEvent.bible_ref" class="meta-item">
              <span class="meta-label">Scripture</span>
              <span class="meta-value bible-ref">{{ selectedEvent.bible_ref }}</span>
            </div>
          </div>
        </div>

        <div class="detail-nav">
          <button class="nav-btn" @click="prevEvent" :disabled="!hasPrev">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Previous
          </button>
          <span class="nav-count">{{ currentEventIndex + 1 }} / {{ filteredEvents.length }}</span>
          <button class="nav-btn" @click="nextEvent" :disabled="!hasNext">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- Empty state -->
    <div v-if="!loading && !error && filteredEvents.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No events match the current filter.</p>
      <button @click="resetFilters" class="reset-btn">Reset Filters</button>
    </div>

    <!-- Filter Modal -->
    <transition name="modal-fade">
      <div v-if="showFilters" class="filter-modal-overlay" @click.self="showFilters = false">
        <div class="filter-modal">
          <div class="filter-modal-header">
            <h3 class="filter-modal-title">Filters &amp; Navigation</h3>
            <button class="filter-modal-close" @click="showFilters = false">✕</button>
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
                <button
                  class="filter-toggle-chip"
                  :class="{ active: showOnlyJubilee }"
                  @click="showOnlyJubilee = !showOnlyJubilee"
                >Jubilee Years</button>
                <button
                  class="filter-toggle-chip"
                  :class="{ active: showOnlyShemittah }"
                  @click="showOnlyShemittah = !showOnlyShemittah"
                >Shemittah Years</button>
              </div>
            </div>
          </div>
          <div class="filter-modal-footer">
            <button class="reset-filters-btn" @click="resetFilters">Reset All</button>
            <button class="apply-filters-btn" @click="showFilters = false">Apply</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { getAllTimelineEvents } from '@/api/timelineEvents';
import type { TimelineEvent } from '@/utils/collectionReferences';

const TOTAL_AM_YEARS = 6001;
const BASE_PX_PER_YEAR = 1.8;
const TIMELINE_PADDING = 80;

const ERAS = [
  { label: 'Creation', startAM: 1,    endAM: 1656, color: '#059669', bgColor: 'rgba(5,150,105,0.07)' },
  { label: 'Flood',    startAM: 1656, endAM: 1948, color: '#0891b2', bgColor: 'rgba(8,145,178,0.07)' },
  { label: 'Patriarchs', startAM: 1948, endAM: 2448, color: '#d97706', bgColor: 'rgba(217,119,6,0.07)' },
  { label: 'Exodus',   startAM: 2448, endAM: 2935, color: '#ea580c', bgColor: 'rgba(234,88,12,0.07)' },
  { label: 'Temple',   startAM: 2935, endAM: 3338, color: '#7c3aed', bgColor: 'rgba(124,58,237,0.07)' },
  { label: 'Captivity',startAM: 3338, endAM: 3957, color: '#be123c', bgColor: 'rgba(190,18,60,0.07)' },
  { label: 'Messiah',  startAM: 3957, endAM: 5873, color: '#1d4ed8', bgColor: 'rgba(29,78,216,0.07)' },
  { label: 'Modern',   startAM: 5873, endAM: 6001, color: '#b45309', bgColor: 'rgba(180,83,9,0.07)' },
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
const selectedEvent = ref<TimelineEvent | null>(null);
const zoom = ref(1.5);
const activeCategory = ref<string | null>(null);
const showOnlyJubilee = ref(false);
const showOnlyShemittah = ref(false);
const activeEra = ref<string | null>(null);
const showLegend = ref(false);
const showFilters = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const canvasWidth = computed(() => TOTAL_AM_YEARS * BASE_PX_PER_YEAR * zoom.value + TIMELINE_PADDING * 2);

function amToX(amYear: number): number {
  return TIMELINE_PADDING + (amYear - 1) / TOTAL_AM_YEARS * (canvasWidth.value - TIMELINE_PADDING * 2);
}

const filteredEvents = computed(() => {
  let evs = events.value;
  if (activeCategory.value) evs = evs.filter(e => e.category === activeCategory.value);
  if (showOnlyJubilee.value)  evs = evs.filter(e => e.is_jubilee === 1);
  if (showOnlyShemittah.value) evs = evs.filter(e => e.is_shemittah === 1);
  return evs.sort((a, b) => a.am_year - b.am_year);
});

// Alternate events above/below the line
const aboveEvents = computed(() => filteredEvents.value.filter((_, i) => i % 2 === 0));
const belowEvents = computed(() => filteredEvents.value.filter((_, i) => i % 2 !== 0));

const yearTicks = computed(() => {
  const ticks = [];
  const step = zoom.value < 1.5 ? 500 : zoom.value < 3 ? 200 : 100;
  for (let y = 0; y <= TOTAL_AM_YEARS; y += step) {
    ticks.push({ year: y, major: y % (step * 2) === 0 });
  }
  return ticks;
});

const majorYearTicks = computed(() => {
  const step = zoom.value < 1.5 ? 1000 : zoom.value < 3 ? 500 : 200;
  const ticks = [];
  for (let y = 0; y <= TOTAL_AM_YEARS; y += step) {
    ticks.push({ year: y });
  }
  return ticks;
});

const currentEventIndex = computed(() => {
  if (!selectedEvent.value) return -1;
  return filteredEvents.value.findIndex(e => e.event_id === selectedEvent.value!.event_id);
});

const hasPrev = computed(() => currentEventIndex.value > 0);
const hasNext = computed(() => currentEventIndex.value < filteredEvents.value.length - 1);

const activeFiltersCount = computed(() => {
  let count = 0;
  if (activeCategory.value) count++;
  if (showOnlyJubilee.value) count++;
  if (showOnlyShemittah.value) count++;
  return count;
});

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

function selectEvent(ev: TimelineEvent) {
  selectedEvent.value = ev;
  scrollToEventDot(ev);
}

function scrollToEventDot(ev: TimelineEvent) {
  const container = scrollContainer.value;
  if (!container) return;
  const x = amToX(ev.am_year);
  container.scrollTo({ left: x - container.clientWidth / 2, behavior: 'smooth' });
}

function prevEvent() {
  if (hasPrev.value) selectEvent(filteredEvents.value[currentEventIndex.value - 1]);
}

function nextEvent() {
  if (hasNext.value) selectEvent(filteredEvents.value[currentEventIndex.value + 1]);
}

function scrollToEra(era: typeof ERAS[0]) {
  activeEra.value = era.label;
  const container = scrollContainer.value;
  if (!container) return;
  const x = amToX(era.startAM);
  container.scrollTo({ left: x - 40, behavior: 'smooth' });
}

function onEraSelect(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  const era = ERAS.find(e => e.label === val);
  if (era) scrollToEra(era);
}

function increaseZoom() { zoom.value = Math.min(6, +(zoom.value + 0.5).toFixed(1)); }
function decreaseZoom() { zoom.value = Math.max(1, +(zoom.value - 0.5).toFixed(1)); }

function resetFilters() {
  activeCategory.value = null;
  showOnlyJubilee.value = false;
  showOnlyShemittah.value = false;
}

watch(filteredEvents, () => {
  if (selectedEvent.value && !filteredEvents.value.find(e => e.event_id === selectedEvent.value!.event_id)) {
    selectedEvent.value = null;
  }
});

onMounted(async () => {
  try {
    events.value = await getAllTimelineEvents();
    if (events.value.length > 0) {
      selectedEvent.value = events.value[0];
    }
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
  height: 100vh;
  overflow: hidden;
  background: #f8f6f0;
  display: flex;
  flex-direction: column;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

/* ── Header ─────────────────────────────────────────────────────── */
.tl-header {
  background: linear-gradient(135deg, #1a0a00 0%, #3b1a00 50%, #1a0a00 100%);
  color: white;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.tl-header-left { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.tl-header-right { display: flex; align-items: center; gap: 1rem; }

.back-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  transition: background 0.2s;
}
.back-link:hover { background: rgba(255,255,255,0.2); color: white; }

.tl-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.02em;
}
.tl-title-icon { font-size: 1.4rem; }

.tl-subtitle {
  color: rgba(255,255,255,0.6);
  font-size: 0.85rem;
  margin: 0;
}

/* ── Zoom controls ───────────────────────────────────────────────── */
.tl-zoom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
}
.zoom-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s;
}
.zoom-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
.zoom-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.zoom-label { font-size: 0.85rem; min-width: 40px; text-align: center; }

.legend-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255,255,255,0.8);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  transition: background 0.2s;
}
.legend-toggle:hover { background: rgba(255,255,255,0.2); }

/* ── Legend ─────────────────────────────────────────────────────── */
.legend-panel {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 2rem;
}
.legend-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #374151;
}
.legend-dot {
  width: 12px;
  height: 12px;
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

/* ── Timeline scroll container ───────────────────────────────────── */
.tl-scroll-container {
  height: 380px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  background: #f8f6f0;
  cursor: grab;
  -webkit-overflow-scrolling: touch;
}
.tl-scroll-container:active { cursor: grabbing; }

/* ── Canvas ─────────────────────────────────────────────────────── */
.tl-canvas {
  position: relative;
  height: 380px;
  padding-top: 170px; /* space for above-cards */
  padding-bottom: 40px;
}

/* ── Era backgrounds ─────────────────────────────────────────────── */
.era-backgrounds {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}
.era-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  padding-left: 6px;
}
.era-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.85;
  white-space: nowrap;
}

/* ── Events above the line ───────────────────────────────────────── */
.events-above {
  position: absolute;
  top: 0;
  left: 0;
  height: 170px; /* matches padding-top of canvas */
  width: 100%;
}
.event-above {
  position: absolute;
  transform: translateX(-50%);
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.connector-line {
  width: 1.5px;
  height: 20px;
  background: #d1d5db;
  flex-shrink: 0;
}

/* ── The timeline line ───────────────────────────────────────────── */
.tl-line {
  position: absolute;
  top: 170px;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #c9b99a 0%, #8B4513 30%, #5a2d00 60%, #1d4ed8 85%, #b45309 100%);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* ── Year ticks ─────────────────────────────────────────────────── */
.year-tick {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 0;
}
.tick-mark {
  width: 1px;
  height: 10px;
  background: rgba(0,0,0,0.2);
  margin-top: -2px;
}
.tick-mark.major { height: 14px; width: 1.5px; background: rgba(0,0,0,0.35); margin-top: -4px; }
.tick-label {
  font-size: 0.6rem;
  color: rgba(0,0,0,0.4);
  white-space: nowrap;
  margin-top: 2px;
}

/* ── Event dots on the line ──────────────────────────────────────── */
.event-dot-wrapper {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;
}
.event-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2.5px solid white;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
  transition: transform 0.15s, box-shadow 0.15s;
}
.event-dot-wrapper:hover .event-dot { transform: scale(1.4); }
.event-dot.is-active { transform: scale(1.6); box-shadow: 0 0 0 3px rgba(0,0,0,0.3); }
.event-dot.is-jubilee { width: 18px; height: 18px; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.3); }
.event-dot.is-shemittah { border-color: #8b5cf6; }

/* ── Events below the line ───────────────────────────────────────── */
.events-below {
  position: absolute;
  top: 176px;
  left: 0;
  width: 100%;
}
.event-below {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Event cards ─────────────────────────────────────────────────── */
.event-card {
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.5rem 0.7rem;
  max-width: 130px;
  min-width: 90px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border-top: 3px solid var(--cat-color);
}
.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  border-color: var(--cat-color);
}
.event-card.is-active {
  border-color: var(--cat-color);
  box-shadow: 0 0 0 2px var(--cat-color), 0 4px 12px rgba(0,0,0,0.15);
  z-index: 3;
}
.event-card.is-jubilee { border-top-color: #f59e0b; }
.event-card.is-shemittah { border-top-color: #8b5cf6; }

.badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.2rem;
}
.jubilee-badge { background: #fef3c7; color: #92400e; }
.shemittah-badge { background: #ede9fe; color: #5b21b6; }

.card-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}
.card-year {
  font-size: 0.65rem;
  color: #6b7280;
  margin-top: 0.2rem;
  font-weight: 600;
}

/* ── Year scale at bottom ────────────────────────────────────────── */
.year-scale {
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 100%;
}
.scale-label {
  position: absolute;
  transform: translateX(-50%);
  text-align: center;
}
.scale-year { font-size: 0.72rem; font-weight: 700; color: #374151; }
.scale-bc { font-size: 0.62rem; color: #9ca3af; }

/* ── Detail panel ────────────────────────────────────────────────── */
.detail-panel {
  flex-shrink: 0;
  background: white;
  border-top: 2px solid #e5e7eb;
  padding: 1.25rem 2rem;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
}
.detail-close {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.detail-close:hover { background: #e5e7eb; color: #111; }

.detail-header { margin-bottom: 0.75rem; }
.detail-badge-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; align-items: center; }
.detail-cat-badge {
  display: inline-block;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.detail-body { display: flex; flex-direction: column; gap: 0.75rem; }

.detail-years {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.detail-year-block { text-align: center; }
.year-value { font-size: 1.1rem; font-weight: 800; color: #111827; }
.year-sub { font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; }
.detail-year-sep { color: #d1d5db; font-size: 1.5rem; font-weight: 300; }
.detail-year-block.am .year-value { color: #8B4513; }
.detail-year-block.bc .year-value { color: #1d4ed8; }
.detail-year-block.date .year-value { color: #059669; }

.detail-description {
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.detail-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.meta-item { display: flex; flex-direction: column; gap: 0.15rem; }
.meta-label { font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; }
.meta-value { font-size: 0.85rem; font-weight: 600; color: #1f2937; }
.jubilee-ref { font-family: monospace; color: #7c3aed; }
.bible-ref { color: #8B4513; }

.detail-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.nav-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nav-count { font-size: 0.8rem; color: #9ca3af; flex: 1; text-align: center; }

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: #6b7280;
}
.empty-icon { font-size: 2.5rem; }
.empty-state p { font-size: 1rem; margin: 0; }
.reset-btn {
  padding: 0.6rem 1.5rem;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.reset-btn:hover { background: #723a10; }

/* ── Transitions ─────────────────────────────────────────────────── */
.detail-fade-enter-active, .detail-fade-leave-active { transition: all 0.3s ease; }
.detail-fade-enter-from, .detail-fade-leave-to { opacity: 0; transform: translateY(20px); }

.legend-fade-enter-active, .legend-fade-leave-active { transition: all 0.2s ease; }
.legend-fade-enter-from, .legend-fade-leave-to { opacity: 0; max-height: 0; }

/* ── Filter icon button ──────────────────────────────────────────── */
.filter-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255,255,255,0.8);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  border: none;
  transition: background 0.2s;
}
.filter-icon-btn:hover { background: rgba(255,255,255,0.2); color: white; }
.filter-icon-btn.active { background: rgba(255,255,255,0.22); color: white; }
.filter-count-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #1a0a00;
}

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
.filter-modal-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}
.filter-modal-close {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
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
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-active .filter-modal, .modal-fade-leave-active .filter-modal { transition: transform 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .filter-modal, .modal-fade-leave-to .filter-modal { transform: scale(0.95) translateY(-8px); }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .tl-header { padding: 0.6rem 0.85rem; gap: 0.5rem; }
  .tl-title { font-size: 1rem; }
  .tl-title-icon { font-size: 1rem; }
  .tl-subtitle { display: none; }
  .back-link { font-size: 0.8rem; padding: 0.3rem 0.55rem; }
  .zoom-label { min-width: 32px; font-size: 0.78rem; }
  .legend-toggle { font-size: 0.78rem; padding: 0.3rem 0.55rem; }
  .filter-icon-label { display: none; }
  .filter-icon-btn { padding: 0.35rem 0.55rem; }
  .filter-modal-overlay { align-items: flex-end; padding: 0; }
  .filter-modal { border-radius: 20px 20px 0 0; max-width: 100%; }
  .tl-scroll-container { height: 320px; }
  .tl-canvas { height: 320px; }
  .detail-panel { padding: 1rem; }
  .detail-title { font-size: 1rem; }
  .year-value { font-size: 0.95rem; }
}
</style>
