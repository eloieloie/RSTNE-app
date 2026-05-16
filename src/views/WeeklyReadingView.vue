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
        <div class="header-badge">52 Weeks · 12 Months · 364 Days</div>
        <h1>Turah Reading Plan</h1>
        <p class="subtitle">Dead Sea Scroll Solar Calendar · Weekly Parashot from Turah Parsha</p>

        <!-- DSS Year display + selector -->
        <div class="year-display">
          <span class="year-label">DSS Year</span>
          <span class="year-number">{{ selectedDSSYear }}</span>
        </div>
        <div class="year-selector">
          <button
            v-for="yr in yearOptions"
            :key="yr"
            class="year-pill"
            :class="{ active: yr === selectedDSSYear, current: yr === currentDSSYear }"
            @click="selectedDSSYear = yr"
          >
            {{ yr }}
            <span v-if="yr === currentDSSYear" class="year-now-dot"></span>
          </button>
        </div>

        <div class="dss-today-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          DSS Today: {{ dssToday.month }}M / {{ dssToday.day }}th · Day {{ dssToday.dayOfYear }} of 364 · Week {{ currentWeek }}
        </div>

        <div class="am-jubilee-row">
          <div class="am-jubilee-badge">
            <span class="am-badge-label">Anno Mundi</span>
            <span class="am-badge-year">AM {{ currentDSSYear }}</span>
            <span class="am-badge-sep">·</span>
            <span class="am-badge-label">Jubilee Ref</span>
            <span class="am-badge-jubilee">{{ currentJubileeRef }}</span>
          </div>
          <button class="info-icon-btn" @click="showAmModal = true" title="How to read these dates">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="8"></line>
              <line x1="12" y1="12" x2="12" y2="16"></line>
            </svg>
          </button>
        </div>

        <!-- AM & Jubilee Ref Info Modal -->
        <Teleport to="body">
          <div v-if="showAmModal" class="am-modal-overlay" @click.self="showAmModal = false">
            <div class="am-modal">
              <div class="am-modal-header">
                <h2>Understanding AM &amp; Jubilee Ref</h2>
                <button class="am-modal-close" @click="showAmModal = false">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div class="am-modal-body">

                <section class="info-section">
                  <h3>Anno Mundi (AM)</h3>
                  <p><strong>Anno Mundi</strong> means <em>"Year of the World"</em> — it counts years from Creation (AM 1 = 3925 BC on the Gregorian calendar).</p>
                  <div class="formula-box">
                    <span class="formula-label">Formula</span>
                    <code>AM Year = Gregorian year + 3925</code>
                  </div>
                  <p class="example-text">So today's DSS year <strong>{{ currentDSSYear }}</strong> = <strong>{{ currentDSSYear - 3925 }}</strong> AD + 3925 = AM {{ currentDSSYear }}.</p>
                </section>

                <section class="info-section">
                  <h3>Jubilee Reference</h3>
                  <p>The Jubilee calendar divides time into nested cycles:</p>
                  <div class="cycle-list">
                    <div class="cycle-item">
                      <span class="cycle-badge">Y</span>
                      <div><strong>Year in Shemittah</strong> — 1–7 (every 7th year is a Shemittah / Sabbatical year)</div>
                    </div>
                    <div class="cycle-item">
                      <span class="cycle-badge">S</span>
                      <div><strong>Shemittah cycle</strong> — 1–7 within the Jubilee (7 × 7 = 49 years)</div>
                    </div>
                    <div class="cycle-item">
                      <span class="cycle-badge">J</span>
                      <div><strong>Jubilee</strong> — every 50th year is declared holy (Lev 25:10)</div>
                    </div>
                    <div class="cycle-item">
                      <span class="cycle-badge">O</span>
                      <div><strong>Onah</strong> — a 500-year era; there are multiple Onahs in history</div>
                    </div>
                  </div>
                </section>

                <section class="info-section">
                  <h3>How to Read the Ref Code</h3>
                  <div class="ref-example-box">
                    <span class="ref-code">{{ currentJubileeRef }}</span>
                    <span class="ref-arrow">← Today</span>
                  </div>
                  <p>Reading left to right — the smallest cycle first:</p>
                  <ul class="reading-list">
                    <li v-if="currentJubileeRef.startsWith('Y')">
                      <strong>Y{{ currentJubileeRef.match(/Y(\d+)/)?.[1] }}</strong> — year {{ currentJubileeRef.match(/Y(\d+)/)?.[1] }} of the current 7-year Shemittah cycle
                    </li>
                    <li v-if="currentJubileeRef.includes('S')">
                      <strong>S{{ currentJubileeRef.match(/S(\d+)/)?.[1] }}</strong> — Shemittah cycle {{ currentJubileeRef.match(/S(\d+)/)?.[1] }} within the current Jubilee
                    </li>
                    <li>
                      <strong>J{{ currentJubileeRef.match(/J(\d+)/)?.[1] }}</strong> — Jubilee {{ currentJubileeRef.match(/J(\d+)/)?.[1] }} of the current Onah
                    </li>
                    <li>
                      <strong>O{{ currentJubileeRef.match(/O(\d+)/)?.[1] }}</strong> — Onah {{ currentJubileeRef.match(/O(\d+)/)?.[1] }} (500-year era)
                    </li>
                  </ul>
                </section>

                <section class="info-section">
                  <h3>Calculation Formula</h3>
                  <div class="formula-steps">
                    <div class="formula-step">
                      <span class="step-num">1</span>
                      <code>onah = ⌈AM ÷ 500⌉</code>
                      <span class="step-note">500-year era</span>
                    </div>
                    <div class="formula-step">
                      <span class="step-num">2</span>
                      <code>inOnah = AM − (onah − 1) × 500</code>
                      <span class="step-note">year within the Onah</span>
                    </div>
                    <div class="formula-step">
                      <span class="step-num">3</span>
                      <code>jubilee = ⌈inOnah ÷ 50⌉</code>
                      <span class="step-note">which Jubilee cycle</span>
                    </div>
                    <div class="formula-step">
                      <span class="step-num">4</span>
                      <code>inJubilee = inOnah − (jubilee − 1) × 50</code>
                      <span class="step-note">year within Jubilee (1–50)</span>
                    </div>
                    <div class="formula-step">
                      <span class="step-num">5</span>
                      <code>shemittah = ⌈inJubilee ÷ 7⌉</code>
                      <span class="step-note">which 7-year cycle</span>
                    </div>
                    <div class="formula-step">
                      <span class="step-num">6</span>
                      <code>Y = inJubilee − (shemittah − 1) × 7</code>
                      <span class="step-note">year in the Shemittah</span>
                    </div>
                  </div>
                  <p class="note-text">If <code>inJubilee = 50</code>, that year itself is the Jubilee year and is written simply as <code>J{{ currentJubileeRef.match(/J(\d+)/)?.[1] }} O{{ currentJubileeRef.match(/O(\d+)/)?.[1] }}</code> (no Y or S).</p>
                </section>

              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- Tab Toggle -->
    <div class="view-tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'weekly' }" @click="activeTab = 'weekly'">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        52 Weeks
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'byMonth' }" @click="activeTab = 'byMonth'">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        By Month
      </button>
      <button class="tab-btn tab-btn--purple" :class="{ active: activeTab === 'roshChodesh' }" @click="activeTab = 'roshChodesh'">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"></path>
          <path d="M12 2a6.5 6.5 0 0 0 0 13A6.5 6.5 0 0 0 12 2z" fill="currentColor" opacity="0.25"></path>
        </svg>
        Rosh Chodesh
      </button>
    </div>

    <!-- Weekly Grid -->
    <div v-if="activeTab === 'weekly'" class="parashot-grid">
      <div
        v-for="parasha in WEEKLY_PARASHOT"
        :key="parasha.week"
        :ref="el => { if (parasha.week === currentWeek) currentCardRef = el as HTMLElement }"
        class="parasha-card"
        :class="{ 'current-week': isCurrentYear && parasha.week === currentWeek }"
      >
        <div class="card-header">
          <div class="week-row">
            <span class="week-badge">Shabuah - {{ parasha.week }}/52</span>
            <span class="dss-date-badge">{{ parasha.dssMonth }}M / {{ ordinal(parasha.dssDay) }}</span>
            <span v-if="isCurrentYear && parasha.week === currentWeek" class="this-week-label">This Week</span>
          </div>
          <h3 class="hebrew-name">{{ parasha.hebrewName }}</h3>
          <div v-if="parasha.meaning" class="parasha-meaning">{{ parasha.meaning }}</div>
          <div v-if="parasha.note" class="parasha-note">{{ parasha.note }}</div>
        </div>

        <div class="readings">
          <div class="reading-block torah-block">
            <div class="reading-label">
              <svg class="reading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              Turah
            </div>
            <div class="reading-text">{{ parasha.torah.displayText }}</div>
          </div>

          <div class="reading-block nc-block">
            <div class="reading-label">
              <svg class="reading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Brit Chadasha
            </div>
            <div class="reading-text">{{ parasha.newCovenant.displayText }}</div>
          </div>
        </div>

        <div class="card-actions">
          <button class="read-btn torah-btn" @click="navigate(parasha, 'torah')">Read Turah</button>
          <button class="read-btn nc-btn" @click="navigate(parasha, 'nc')">Read BC</button>
        </div>
      </div>
    </div>

    <!-- By Month View -->
    <div v-if="activeTab === 'byMonth'" class="by-month-container">
      <div
        v-for="month in 12"
        :key="month"
        class="month-section"
        :class="{ 'current-month-section': isCurrentYear && month === dssToday.month }"
      >
        <div class="month-section-header">
          <div class="month-title-row">
            <div class="month-title">
              <span class="month-num-badge">{{ month }}M</span>
              <span class="month-name">{{ DSS_MONTH_NAMES[month] }}</span>
              <span v-if="isCurrentYear && month === dssToday.month" class="current-month-pill">This Month</span>
            </div>
            <div class="month-meta">
              <span class="gregorian-range">{{ getMonthGregorianRange(month) }}</span>
              <span class="day-range-label">Days {{ (month - 1) * 30 + 1 }}–{{ month * 30 }} of 364</span>
            </div>
          </div>
        </div>

        <div class="month-parshas-grid">
          <div
            v-for="parasha in parshasByMonth.get(month) || []"
            :key="parasha.week"
            :ref="el => { if (parasha.week === currentWeek && activeTab === 'byMonth') currentCardRef = el as HTMLElement }"
            class="parasha-card"
            :class="{ 'current-week': isCurrentYear && parasha.week === currentWeek }"
          >
            <div class="card-header">
              <div class="week-row">
                <span class="week-badge">Shabuah - {{ parasha.week }}/52</span>
                <span class="dss-date-badge">{{ parasha.dssMonth }}M / {{ ordinal(parasha.dssDay) }}</span>
                <span v-if="isCurrentYear && parasha.week === currentWeek" class="this-week-label">This Week</span>
              </div>
              <h3 class="hebrew-name">{{ parasha.hebrewName }}</h3>
              <div v-if="parasha.meaning" class="parasha-meaning">{{ parasha.meaning }}</div>
              <div v-if="parasha.note" class="parasha-note">{{ parasha.note }}</div>
            </div>

            <div class="readings">
              <div class="reading-block torah-block">
                <div class="reading-label">
                  <svg class="reading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  Turah
                </div>
                <div class="reading-text">{{ parasha.torah.displayText }}</div>
              </div>

              <div class="reading-block nc-block">
                <div class="reading-label">
                  <svg class="reading-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  Brit Chadasha
                </div>
                <div class="reading-text">{{ parasha.newCovenant.displayText }}</div>
              </div>
            </div>

            <div class="card-actions">
              <button class="read-btn torah-btn" @click="navigate(parasha, 'torah')">Read Turah</button>
              <button class="read-btn nc-btn" @click="navigate(parasha, 'nc')">Read BC</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rosh Chodesh — 12 Month Prophetic Readings -->
    <div v-if="activeTab === 'roshChodesh'" class="rosh-chodesh-container">
      <div class="rosh-chodesh-intro">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"></path>
          <path d="M12 2a6.5 6.5 0 0 0 0 13A6.5 6.5 0 0 0 12 2z"></path>
        </svg>
        Chodesh · New Month Yom Haftarah — Readings From the Prophets · Monthly Portions
      </div>

      <div class="rosh-chodesh-grid">
        <div
          v-for="entry in MONTHLY_HAFTARAH"
          :key="entry.month"
          class="rc-card"
          :class="{ 'rc-card--current': isCurrentYear && entry.month === dssToday.month }"
        >
          <div class="rc-card-header">
            <span class="rc-month-badge">{{ entry.month }}M</span>
            <span class="rc-month-name">{{ DSS_MONTH_NAMES[entry.month] }}</span>
            <span v-if="isCurrentYear && entry.month === dssToday.month" class="rc-current-pill">This Month</span>
          </div>

          <div class="rc-refs">
            <button
              v-for="(ref, i) in entry.refs"
              :key="i"
              class="rc-ref-btn"
              @click="navigateHaftarah(ref)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              {{ ref.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { WEEKLY_PARASHOT, DSS_MONTH_NAMES, type Parasha } from '@/data/weeklyParashot';

