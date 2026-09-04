<template>
  <AnimatePresence>
    <motion.div
      v-if="isOpen"
      class="modal-overlay"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="overlayFade"
      @click="close"
    >
    <motion.div
      class="modal-content"
      :initial="prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }"
      :animate="{ opacity: 1, scale: 1, y: 0 }"
      :exit="{ opacity: 0, scale: 0.94, y: 8 }"
      :transition="tooltipSpring"
      @click.stop
    >
      <div class="modal-header">
        <h3>Settings</h3>
        <motion.button class="close-button" :while-tap="tapScale" @click="close">&times;</motion.button>
      </div>
      <div class="modal-body">
        <div class="settings-section">
          <h4>Account</h4>
          <div class="settings-group">
            <div v-if="user" class="account-info">
              <div class="account-details">
                <span class="account-email">{{ user.email }}</span>
                <span v-if="isAdmin" class="admin-badge">Admin</span>
              </div>
              <motion.button class="account-btn" :while-tap="tapScale" @click="handleSignOut">Sign Out</motion.button>
            </div>
            <router-link v-else to="/login" class="account-btn account-btn-primary" @click="close">
              Sign In / Register
            </router-link>
            <motion.button v-if="canClaimAdmin" class="account-btn claim-admin-btn" :while-tap="tapScale" @click="handleClaimAdmin">
              Become Admin
            </motion.button>
            <p v-if="claimError" class="claim-error">{{ claimError }}</p>
          </div>
        </div>

        <div class="settings-section">
          <h4>Appearance</h4>
          <div class="settings-group">
            <div class="theme-options">
              <motion.button
                v-for="opt in themeOptions"
                :key="opt.value"
                :class="['theme-option-btn', { active: theme === opt.value }]"
                :while-tap="tapScale"
                :aria-pressed="theme === opt.value"
                :title="opt.label"
                @click="theme = opt.value"
              >
                <span
                  class="theme-swatch"
                  :style="{ background: `linear-gradient(135deg, ${opt.swatch[0]} 50%, ${opt.swatch[1]} 50%)` }"
                  aria-hidden="true"
                ></span>
                <span class="theme-option-label">{{ opt.label }}</span>
              </motion.button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Book Names Language</h4>
          <div class="settings-group">
            <div class="lang-options">
              <motion.button
                v-for="opt in langOptions"
                :key="opt.value"
                :class="['lang-option-btn', { active: bookNameLanguage === opt.value }]"
                :while-tap="tapScale"
                @click="bookNameLanguage = opt.value"
              >{{ opt.label }}</motion.button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Audio Language</h4>
          <div class="settings-group">
            <div class="lang-options">
              <motion.button
                v-for="opt in audioLangOptions"
                :key="opt.value"
                :class="['lang-option-btn', { active: audioLang === opt.value }]"
                :while-tap="tapScale"
                @click="audioLang = opt.value"
              >{{ opt.label }}</motion.button>
            </div>
            <p class="setting-hint">Used when playing chapter audio. Tap the play button in the top bar to start.</p>
          </div>
        </div>

        <div class="settings-section">
          <h4>Display Mode</h4>
          <div class="settings-group">
            <label class="setting-item">
              <span>Broadcast Mode</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('broadcastMode')"
                :class="['toggle-switch', { active: settings.broadcastMode }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Display Options</h4>
          <div class="settings-group">
            <label class="setting-item">
              <span>Show English Verse</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('showEnglish')"
                :class="['toggle-switch', { active: settings.showEnglish }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
            <label class="setting-item">
              <span>Show Telugu Verse</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('showTelugu')"
                :class="['toggle-switch', { active: settings.showTelugu }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
            <label class="setting-item">
              <span>Show Admin Notes</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('showAdminNotes')"
                :class="['toggle-switch', { active: settings.showAdminNotes }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
            <label class="setting-item">
              <span>Show My Notes</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('showMyNotes')"
                :class="['toggle-switch', { active: settings.showMyNotes }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
            <label class="setting-item">
              <span>Show Cross References</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('showCrossReferences')"
                :class="['toggle-switch', { active: settings.showCrossReferences }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
            <label class="setting-item">
              <span>Show Superscript</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('showSuperscript')"
                :class="['toggle-switch', { active: settings.showSuperscript }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Font Options</h4>
          <div class="settings-group">
            <div class="font-size-controls">
              <motion.button class="font-btn" :while-tap="tapScale" @click="decreaseFontSize" :disabled="settings.fontSize <= 12">A-</motion.button>
              <span class="font-size-display">{{ settings.fontSize }}px</span>
              <motion.button class="font-btn" :while-tap="tapScale" @click="increaseFontSize" :disabled="settings.fontSize >= 24">A+</motion.button>
            </div>
            <label class="setting-item">
              <span>Bold Verse Text</span>
              <motion.button
                :while-tap="tapScale"
                @click="toggleSetting('boldVerseText')"
                :class="['toggle-switch', { active: settings.boldVerseText }]"
              >
                <span class="toggle-slider"></span>
              </motion.button>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
    </motion.div>
  </AnimatePresence>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import { useBookLanguage, type BookNameLanguage } from '@/composables/useBookLanguage';
