import { ref, watch } from 'vue';
import type { VerseAudioLanguage } from '@/utils/collectionReferences';

const STORAGE_KEY = 'rstne-audio-language';

const audioLang = ref<VerseAudioLanguage>(
  (localStorage.getItem(STORAGE_KEY) as VerseAudioLanguage | null) || 'te'
);

watch(audioLang, (val) => {
  localStorage.setItem(STORAGE_KEY, val);
});

export function useAudioLanguage() {
  return { audioLang };
}