const router = useRouter();
const currentCardRef = ref<HTMLElement | null>(null);
const activeTab = ref<'weekly' | 'byMonth' | 'roshChodesh'>('weekly');
const showAmModal = ref(false);

function isBroadcastMode(): boolean {
  try {
    const saved = localStorage.getItem('rstne-settings');
    return saved ? !!JSON.parse(saved).broadcastMode : false;
  } catch { return false; }
}

function goToReading(bookSlug: string, chapter: number, verse?: number) {
  if (isBroadcastMode()) {
    router.push({
      name: 'broadcast-params',
      params: { bookName: bookSlug, chapterNumber: String(chapter), ...(verse ? { verseNumber: String(verse) } : {}) },
    });
  } else {
    router.push({
      name: 'book-chapter-verse',
      params: { bookName: bookSlug, chapterNumber: String(chapter), ...(verse ? { verseNumber: String(verse) } : {}) },
    });
  }
}

interface HaftarahRef {
  label: string;
  bookSlug: string;
  chapter: number;
  verse: number;
}

interface MonthlyHaftarah {
  month: number;
  refs: HaftarahRef[];
}

const MONTHLY_HAFTARAH: MonthlyHaftarah[] = [
  { month: 1,  refs: [
    { label: 'Yeshayahu-Isaiah 42:5–43:10',    bookSlug: 'isaiah',     chapter: 42, verse: 5  },
    { label: 'Yirmeyahu-Jeremiah 46:13–28',     bookSlug: 'jeremiah',   chapter: 46, verse: 13 },
  ]},
  { month: 2,  refs: [
    { label: 'Hoshea-Hosea 12:13–14:10',        bookSlug: 'hosea',      chapter: 12, verse: 13 },
    { label: 'Yeshayahu-Isaiah 9:1–6',          bookSlug: 'isaiah',     chapter: 9,  verse: 1  },
    { label: 'Yeshayahu-Isaiah 49:1–6',         bookSlug: 'isaiah',     chapter: 49, verse: 1  },
  ]},
  { month: 3,  refs: [
    { label: 'Hoshea-Hosea 11:7–12:12',         bookSlug: 'hosea',      chapter: 11, verse: 7  },
    { label: 'Yeshayahu-Isaiah 60:1–22',        bookSlug: 'isaiah',     chapter: 60, verse: 1  },
  ]},
  { month: 4,  refs: [
    { label: 'Yechezkel-Ezekiel 37:15–28',      bookSlug: 'ezekiel',    chapter: 37, verse: 15 },
    { label: 'Yeshayahu-Isaiah 61:1–63:9',      bookSlug: 'isaiah',     chapter: 61, verse: 1  },
  ]},
  { month: 5,  refs: [
    { label: 'Shophtim-Judges 4:4–5:31',        bookSlug: 'judges',     chapter: 4,  verse: 4  },
    { label: 'Hoshea-Hosea 14:2–10',            bookSlug: 'hosea',      chapter: 14, verse: 2  },
  ]},
  { month: 6,  refs: [
    { label: 'Yeshayahu-Isaiah 6:1–7:14',       bookSlug: 'isaiah',     chapter: 6,  verse: 1  },
    { label: 'Yahoshua-Joshua 1:1–18',          bookSlug: 'joshua',     chapter: 1,  verse: 1  },
  ]},
  { month: 7,  refs: [
    { label: 'Yeshayahu-Isaiah 53:1–12',        bookSlug: 'isaiah',     chapter: 53, verse: 1  },
    { label: 'Hoshea-Hosea 2:1–22',             bookSlug: 'hosea',      chapter: 2,  verse: 1  },
  ]},
  { month: 8,  refs: [
    { label: 'Melechim Alef-First Kings 18:1–39', bookSlug: 'first-kings', chapter: 18, verse: 1  },
    { label: 'Yirmeyahu-Jeremiah 16:19–17:14',  bookSlug: 'jeremiah',   chapter: 16, verse: 19 },
  ]},
  { month: 9,  refs: [
    { label: 'Yeshayahu-Isaiah 43:21–44:23',    bookSlug: 'isaiah',     chapter: 43, verse: 21 },
    { label: 'Ahmos-Amos 9:7–15',               bookSlug: 'amos',       chapter: 9,  verse: 7  },
  ]},
  { month: 10, refs: [
    { label: 'Yirmeyahu-Jeremiah 34:8–22',      bookSlug: 'jeremiah',   chapter: 34, verse: 8  },
    { label: 'Yirmeyahu-Jeremiah 31:31–34',     bookSlug: 'jeremiah',   chapter: 31, verse: 31 },
  ]},
  { month: 11, refs: [
    { label: 'Micha-Mika 5:6–6:8',              bookSlug: 'micah',      chapter: 5,  verse: 6  },
    { label: 'Yirmeyahu-Jeremiah 1:1–2:3',      bookSlug: 'jeremiah',   chapter: 1,  verse: 1  },
  ]},
  { month: 12, refs: [
    { label: 'Yeshayahu-Isaiah 1:1–27',         bookSlug: 'isaiah',     chapter: 1,  verse: 1  },
    { label: 'Yeshayahu-Isaiah 40:1–26',        bookSlug: 'isaiah',     chapter: 40, verse: 1  },
  ]},
];