import { useAudioLanguage } from '@/composables/useAudioLanguage';
import type { VerseAudioLanguage } from '@/utils/collectionReferences';
import { useReaderSettings, type ReaderSettings } from '@/composables/useReaderSettings';
import { useAuth } from '@/composables/useAuth';
import { useMotionPresets } from '@/composables/useMotionPresets';
import { useTheme } from '@/composables/useTheme';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  settingsChange: [settings: ReaderSettings];
}>();

const { bookNameLanguage } = useBookLanguage();
const { audioLang } = useAudioLanguage();

const langOptions: { value: BookNameLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hebrew', label: 'Hebrew' },
  { value: 'telugu', label: 'Telugu' },
];

const audioLangOptions: { value: VerseAudioLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu' },
  { value: 'he', label: 'Hebrew' },
];

const { settings } = useReaderSettings();
const { theme, themeOptions } = useTheme();
const { user, isAdmin, canClaimAdmin, signOutUser, claimAdmin } = useAuth();
const { prefersReducedMotion, tooltipSpring, tapScale, overlayFade } = useMotionPresets();
const claimError = ref('');

async function handleSignOut() {
  await signOutUser();
}

async function handleClaimAdmin() {
  claimError.value = '';
  try {
    await claimAdmin();
  } catch (err) {
    claimError.value = err instanceof Error ? err.message : 'Failed to claim admin';
  }
}

// Emit initial and subsequent settings updates to parent consumers.
watch(settings, (newSettings) => {
  emit('settingsChange', { ...newSettings });
}, { deep: true, immediate: true });

// Toggle a boolean setting
function toggleSetting(key: keyof ReaderSettings) {
  if (typeof settings[key] === 'boolean') {
    (settings[key] as boolean) = !(settings[key] as boolean);
  }
}

// Font size controls
function increaseFontSize() {
  if (settings.fontSize < 24) {
    settings.fontSize += 1;
  }
}

function decreaseFontSize() {
  if (settings.fontSize > 12) {
    settings.fontSize -= 1;
  }
}

// Close modal
function close() {
  emit('close');
}
</script>

<style scoped>
/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: var(--color-card);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-foreground);
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--color-muted-foreground);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-button:hover {
  background: var(--color-muted);
}

.modal-body {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-foreground);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0;
}

.setting-item span {
  font-size: 1rem;
  color: var(--color-foreground);
}

/* Account section */
.account-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.account-email {
  font-size: 0.95rem;
  color: var(--color-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-badge {
  align-self: flex-start;
  background: #8B4513;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.account-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-muted);
  color: var(--color-foreground);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.account-btn:hover {
  border-color: var(--color-muted-foreground);
}

.account-btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #8B4513, #c0763a);
  border-color: transparent;
  color: #fff;
}

.account-btn-primary:hover {
  filter: brightness(1.05);
}

.claim-admin-btn {
  margin-top: 0.75rem;
  width: 100%;
  border-color: #8B4513;
  color: #8B4513;
  background: var(--color-card);
}

.claim-error {
  margin: 0.5rem 0 0;
  color: #b91c1c;
  font-size: 0.85rem;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  width: 50px;
  height: 26px;
  background: var(--color-border);
  border-radius: 13px;
  border: none;
  cursor: pointer;
  transition: background 0.3s;
  padding: 0;
}

.toggle-switch.active {
  background: #4CAF50;
}

.toggle-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: var(--color-card);
  border-radius: 50%;
  transition: left 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-slider {
  left: 27px;
}

/* Font size controls */
.font-size-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.font-btn {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.font-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.font-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.font-size-display {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-foreground);
  min-width: 60px;
  text-align: center;
}

.setting-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-muted-foreground);
  line-height: 1.4;
}

.lang-options {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.lang-option-btn {
  flex: 1;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-muted-foreground);
  transition: all 0.15s ease;
}

.lang-option-btn:hover {
  border-color: var(--color-muted-foreground);
  color: var(--color-foreground);
}

.lang-option-btn.active {
  background: #2c3e50;
  border-color: #2c3e50;
  color: #fff;
}

/* Theme picker */
.theme-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.theme-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.25rem;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  background: var(--color-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-option-btn:hover {
  border-color: var(--color-muted-foreground);
}

.theme-option-btn.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.theme-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
}

.theme-option-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-muted-foreground);
}

.theme-option-btn.active .theme-option-label {
  color: var(--color-foreground);
}
</style>
