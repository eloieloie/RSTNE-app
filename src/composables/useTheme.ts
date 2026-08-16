import { ref, watch } from 'vue';
import { useAuth } from './useAuth';
import { API_URL, getAuthHeaders } from '@/api/client';

export type ThemeName =
  | 'parchment'
  | 'midnight'
  | 'sepia'
  | 'slate'
  | 'sage'
  | 'rose'
  | 'ocean'
  | 'amethyst'
  | 'charcoal'
  | 'honey';

export interface ThemeOption {
  value: ThemeName;
  label: string;
  swatch: [string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'parchment', label: 'Parchment', swatch: ['#FAFAF8', '#7C2D12'] },
  { value: 'midnight', label: 'Midnight', swatch: ['#18160F', '#D08A54'] },
  { value: 'sepia', label: 'Sepia', swatch: ['#F1E4C5', '#7C2D12'] },
  { value: 'slate', label: 'Slate', swatch: ['#0E1420', '#6FA1E8'] },
  { value: 'sage', label: 'Sage', swatch: ['#F0F3E8', '#3F6B3B'] },
  { value: 'rose', label: 'Rose', swatch: ['#FBF0F1', '#9F3452'] },
  { value: 'ocean', label: 'Ocean', swatch: ['#EAF6F6', '#0E7C86'] },
  { value: 'amethyst', label: 'Amethyst', swatch: ['#17111F', '#C084E8'] },
  { value: 'charcoal', label: 'Charcoal', swatch: ['#121212', '#E0E0E0'] },
  { value: 'honey', label: 'Honey', swatch: ['#FDF3DC', '#B8791A'] },
];

const STORAGE_KEY = 'rstne-theme';
const VALID_THEMES = THEME_OPTIONS.map(t => t.value);

function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (VALID_THEMES as string[]).includes(value);
}

function loadInitialTheme(): ThemeName {
  const saved = localStorage.getItem(STORAGE_KEY);
  return isThemeName(saved) ? saved : 'parchment';
}

function applyTheme(value: ThemeName) {
  document.documentElement.setAttribute('data-theme', value);
}

const theme = ref<ThemeName>(loadInitialTheme());
applyTheme(theme.value);

// When true, the theme ref is being set from a remote fetch (login sync) —
// skip re-persisting the value we just received back to where it came from.
let suppressPersist = false;

const { user } = useAuth();

async function persistToAccount(value: ThemeName) {
  if (!user.value) return;
  try {
    await fetch(`${API_URL}/user-settings`, {
      method: 'POST',
      headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json', 'X-HTTP-Method-Override': 'PUT' },
      body: JSON.stringify({ theme: value }),
    });
  } catch (err) {
    console.error('Failed to save theme to account:', err);
  }
}

watch(theme, (value) => {
  localStorage.setItem(STORAGE_KEY, value);
  applyTheme(value);
  if (!suppressPersist) {
    persistToAccount(value);
  }
});

// On sign-in, the account's saved theme (if any) wins over what's in
// localStorage; if the account has no saved theme yet, push the current
// local choice up so it's there next time they sign in elsewhere.
watch(user, async (u) => {
  if (!u) return;
  try {
    const response = await fetch(`${API_URL}/user-settings`, { headers: await getAuthHeaders() });
    if (!response.ok) return;
    const data = await response.json();
    if (isThemeName(data.theme)) {
      suppressPersist = true;
      theme.value = data.theme;
      suppressPersist = false;
    } else {
      await persistToAccount(theme.value);
    }
  } catch (err) {
    console.error('Failed to load theme from account:', err);
  }
}, { immediate: true });

export function useTheme() {
  return { theme, themeOptions: THEME_OPTIONS };
}