// DSS year = Gregorian year-start year + this offset (2026 → 5951)
const DSS_YEAR_OFFSET = 3925;

// --- DSS Calendar (364-day solar, 12 months × 30 days) ---
// Year starts on the Wednesday nearest to the spring equinox (March 20)
function getDSSYearStart(gregorianYear: number): Date {
  const equinox = new Date(gregorianYear, 2, 20);
  const dow = equinox.getDay(); // 0=Sun … 6=Sat; 3=Wed
  const forward = ((3 - dow) + 7) % 7;
  const backward = (dow - 3 + 7) % 7;
  const d = new Date(equinox);
  d.setDate(d.getDate() + (backward <= forward ? -backward : forward));
  return d;
}

function utcDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDSSDate(date: Date): { month: number; day: number; dayOfYear: number } {
  let ys = getDSSYearStart(date.getFullYear());
  if (utcDay(date) < utcDay(ys)) ys = getDSSYearStart(date.getFullYear() - 1);
  const dayOfYear = Math.floor((utcDay(date) - utcDay(ys)) / 86400000) + 1;
  if (dayOfYear > 364) {
    const ys2 = getDSSYearStart(date.getFullYear() + 1);
    if (utcDay(date) >= utcDay(ys2)) {
      const d2 = Math.floor((utcDay(date) - utcDay(ys2)) / 86400000) + 1;
      const m2 = Math.min(12, Math.ceil(d2 / 30));
      return { month: m2, day: Math.min(30, d2 - (m2 - 1) * 30), dayOfYear: d2 };
    }
  }
  const month = Math.min(12, Math.ceil(dayOfYear / 30));
  const day = Math.min(30, dayOfYear - (month - 1) * 30);
  return { month, day, dayOfYear };
}

