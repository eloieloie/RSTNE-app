import { ref, watch } from 'vue';

const STORAGE_KEY = 'rstne-audio-speed';
const MIN_SPEED = 0.85;
const MAX_SPEED = 1.15;

function clamp(val: number): number {
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, val));
}

const audioSpeed = ref<number>(
  clamp(Number(localStorage.getItem(STORAGE_KEY)) || 1)
);

watch(audioSpeed, (val) => {
  localStorage.setItem(STORAGE_KEY, String(val));
});

export function useAudioSpeed() {
  return { audioSpeed };
}
