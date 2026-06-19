import { reactive, watch } from 'vue';

export interface ReaderSettings {
  showEnglish: boolean;
  showTelugu: boolean;
  showNotes: boolean;
  showCrossReferences: boolean;
  showSuperscript: boolean;
  fontSize: number;
  boldVerseText: boolean;
  broadcastMode: boolean;
}

const STORAGE_KEY = 'rstne-settings';

const defaultSettings: ReaderSettings = {
  showEnglish: true,
  showTelugu: true,
  showNotes: true,
  showCrossReferences: false,
  showSuperscript: true,
  fontSize: 16,
  boldVerseText: true,
  broadcastMode: false
};

const settings = reactive<ReaderSettings>({ ...defaultSettings });

const savedSettings = localStorage.getItem(STORAGE_KEY);
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    Object.assign(settings, parsed);
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
  }
}

watch(settings, (newSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
}, { deep: true });

export function useReaderSettings() {
  return { settings };
}