function getDSSYearStartCurrent(): Date {
  const now = new Date();
  let ys = getDSSYearStart(now.getFullYear());
  if (utcDay(now) < utcDay(ys)) ys = getDSSYearStart(now.getFullYear() - 1);
  return ys;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const dssToday = getDSSDate(new Date());

// Current DSS year derived from the actual year-start Gregorian year
const currentDSSYear = getDSSYearStartCurrent().getFullYear() + DSS_YEAR_OFFSET;

// Reactive selected year — defaults to today's DSS year
const selectedDSSYear = ref(currentDSSYear);

// 5-year window centred on the current year
const yearOptions = [
  currentDSSYear - 2,
  currentDSSYear - 1,
  currentDSSYear,
  currentDSSYear + 1,
  currentDSSYear + 2,
];

// Gregorian year-start for whatever DSS year the user has selected
const selectedYearStart = computed(() =>
  getDSSYearStart(selectedDSSYear.value - DSS_YEAR_OFFSET)
);

// Only show "This Week / This Month" indicators when viewing the current year
const isCurrentYear = computed(() => selectedDSSYear.value === currentDSSYear);

function getMonthGregorianRange(dssMonth: number): string {
  const ys = selectedYearStart.value;
  const start = new Date(ys);
  start.setDate(start.getDate() + (dssMonth - 1) * 30);
  const end = new Date(ys);
  end.setDate(end.getDate() + dssMonth * 30 - 1);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function getCurrentWeek(): number {
  const todayDayNum = (dssToday.month - 1) * 30 + dssToday.day;
  let week = 1;
  for (const p of WEEKLY_PARASHOT) {
    const pDay = (p.dssMonth - 1) * 30 + p.dssDay;
    if (pDay <= todayDayNum) week = p.week;
    else break;
  }
  return week;
}

const currentWeek = getCurrentWeek();

function getJubileeRef(amYear: number): string {
  const onah      = Math.ceil(amYear / 500);
  const inOnah    = amYear - (onah - 1) * 500;
  const jubilee   = Math.ceil(inOnah / 50);
  const inJubilee = inOnah - (jubilee - 1) * 50;
  if (inJubilee === 50) return `J${jubilee} O${onah}`;
  const shemittah   = Math.ceil(inJubilee / 7);
  const inShemittah = inJubilee - (shemittah - 1) * 7;
  return `Y${inShemittah} S${shemittah} J${jubilee} O${onah}`;
}

const currentJubileeRef = getJubileeRef(currentDSSYear);

// Group parshas by DSS month
const parshasByMonth = computed(() => {
  const groups = new Map<number, Parasha[]>();
  for (let m = 1; m <= 12; m++) groups.set(m, []);
  for (const p of WEEKLY_PARASHOT) {
    groups.get(p.dssMonth)!.push(p);
  }
  return groups;
});

function navigateHaftarah(ref: HaftarahRef) {
  goToReading(ref.bookSlug, ref.chapter, ref.verse);
}

function navigate(parasha: Parasha, side: 'torah' | 'nc') {
  const reading = side === 'torah' ? parasha.torah : parasha.newCovenant;
  goToReading(reading.bookSlug, reading.startChapter);
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

.year-display {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  margin-top: 0.4rem;
}

.year-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.year-number {
  font-size: 1.7rem;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1;
}

.year-selector {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.25rem;
}

.year-pill {
  position: relative;
  padding: 0.3rem 0.85rem;
  border-radius: 20px;
  border: 2px solid #e5e7eb;
  background: #fff;
  color: #4b5563;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.02em;
}

.year-pill:hover {
  border-color: #8B4513;
  color: #8B4513;
  background: #FFF8DC;
}

.year-pill.active {
  background: linear-gradient(135deg, #1e3a5f, #2563eb);
  border-color: transparent;
  color: #fff;
}

.year-pill.current:not(.active) {
  border-color: #2563eb;
  color: #1e40af;
}

.year-now-dot {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2563eb;
}

.year-pill.active .year-now-dot {
  background: #93c5fd;
}

.dss-today-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 1rem;
  background: linear-gradient(135deg, #1e3a5f, #2563eb);
  color: #fff;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  margin-top: 0.25rem;
}

.am-jubilee-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 1.1rem;
  background: linear-gradient(135deg, #3b1200, #8B4513);
  color: #fff;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  margin-top: 0.15rem;
}

.am-badge-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
}

.am-badge-year {
  font-size: 0.9rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.am-badge-sep {
  opacity: 0.5;
}

.am-badge-jubilee {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #ffd79a;
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

.parasha-card.current-week {
  border: 2px solid #8B4513;
  background: linear-gradient(145deg, #fffcf5, #fff8e8);
  box-shadow: 0 0 0 4px rgba(139,69,19,0.12), 0 4px 16px rgba(139,69,19,0.15);
}

.parasha-card.current-week:hover {
  box-shadow: 0 0 0 4px rgba(139,69,19,0.15), 0 8px 24px rgba(139,69,19,0.2);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.week-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.week-badge {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #4b5563;
}

.dss-date-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #1e3a5f, #2563eb);
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  letter-spacing: 0.03em;
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

.parasha-meaning {
  font-size: 0.78rem;
  font-style: italic;
  color: #6b7280;
  line-height: 1.4;
}

.parasha-note {
  font-size: 0.82rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
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

.torah-block .reading-label { color: #92400e; }
.nc-block .reading-label { color: #1e40af; }
.reading-icon { flex-shrink: 0; }

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

/* Tab Toggle */
.view-tabs {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.4rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #6b7280;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.02em;
}

.tab-btn:hover {
  border-color: #8B4513;
  color: #8B4513;
  background: #FFF8DC;
}

.tab-btn.active {
  background: linear-gradient(135deg, #8B4513, #c0763a);
  border-color: transparent;
  color: #fff;
}

/* By Month view */
.by-month-container {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.month-section {
  border-radius: 16px;
  border: 1.5px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.month-section.current-month-section {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12), 0 4px 16px rgba(37,99,235,0.1);
}

.month-section-header {
  background: #f8fafc;
  border-bottom: 1.5px solid #e5e7eb;
  padding: 1rem 1.25rem;
}

.current-month-section .month-section-header {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-bottom-color: #bfdbfe;
}

.month-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.month-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.month-num-badge {
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #1e3a5f, #2563eb);
  padding: 0.25rem 0.65rem;
  border-radius: 10px;
  letter-spacing: 0.04em;
}

.month-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.current-month-pill {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  padding: 0.15rem 0.55rem;
  border-radius: 20px;
  letter-spacing: 0.06em;
}

.month-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.gregorian-range {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  background: #fff;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.day-range-label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.month-parshas-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1.1rem;
  background: #fff;
}


/* Responsive */
@media (max-width: 1100px) {
  .parashot-grid,
  .month-parshas-grid {
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

  .parashot-grid,
  .month-parshas-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .month-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .view-tabs {
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tab-btn {
    padding: 0.45rem 0.9rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .weekly-page {
    padding: 0.75rem 0.75rem 2rem;
  }

  .parashot-grid,
  .month-parshas-grid {
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

/* AM / Jubilee info icon */
.am-jubilee-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.15rem;
}

.info-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(139, 69, 19, 0.4);
  background: rgba(255, 248, 220, 0.25);
  color: #c0763a;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.info-icon-btn:hover {
  background: #fff8dc;
  border-color: #8B4513;
  color: #8B4513;
}

/* Modal overlay */
.am-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.am-modal {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.am-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem;
  border-bottom: 1.5px solid #e5e7eb;
  background: linear-gradient(135deg, #3b1200, #8B4513);
  border-radius: 16px 16px 0 0;
}

.am-modal-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.01em;
}

.am-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;
  padding: 0;
  flex-shrink: 0;
}

.am-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.am-modal-body {
  overflow-y: auto;
  padding: 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.info-section h3 {
  font-size: 0.88rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8B4513;
  margin: 0 0 0.6rem;
}

.info-section p {
  font-size: 0.88rem;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 0.5rem;
}

.formula-box {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: #FFF8DC;
  border: 1px solid #DEB887;
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  margin: 0.5rem 0;
}

.formula-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400e;
  white-space: nowrap;
}

.formula-box code {
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c2d12;
}

.example-text {
  font-size: 0.82rem !important;
  color: #6b7280 !important;
}

.cycle-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.cycle-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.cycle-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, #8B4513, #c0763a);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
  flex-shrink: 0;
  margin-top: 1px;
  font-family: monospace;
}

.cycle-item div {
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.5;
}

.ref-example-box {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 0.55rem 0.9rem;
  margin: 0.3rem 0 0.6rem;
}

.ref-code {
  font-family: monospace;
  font-size: 1.05rem;
  font-weight: 800;
  color: #7c2d12;
  letter-spacing: 0.06em;
}

.ref-arrow {
  font-size: 0.78rem;
  color: #6b7280;
  font-style: italic;
}

.reading-list {
  margin: 0.4rem 0 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.reading-list li {
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.5;
}

.formula-steps {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 0.6rem;
}

.formula-step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8B4513;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
}

.formula-step code {
  font-size: 0.78rem;
  color: #7c2d12;
  font-weight: 600;
  flex: 1;
}

.step-note {
  font-size: 0.72rem;
  color: #9ca3af;
  white-space: nowrap;
}

.note-text {
  font-size: 0.82rem !important;
  color: #6b7280 !important;
  font-style: italic;
}

.note-text code {
  font-style: normal;
  background: #f3f4f6;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #374151;
}

@media (max-width: 480px) {
  .am-modal-body {
    padding: 1rem;
  }

  .formula-step {
    flex-wrap: wrap;
  }

  .step-note {
    white-space: normal;
  }
}

/* ── Rosh Chodesh tab button variant ─────────────────────── */
.tab-btn--purple:not(.active) {
  border-color: #D8B4FE;
  color: #6B21A8;
}

.tab-btn--purple:not(.active):hover {
  border-color: #6B21A8;
  background: #F3E8FF;
  color: #6B21A8;
}

.tab-btn--purple.active {
  background: linear-gradient(135deg, #6B21A8, #9333ea);
}

/* ── Rosh Chodesh view ───────────────────────────────────── */
.rosh-chodesh-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rosh-chodesh-intro {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #6B21A8;
  background: #F3E8FF;
  border: 1px solid #D8B4FE;
  border-radius: 50px;
  padding: 0.5rem 1.2rem;
  text-align: center;
  align-self: center;
}

.rosh-chodesh-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.rc-card {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.rc-card:hover {
  box-shadow: 0 6px 20px rgba(107, 33, 168, 0.12);
  transform: translateY(-2px);
}

.rc-card--current {
  border: 2px solid #6B21A8;
  box-shadow: 0 0 0 4px rgba(107, 33, 168, 0.12), 0 4px 16px rgba(107, 33, 168, 0.15);
}

.rc-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #6B21A8, #9333ea);
  flex-wrap: wrap;
}

.rc-month-badge {
  font-size: 0.78rem;
  font-weight: 900;
  color: #fff;
  background: rgba(255,255,255,0.2);
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  letter-spacing: 0.04em;
}

.rc-month-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  flex: 1;
}

.rc-current-pill {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6B21A8;
  background: #fff;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
}

.rc-refs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
}

.rc-ref-btn {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  background: #F3E8FF;
  border: 1px solid #D8B4FE;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6B21A8;
  cursor: pointer;
  line-height: 1.45;
  transition: all 0.15s ease;
}

.rc-ref-btn svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #6B21A8;
}

.rc-ref-btn:hover {
  background: #6B21A8;
  border-color: #6B21A8;
  color: #fff;
}

.rc-ref-btn:hover svg {
  color: #fff;
}

@media (max-width: 1100px) {
  .rosh-chodesh-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .rosh-chodesh-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .rosh-chodesh-grid {
    grid-template-columns: 1fr;
  }
}
</style>
