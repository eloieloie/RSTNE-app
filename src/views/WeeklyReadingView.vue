<template>
  <div class="weekly-page">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'books' })" title="Back to Books">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Books
      </button>
      <div class="header-content">
        <div class="header-badge">52 Weeks</div>
        <h1>Weekly Torah Parashot</h1>
        <p class="subtitle">A full-year reading plan through Torah &amp; New Covenant</p>
      </div>
    </div>

    <!-- Grid -->
    <div class="parashot-grid">
      <div
        v-for="parasha in WEEKLY_PARASHOT"
        :key="parasha.week"
        :ref="el => { if (parasha.week === currentWeek) currentCardRef = el as HTMLElement }"
        class="parasha-card"
        :class="{ 'current-week': parasha.week === currentWeek }"
      >
        <div class="card-header">
          <div class="week-row">
            <span class="week-badge">Week {{ parasha.week }}</span>
            <span v-if="parasha.week === currentWeek" class="this-week-label">This Week</span>
          </div>
          <h3 class="hebrew-name">{{ parasha.hebrewName }}</h3>
        </div>

        <div class="readings">
          <!-- Torah -->
          <div class="reading-block torah-block">
            <div class="reading-label">
              <svg class="reading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              Torah
            </div>
            <div class="reading-text">{{ parasha.torah.displayText }}</div>
          </div>

          <!-- New Covenant -->
          <div class="reading-block nc-block">
            <div class="reading-label">
              <svg class="reading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              New Covenant
            </div>
            <div class="reading-text">{{ parasha.newCovenant.displayText }}</div>
          </div>
        </div>

        <div class="card-actions">
          <button
            class="read-btn torah-btn"
            @click="navigate(parasha, 'torah')"
          >
            Read Torah
          </button>
          <button
            class="read-btn nc-btn"
            @click="navigate(parasha, 'nc')"
          >
            Read NC
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { WEEKLY_PARASHOT, type Parasha } from '@/data/weeklyParashot';

const router = useRouter();
const currentCardRef = ref<HTMLElement | null>(null);

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return Math.min(52, Math.ceil(dayOfYear / 7));
}

const currentWeek = getCurrentWeek();

function navigate(parasha: Parasha, side: 'torah' | 'nc') {
  const reading = side === 'torah' ? parasha.torah : parasha.newCovenant;
  router.push({
    name: 'book-chapter-verse',
    params: { bookName: reading.bookSlug, chapterNumber: String(reading.startChapter) },
    state: {
      parashaWeek: parasha.week,
      parashaName: parasha.hebrewName,
      parashaTorahText: parasha.torah.displayText,
      parashaNcText: parasha.newCovenant.displayText,
    },
  });
}

onMounted(() => {
  if (currentCardRef.value) {
    currentCardRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
</script>

<style scoped>
.weekly-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem 3rem;
}

/* Header */
.page-header {
  position: relative;
  text-align: center;
  margin-bottom: 2.5rem;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #4b5563;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-btn:hover {
  border-color: #8B4513;
  color: #8B4513;
  background: #FFF8DC;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.9rem;
  background: linear-gradient(135deg, #8B4513, #c0763a);
  color: #fff;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.page-header h1 {
  color: #1a1a1a;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  margin: 0;
  line-height: 1.15;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* Grid */
.parashot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.1rem;
}

/* Card */
.parasha-card {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.parasha-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

/* Current week highlight */
.parasha-card.current-week {
  border: 2px solid #8B4513;
  background: linear-gradient(145deg, #fffcf5, #fff8e8);
  box-shadow: 0 0 0 4px rgba(139,69,19,0.12), 0 4px 16px rgba(139,69,19,0.15);
}

.parasha-card.current-week:hover {
  box-shadow: 0 0 0 4px rgba(139,69,19,0.15), 0 8px 24px rgba(139,69,19,0.2);
}

/* Card header */
.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.week-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.week-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.this-week-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #fff;
  background: linear-gradient(135deg, #8B4513, #c0763a);
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
}

.hebrew-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

/* Readings */
.readings {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  flex: 1;
}

.reading-block {
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
}

.torah-block {
  background: #FFF8DC;
  border: 1px solid #DEB887;
}

.nc-block {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
}

.reading-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.2rem;
}

.torah-block .reading-label {
  color: #92400e;
}

.nc-block .reading-label {
  color: #1e40af;
}

.reading-icon {
  flex-shrink: 0;
}

.reading-text {
  font-size: 0.82rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
}

/* Buttons */
.card-actions {
  display: flex;
  gap: 0.5rem;
}

.read-btn {
  flex: 1;
  padding: 0.5rem 0.25rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s ease;
  letter-spacing: 0.02em;
}

.torah-btn {
  background: #FFF8DC;
  color: #8B4513;
  border-color: #DEB887;
}

.torah-btn:hover {
  background: #8B4513;
  color: #fff;
  border-color: #8B4513;
}

.nc-btn {
  background: #EFF6FF;
  color: #1E40AF;
  border-color: #BFDBFE;
}

.nc-btn:hover {
  background: #1E40AF;
  color: #fff;
  border-color: #1E40AF;
}

/* Responsive */
@media (max-width: 1100px) {
  .parashot-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .weekly-page {
    padding: 1rem 1rem 2.5rem;
  }

  .page-header {
    margin-bottom: 1.75rem;
    padding-top: 3rem;
  }

  .back-btn {
    top: 0;
    left: 0;
  }

  .parashot-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .weekly-page {
    padding: 0.75rem 0.75rem 2rem;
  }

  .parashot-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }

  .parasha-card {
    padding: 0.85rem;
    gap: 0.65rem;
  }

  .hebrew-name {
    font-size: 0.88rem;
  }

  .reading-text {
    font-size: 0.75rem;
  }

  .read-btn {
    font-size: 0.72rem;
    padding: 0.45rem 0.2rem;
  }
}
</style>
