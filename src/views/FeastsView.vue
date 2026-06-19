<template>
  <div class="feasts-page" :class="{ 'broadcast-mode': settings.broadcastMode }">
    <!-- Header -->
    <header class="feasts-header">
      <router-link to="/" class="back-link">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Home
      </router-link>
      <div class="header-content">
        <h1 class="header-title">
          <span class="header-icon">🕍</span>
          Annual Feasts · Moadeem
        </h1>
        <p class="header-sub">YaHUaH's Appointed Times — Leviticus 23</p>
      </div>
      <button class="settings-btn" @click="showSettingsModal = true" title="Settings" aria-label="Open settings">
        <span class="settings-label">SE</span>
      </button>
    </header>

    <!-- Season groups -->
    <div class="feasts-body">
      <div v-for="season in SEASONS" :key="season.id" class="season-section">
        <div class="season-header" :style="{ '--season-color': season.color }">
          <span class="season-icon">{{ season.icon }}</span>
          <span class="season-name">{{ season.name }}</span>
          <span class="season-months">{{ season.months }}</span>
        </div>

        <div class="feast-cards">
          <div
            v-for="feast in feast_by_season(season.id)"
            :key="feast.id"
            class="feast-card"
            :style="{ '--feast-color': feast.color }"
          >
            <!-- Card header -->
            <div class="card-head">
              <div class="date-badge">
                <span class="date-month">{{ feast.monthLabel }}</span>
                <span class="date-day">{{ feast.dayLabel }}</span>
              </div>
              <div class="feast-names">
                <h2 class="feast-title">{{ feast.name }}</h2>
                <p class="feast-hebrew">{{ feast.hebrewName }}</p>
              </div>
            </div>

            <!-- Description -->
            <p class="feast-desc">{{ feast.description }}</p>

            <!-- Verse references -->
            <div class="refs-section">
              <div class="refs-label">Readings</div>
              <div class="refs-list">
                <template v-for="ref in feast.refs" :key="ref.label">
                  <button
                    v-if="ref.book"
                    class="ref-pill linked"
                    @click="navigateRef(ref)"
                    :title="`Open ${ref.label}`"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    {{ ref.label }}
                  </button>
                  <span v-else class="ref-pill unlinked" :title="ref.label + ' — not yet in RSTNE database'">
                    {{ ref.label }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Special notes -->
            <div v-if="feast.note" class="feast-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {{ feast.note }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="settings.broadcastMode" class="feasts-broadcast-panel" aria-hidden="true"></div>

    <Settings :is-open="showSettingsModal" @close="showSettingsModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Settings from '@/components/Settings.vue';
import { useReaderSettings } from '@/composables/useReaderSettings';

const router = useRouter();
const showSettingsModal = ref(false);
const { settings } = useReaderSettings();

interface VerseRef {
  label: string;
  book?: string;
  chapter?: number;
  verse?: number;
}

interface Feast {
  id: string;
  season: string;
  name: string;
  hebrewName: string;
  monthLabel: string;
  dayLabel: string;
  color: string;
  description: string;
  refs: VerseRef[];
  note?: string;
}

const SEASONS = [
  { id: 'spring', name: 'Spring Feasts',    icon: '🌿', months: 'Month 1 · Aviv',                 color: '#059669' },
  { id: 'summer', name: 'Summer Feasts',    icon: '☀️', months: 'Month 3 · Mid-Year',              color: '#d97706' },
  { id: 'fall',   name: 'Fall Feasts',      icon: '🍂', months: 'Month 7 · Ethanim',               color: '#be123c' },
  { id: 'other',  name: 'Additional Feasts',icon: '✡️', months: 'Purim · Chanukah',                color: '#1d4ed8' },
];

const FEASTS: Feast[] = [
  // ── SPRING ────────────────────────────────────────────────────────────────
  {
    id: 'passover',
    season: 'spring',
    name: 'Passover Night',
    hebrewName: 'Pesach',
    monthLabel: 'Aviv',
    dayLabel: '14',
    color: '#be123c',
    description: 'The memorial of YaHUaH delivering Israel from Egypt. Observed on the night of Aviv 14, always on a Tuesday night. The lamb is slain and its blood applied to the doorposts. Follow the Passover Booklet for the full observance.',
    refs: [],
    note: 'Use the Passover Booklet for the full Seder observance.',
  },
  {
    id: 'unleavened-bread',
    season: 'spring',
    name: 'Feast of Unleavened Bread',
    hebrewName: 'Chag HaMatzoth',
    monthLabel: 'Aviv',
    dayLabel: '15–21',
    color: '#d97706',
    description: 'Seven days of eating unleavened bread, commemorating the haste of the Exodus. The first and seventh days are High Sabbaths. Remove all leaven from your dwellings.',
    refs: [
      { label: 'Leviticus 23:4–14',  book: 'leviticus',  chapter: 23, verse: 4  },
      { label: 'Exodus 12',          book: 'exodus',     chapter: 12              },
      { label: 'Exodus 13',          book: 'exodus',     chapter: 13              },
      { label: 'Jubilees 49',        book: 'jubilees',   chapter: 49              },
    ],
  },
  {
    id: 'firstfruit-singular',
    season: 'spring',
    name: 'Resurrection Shabbat · First Fruit',
    hebrewName: 'Yom HaBikkur — Singular',
    monthLabel: 'Aviv',
    dayLabel: '18',
    color: '#059669',
    description: 'The day YaHUShA rose from the dead as the First Fruit of the resurrection — the singular First Fruit wave-sheaf offered on the third day after Passover, Aviv 18, which always falls on the weekly Shabbat within Unleavened Bread.',
    refs: [
      { label: 'Matthew 28',             book: 'matthew',           chapter: 28       },
      { label: 'Mark 16',                book: 'mark',              chapter: 16       },
      { label: 'Luke 24',                book: 'luke',              chapter: 24       },
      { label: 'John 20',                book: 'john',              chapter: 20       },
      { label: 'John 21',                book: 'john',              chapter: 21       },
      { label: '1 Corinthians 15',       book: 'first-corinthians', chapter: 15       },
    ],
  },
  {
    id: 'firstfruits-plural',
    season: 'spring',
    name: 'First Fruits — Barley',
    hebrewName: 'Yom HaBikkur — Plural',
    monthLabel: 'Aviv',
    dayLabel: '26',
    color: '#16a34a',
    description: 'The plural first fruits — the barley harvest offering brought to YaHUaH on Aviv 26. Connected to the many saints who were resurrected at Messiah\'s death, representing the broader first fruits harvest.',
    refs: [
      { label: '1 Corinthians 15',       book: 'first-corinthians', chapter: 15       },
      { label: 'Matthew 27:45–54',       book: 'matthew',           chapter: 27, verse: 45 },
    ],
  },
  // ── SUMMER ────────────────────────────────────────────────────────────────
  {
    id: 'shavuot',
    season: 'summer',
    name: 'Feast of Weeks',
    hebrewName: 'Shavuot',
    monthLabel: 'Month 3',
    dayLabel: 'Day 15',
    color: '#1d4ed8',
    description: 'Fifty days from the First Fruit wave-sheaf. YaHUaH gave the Torah at Sinai and the Ruach HaKodesh was poured out at Jerusalem. A High Sabbath with wheat harvest offerings. Read the Book of Ruth.',
    refs: [
      { label: 'Exodus 19',              book: 'exodus',            chapter: 19       },
      { label: 'Exodus 20',              book: 'exodus',            chapter: 20       },
      { label: 'Jubilees 1',             book: 'jubilees',          chapter: 1        },
      { label: 'Leviticus 23:15–22',     book: 'leviticus',         chapter: 23, verse: 15 },
      { label: 'Ruth 1–4',               book: 'ruth',              chapter: 1        },
      { label: 'Acts 2:1–47',            book: 'acts',              chapter: 2, verse: 1  },
    ],
  },
  {
    id: 'mid-year',
    season: 'summer',
    name: 'Mid-Year Firstfruit Feasts',
    hebrewName: 'Tirosh · Shemen · Eytzeem',
    monthLabel: 'Months 4–6',
    dayLabel: 'New Wine · Oil · Wood',
    color: '#b45309',
    description: 'Three mid-year feasts of new wine (Tirosh Chadash), new oil (Shemen Chadash), and new wood (Eytzeem Chadashem). These offerings mark the successive harvests of wine, olive oil, and wood for the altar throughout the summer months.',
    refs: [
      { label: 'Exodus 34:1–23',         book: 'exodus',    chapter: 34, verse: 1  },
      { label: 'Nehemiah 10',            book: 'nehemiah',  chapter: 10              },
      { label: 'Jubilees 7:36',          book: 'jubilees',  chapter: 7,  verse: 36 },
      { label: 'Jubilees 13:26',         book: 'jubilees',  chapter: 13, verse: 26 },
      { label: 'Jubilees 21:12–14',      book: 'jubilees',  chapter: 21, verse: 12 },
    ],
  },
  // ── FALL ──────────────────────────────────────────────────────────────────
  {
    id: 'trumpets',
    season: 'fall',
    name: 'Feast of Trumpets',
    hebrewName: 'Yom Terumah',
    monthLabel: 'Month 7',
    dayLabel: 'Day 1',
    color: '#7c3aed',
    description: 'The blowing of trumpets on the first day of the seventh month. A High Sabbath of memorial. Prophetically points to the resurrection of the dead, the return of Messiah, and the ingathering of Israel.',
    refs: [
      { label: 'Genesis 22',             book: 'genesis',              chapter: 22       },
      { label: 'Numbers 29:1–6',         book: 'numbers',              chapter: 29, verse: 1  },
      { label: 'Jubilees 18:1–17',       book: 'jubilees',             chapter: 18, verse: 1  },
      { label: 'Jeremiah 31',            book: 'jeremiah',             chapter: 31       },
      { label: 'Matthew 24:26–51',       book: 'matthew',              chapter: 24, verse: 26 },
      { label: 'Revelation 19:1–21',     book: 'revelation',           chapter: 19, verse: 1  },
      { label: '1 Thessalonians 4:13–18',book: 'first-thessalonians',  chapter: 4,  verse: 13 },
    ],
  },
  {
    id: 'atonement',
    season: 'fall',
    name: 'Day of Atonements',
    hebrewName: 'Yom HaKippurim',
    monthLabel: 'Month 7',
    dayLabel: 'Day 10',
    color: '#991b1b',
    description: 'The most solemn day of the year — a complete fast, a Sabbath of Sabbaths. The High Priest entered the Most Set-Apart Place with the blood of atonement. Prophetically fulfilled by YaHUShA as our eternal High Priest.',
    refs: [
      { label: 'Leviticus 16',           book: 'leviticus', chapter: 16       },
      { label: 'Numbers 29:7–11',        book: 'numbers',   chapter: 29, verse: 7  },
      { label: 'Isaiah 52:13',           book: 'isaiah',    chapter: 52, verse: 13 },
      { label: 'Isaiah 53',              book: 'isaiah',    chapter: 53       },
      { label: 'Hebrews 7',              book: 'hebrews',   chapter: 7        },
      { label: 'Hebrews 8',              book: 'hebrews',   chapter: 8        },
      { label: 'Hebrews 9',              book: 'hebrews',   chapter: 9        },
      { label: 'Hebrews 10',             book: 'hebrews',   chapter: 10       },
    ],
  },
  {
    id: 'sukkot',
    season: 'fall',
    name: 'Feast of Tents · Tabernacles',
    hebrewName: 'Sukkot',
    monthLabel: 'Month 7',
    dayLabel: 'Days 15–21',
    color: '#ea580c',
    description: 'Seven days of dwelling in booths, commemorating Israel\'s wilderness journey and pointing to YaHUaH tabernacling with His people in the Millennial Kingdom. The first and last days are High Sabbaths. Rejoice before YaHUaH!',
    refs: [
      { label: 'Leviticus 23:34–44',     book: 'leviticus', chapter: 23, verse: 34 },
      { label: 'Jubilees 16',            book: 'jubilees',  chapter: 16       },
      { label: 'Zechariah 14:16–21',     book: 'zechariah', chapter: 14, verse: 16 },
      { label: 'Nehemiah 8:1–18',        book: 'nehemiah',  chapter: 8,  verse: 1  },
      { label: 'Matthew 17:1–23',        book: 'matthew',   chapter: 17, verse: 1  },
    ],
  },
  {
    id: 'eighth-day',
    season: 'fall',
    name: 'Closing Assembly · Eighth Day',
    hebrewName: 'Shemenee Atzereth',
    monthLabel: 'Month 7',
    dayLabel: 'Day 22',
    color: '#1e40af',
    description: 'The eighth day following Sukkot — a separate High Sabbath assembly. Prophetically pictures eternity, the new heavens and new earth, and the final chapter of YaHUaH\'s redemptive plan when all things are made new.',
    refs: [
      { label: 'Leviticus 23:36–44',     book: 'leviticus',  chapter: 23, verse: 36 },
      { label: 'Numbers 29:35–39',       book: 'numbers',    chapter: 29, verse: 35 },
      { label: 'Jubilees 32:17–29',      book: 'jubilees',   chapter: 32, verse: 17 },
      { label: 'Isaiah 66:1–24',         book: 'isaiah',     chapter: 66, verse: 1  },
      { label: 'Revelation 22:1–21',     book: 'revelation', chapter: 22, verse: 1  },
    ],
  },
  // ── OTHER ─────────────────────────────────────────────────────────────────
  {
    id: 'purim',
    season: 'other',
    name: 'Feast of Lots',
    hebrewName: 'Purim',
    monthLabel: 'Month 12',
    dayLabel: 'Days 14–15',
    color: '#0891b2',
    description: 'Commemorates YaHUaH\'s deliverance of the Jewish people through Esther and Mordecai from Haman\'s plot. A day of feasting, joy, and giving gifts. Read the complete Scroll of Esther.',
    refs: [
      { label: 'Exodus 17:8–16',         book: 'exodus',  chapter: 17, verse: 8 },
      { label: 'Esther 1',               book: 'esther',  chapter: 1            },
    ],
    note: 'Read all chapters of the Scroll of Esther.',
  },
  {
    id: 'chanukah',
    season: 'other',
    name: 'Feast of Rededication',
    hebrewName: 'Chanukah',
    monthLabel: 'Month 9',
    dayLabel: 'Days 25–',
    color: '#0369a1',
    description: 'Eight-day feast of rededication celebrating the rededication of the Temple by the Maccabees after its defilement by Antiochus IV Epiphanes. YaHUShA walked in Solomon\'s Porch during this feast (John 10). Light increases each night.',
    refs: [
      { label: 'John 10',                book: 'john',    chapter: 10       },
      { label: '1 Maccabees' },
      { label: '2 Maccabees' },
    ],
    note: '1st and 2nd Maccabees are not yet available in the RSTNE database.',
  },
];

function feast_by_season(seasonId: string): Feast[] {
  return FEASTS.filter(f => f.season === seasonId);
}

function navigateRef(ref: VerseRef) {
  if (!ref.book || !ref.chapter) return;
  router.push({
    name: 'book-chapter-verse',
    params: {
      bookName: ref.book,
      chapterNumber: String(ref.chapter),
      ...(ref.verse ? { verseNumber: String(ref.verse) } : {}),
    },
  });
}
</script>

<style scoped>
/* ── Page ───────────────────────────────────────────────────────────── */
.feasts-page {
  min-height: 100vh;
  background: #f8f4ec;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.feasts-page.broadcast-mode {
  padding-right: max(30vw, 320px);
}

.feasts-broadcast-panel {
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

/* ── Header ─────────────────────────────────────────────────────────── */
.feasts-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(135deg, #1a0a00 0%, #3b1a00 55%, #1a0a00 100%);
  color: white;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 2px 14px rgba(0,0,0,0.35);
}

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
  margin-left: auto;
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
  font-size: 0.84rem;
  padding: 0.35rem 0.65rem;
  border-radius: 7px;
  background: rgba(255,255,255,0.1);
  transition: background 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
}
.back-link:hover { background: rgba(255,255,255,0.2); color: white; }

.header-content { display: flex; flex-direction: column; gap: 0.1rem; }

.header-title {
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.header-icon { font-size: 1.2rem; }

.header-sub {
  color: rgba(255,255,255,0.55);
  font-size: 0.75rem;
  margin: 0;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.feasts-body {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* ── Season header ──────────────────────────────────────────────────── */
.season-section { display: flex; flex-direction: column; gap: 1rem; }

.season-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 1rem;
  background: color-mix(in srgb, var(--season-color) 10%, white);
  border-left: 4px solid var(--season-color);
  border-radius: 0 10px 10px 0;
}

.season-icon { font-size: 1.1rem; }

.season-name {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--season-color);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.season-months {
  font-size: 0.72rem;
  color: #6b7280;
  font-weight: 500;
}

/* ── Feast cards grid ───────────────────────────────────────────────── */
.feast-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* ── Single feast card ──────────────────────────────────────────────── */
.feast-card {
  background: white;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  border-top: 4px solid var(--feast-color);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.2s, transform 0.15s;
}

.feast-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

/* ── Card head ──────────────────────────────────────────────────────── */
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  background: color-mix(in srgb, var(--feast-color) 10%, white);
  border: 1.5px solid color-mix(in srgb, var(--feast-color) 25%, white);
  border-radius: 10px;
  padding: 0.4rem 0.5rem;
  flex-shrink: 0;
}

.date-month {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--feast-color);
  line-height: 1.2;
  text-align: center;
}

.date-day {
  font-size: 1rem;
  font-weight: 900;
  color: var(--feast-color);
  line-height: 1.15;
  text-align: center;
}

.feast-names { flex: 1; min-width: 0; }

.feast-title {
  font-size: 0.97rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.15rem;
  line-height: 1.3;
}

.feast-hebrew {
  font-size: 0.72rem;
  color: var(--feast-color);
  font-weight: 600;
  margin: 0;
  opacity: 0.85;
  letter-spacing: 0.02em;
}

/* ── Description ────────────────────────────────────────────────────── */
.feast-desc {
  font-size: 0.82rem;
  color: #4b5563;
  line-height: 1.65;
  margin: 0;
}

/* ── Refs ───────────────────────────────────────────────────────────── */
.refs-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.refs-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9ca3af;
}

