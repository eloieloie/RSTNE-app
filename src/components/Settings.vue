<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Settings</h3>
        <button class="close-button" @click="close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="settings-section">
          <h4>Display Options</h4>
          <div class="settings-group">
            <label class="setting-item">
              <span>Show English Verse</span>
              <button 
                @click="toggleSetting('showEnglish')" 
                :class="['toggle-switch', { active: settings.showEnglish }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
            <label class="setting-item">
              <span>Show Telugu Verse</span>
              <button 
                @click="toggleSetting('showTelugu')" 
                :class="['toggle-switch', { active: settings.showTelugu }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
            <label class="setting-item">
              <span>Show Notes</span>
              <button 
                @click="toggleSetting('showNotes')" 
                :class="['toggle-switch', { active: settings.showNotes }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
            <label class="setting-item">
              <span>Show Cross References</span>
              <button 
                @click="toggleSetting('showCrossReferences')" 
                :class="['toggle-switch', { active: settings.showCrossReferences }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
            <label class="setting-item">
              <span>Show Superscript</span>
              <button 
                @click="toggleSetting('showSuperscript')" 
                :class="['toggle-switch', { active: settings.showSuperscript }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Font Options</h4>
          <div class="settings-group">
            <div class="font-size-controls">
              <button class="font-btn" @click="decreaseFontSize" :disabled="settings.fontSize <= 12">A-</button>
              <span class="font-size-display">{{ settings.fontSize }}px</span>
              <button class="font-btn" @click="increaseFontSize" :disabled="settings.fontSize >= 24">A+</button>
            </div>
            <label class="setting-item">
              <span>Bold Verse Text</span>
              <button 
                @click="toggleSetting('boldVerseText')" 
                :class="['toggle-switch', { active: settings.boldVerseText }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Device Options</h4>
          <div class="settings-group">
            <label class="setting-item">
              <span>E-Ink Mode</span>
              <button 
                @click="toggleSetting('eInkMode')" 
                :class="['toggle-switch', { active: settings.eInkMode }]"
              >
                <span class="toggle-slider"></span>
              </button>
            </label>
            <p class="setting-description">Optimizes display for E-Ink devices by disabling animations, using instant scrolling, and increasing contrast.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue';

interface Props {
  isOpen: boolean;
}

interface Settings {
  showEnglish: boolean;
  showTelugu: boolean;
  showNotes: boolean;
  showCrossReferences: boolean;
  showSuperscript: boolean;
  fontSize: number;
  boldVerseText: boolean;
  eInkMode: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  settingsChange: [settings: Settings];
}>();

// Settings state with localStorage persistence
const settings = reactive<Settings>({
  showEnglish: true,
  showTelugu: true,
  showNotes: true,
  showCrossReferences: true,
  showSuperscript: true,
  fontSize: 16,
  boldVerseText: true,
  eInkMode: false
});

// Load settings from localStorage on mount
onMounted(() => {
  const savedSettings = localStorage.getItem('rstne-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      Object.assign(settings, parsed);
      // Emit initial settings to parent
      emit('settingsChange', { ...settings });
    } catch (err) {
      console.error('Error loading settings from localStorage:', err);
    }
  } else {
    // Auto-detect E-Ink device with more specific patterns
    const userAgent = navigator.userAgent.toLowerCase();
    // Check for E-Ink device specific patterns and avoid false positives
    const isBoox = userAgent.includes('boox') || userAgent.includes('onyx boox');
    const isKindle = userAgent.includes('kindle') && (userAgent.includes('amazon') || userAgent.includes('kfapwi'));
    const isKobo = userAgent.includes('kobo'); // Many Kobo devices use just 'kobo' without 'ereader'
    const isPocketBook = userAgent.includes('pocketbook');
    const isRemarkable = userAgent.includes('remarkable');
    
    const isEInk = isBoox || isKindle || isKobo || isPocketBook || isRemarkable;
    
    if (isEInk) {
      settings.eInkMode = true;
    }
    
    // Emit default settings to parent
    emit('settingsChange', { ...settings });
  }
});

// Watch for settings changes and save to localStorage
watch(settings, (newSettings) => {
  localStorage.setItem('rstne-settings', JSON.stringify(newSettings));
  emit('settingsChange', { ...newSettings });
}, { deep: true });

// Toggle a boolean setting
function toggleSetting(key: keyof Settings) {
  if (typeof settings[key] === 'boolean') {
    (settings[key] as boolean) = !(settings[key] as boolean);
  }
}

// Font size controls
function increaseFontSize() {
  if (settings.fontSize < 24) {
    settings.fontSize += 2;
  }
}

function decreaseFontSize() {
  if (settings.fontSize > 12) {
    settings.fontSize -= 2;
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
  background: white;
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
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
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
  background: #f0f0f0;
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
  color: #444;
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
  color: #333;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  width: 50px;
  height: 26px;
  background: #ccc;
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
  background: white;
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
  color: #333;
  min-width: 60px;
  text-align: center;
}

.setting-description {
  font-size: 0.875rem;
  color: #666;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
  font-style: italic;
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  .modal-content {
    background: #2a2a2a;
  }

  .modal-header {
    border-bottom-color: #444;
  }

  .modal-header h3 {
    color: #fff;
  }

  .close-button {
    color: #aaa;
  }

  .close-button:hover {
    background: #3a3a3a;
  }

  .settings-section h4 {
    color: #ddd;
  }

  .setting-item span {
    color: #ddd;
  }

  .font-size-display {
    color: #ddd;
  }
}
</style>
