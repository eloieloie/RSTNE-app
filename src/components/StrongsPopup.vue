<template>
  <Teleport to="body">
    <div v-if="code" class="strongs-backdrop" @click.self="emit('close')">
      <section class="strongs-card" role="dialog" aria-modal="true" :aria-label="`Strong's ${current}`" @keydown.esc="emit('close')" tabindex="-1" ref="cardRef">
        <header class="strongs-header">
          <span class="strongs-badge" :class="isHebrew ? 'hebrew' : 'greek'">{{ current }}</span>
          <span class="strongs-lang">{{ isHebrew ? 'Hebrew' : 'Greek' }}</span>
          <span class="strongs-spacer"></span>
          <button v-if="trail.length" class="strongs-back" type="button" @click="goBack">← {{ trail[trail.length - 1] }}</button>
          <button class="strongs-close" type="button" aria-label="Close" @click="emit('close')">&times;</button>
        </header>

        <div v-if="loading" class="strongs-state">Loading…</div>
        <div v-else-if="!entry" class="strongs-state">No lexicon entry found for {{ current }}.</div>
        <div v-else class="strongs-body">
          <p class="strongs-lemma" :dir="isHebrew ? 'rtl' : 'ltr'" :lang="isHebrew ? 'he' : 'el'">{{ entry.l }}</p>
          <p class="strongs-translit">
            <em>{{ entry.x }}</em>
            <span v-if="entry.p" class="strongs-pron"> · {{ entry.p }}</span>
          </p>
          <p v-if="entry.s" class="strongs-def">{{ entry.s }}</p>
          <p v-if="entry.k" class="strongs-field"><span class="strongs-label">KJV usage</span> {{ entry.k }}</p>
          <p v-if="entry.d" class="strongs-field">
            <span class="strongs-label">Derivation</span>
            <template v-for="(seg, i) in derivationSegments" :key="i">
              <button v-if="seg.code" type="button" class="strongs-link" @click="open(seg.text)">{{ seg.text }}</button>
              <template v-else>{{ seg.text }}</template>
            </template>
          </p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

interface LexiconEntry {
  l?: string; // lemma (original-language word)
  x?: string; // transliteration
  p?: string; // pronunciation
  d?: string; // derivation
  s?: string; // Strong's definition
  k?: string; // KJV usage
}

const props = defineProps<{ code: string | null }>();
const emit = defineEmits<{ (e: 'close'): void }>();

// Each language file is a separate lazy chunk, fetched on first use and then cached.
const loaders = {
  H: () => import('@/data/strongs/hebrew.json'),
  G: () => import('@/data/strongs/greek.json'),
};
const cache: Partial<Record<'H' | 'G', Record<string, LexiconEntry>>> = {};

const current = ref('');
const trail = ref<string[]>([]);
const entry = ref<LexiconEntry | null>(null);
const loading = ref(false);
const cardRef = ref<HTMLElement | null>(null);

const isHebrew = computed(() => current.value.startsWith('H'));

const derivationSegments = computed(() => {
  const text = entry.value?.d ?? '';
  const out: { text: string; code: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(/\b[HG]\d{1,4}\b/g)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: text.slice(last, start), code: false });
    out.push({ text: m[0], code: true });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), code: false });
  return out;
});

async function lookup(code: string) {
  current.value = code;
  loading.value = true;
  entry.value = null;
  const kind = code[0] as 'H' | 'G';
  try {
    if (!cache[kind]) cache[kind] = (await loaders[kind]()).default as Record<string, LexiconEntry>;
    // Ignore a stale response if the user already moved on to another code.
    if (current.value !== code) return;
    entry.value = cache[kind]![String(parseInt(code.slice(1), 10))] ?? null;
  } catch {
    if (current.value === code) entry.value = null;
  } finally {
    if (current.value === code) loading.value = false;
  }
}

function open(code: string) {
  trail.value.push(current.value);
  lookup(code);
}

function goBack() {
  const prev = trail.value.pop();
  if (prev) lookup(prev);
}

watch(
  () => props.code,
  async (code) => {
    trail.value = [];
    if (!code) return;
    // Codes may carry a trailing sense letter (H6086a); the lexicon keys on the number alone.
    await lookup(code.replace(/[a-z]$/, ''));
    await nextTick();
    cardRef.value?.focus();
  },
  { immediate: true },
);
</script>

<style scoped>
.strongs-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.35);
}

.strongs-card {
  width: min(480px, 100%);
  max-height: 80vh;
  overflow-y: auto;
  background: var(--color-background, #fff);
  color: var(--color-foreground, #1f2937);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  outline: none;
}

.strongs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.strongs-badge {
  font-weight: 700;
  font-size: 0.9rem;
  padding: 2px 10px;
  border-radius: 999px;
  color: #fff;
}
.strongs-badge.hebrew { background: #8B4513; }
.strongs-badge.greek { background: #1E40AF; }

.strongs-lang { color: var(--color-muted-foreground, #6b7280); font-size: 0.85rem; }

.strongs-back,
.strongs-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary, #1E40AF);
  cursor: pointer;
  font: inherit;
  text-decoration: underline dotted;
}
.strongs-spacer { flex: 1; }
.strongs-back { font-size: 0.85rem; }
.strongs-link { font-weight: 600; }

.strongs-close {
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-muted-foreground, #6b7280);
  min-width: 36px;
  min-height: 36px;
}

.strongs-body { padding: 16px; }
.strongs-state { padding: 24px 16px; text-align: center; color: var(--color-muted-foreground, #6b7280); }

.strongs-lemma {
  margin: 0;
  font-size: 2.2rem;
  line-height: 1.3;
  font-family: 'SBL Hebrew', 'Ezra SIL', 'Times New Roman', serif;
}
.strongs-translit { margin: 4px 0 12px; font-size: 1.05rem; }
.strongs-pron { color: var(--color-muted-foreground, #6b7280); }
.strongs-def { margin: 0 0 12px; font-size: 1.05rem; line-height: 1.5; }
.strongs-field { margin: 0 0 10px; font-size: 0.9rem; line-height: 1.5; }
.strongs-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted-foreground, #6b7280);
}
</style>