.refs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.ref-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.6rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1.5px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.ref-pill.linked {
  background: color-mix(in srgb, var(--feast-color) 8%, white);
  border-color: color-mix(in srgb, var(--feast-color) 35%, white);
  color: var(--feast-color);
}

.ref-pill.linked:hover {
  background: var(--feast-color);
  border-color: var(--feast-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.ref-pill.unlinked {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: default;
  font-style: italic;
}

/* ── Note ───────────────────────────────────────────────────────────── */
.feast-note {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.4rem 0.65rem;
  line-height: 1.5;
}

.feast-note svg { flex-shrink: 0; margin-top: 1px; }

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .feast-cards { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .feasts-header { padding: 0.65rem 0.9rem; gap: 0.75rem; }
  .header-title { font-size: 1.05rem; }
  .header-sub { display: none; }
  .feasts-body { padding: 1rem 0.85rem 3rem; gap: 2rem; }
  .feast-card { padding: 0.9rem 0.95rem; }
  .date-badge { min-width: 52px; }
  .feast-title { font-size: 0.9rem; }
  .feast-desc { font-size: 0.78rem; }
  .ref-pill { font-size: 0.68rem; padding: 0.18rem 0.5rem; }

  .feasts-page.broadcast-mode { padding-right: 0.85rem; }
  .feasts-broadcast-panel { display: none; }
}
</style>
