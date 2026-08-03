<template>
  <div class="auth-page">
    <div class="auth-container">
      <router-link to="/" class="back-link">← Back</router-link>

      <h1>Create Account</h1>
      <p class="auth-subtitle">Optional — create an account to keep personal notes on your verses.</p>

      <form class="auth-form" @submit.prevent="handleSubmit" novalidate>
        <div class="form-field">
          <label for="register-email">Email</label>
          <input
            id="register-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="submitting"
          />
        </div>

        <div class="form-field">
          <label for="register-password">Password</label>
          <div class="password-input">
            <input
              id="register-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              minlength="6"
              :disabled="submitting"
            />
            <button
              type="button"
              class="password-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >{{ showPassword ? 'Hide' : 'Show' }}</button>
          </div>
          <p class="field-hint">At least 6 characters.</p>
        </div>

        <div class="form-field">
          <label for="register-confirm">Confirm Password</label>
          <input
            id="register-confirm"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
            :disabled="submitting"
          />
        </div>

        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-divider"><span>or</span></div>

      <button type="button" class="google-btn" :disabled="submitting" @click="handleGoogle">
        <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      <p class="auth-switch">
        Already have an account? <router-link to="/login">Sign In</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { registerEmail, signInGoogle } = useAuth();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const submitting = ref(false);
const errorMessage = ref('');

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (code.includes('weak-password')) {
    return 'Password is too weak — use at least 6 characters.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('popup-closed-by-user')) {
    return '';
  }
  return 'Something went wrong. Please try again.';
}

function redirectAfterSignIn() {
  const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  router.push(redirectTo);
}

async function handleSubmit() {
  errorMessage.value = '';
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }
  submitting.value = true;
  try {
    await registerEmail(email.value, password.value);
    redirectAfterSignIn();
  } catch (err) {
    errorMessage.value = friendlyError(err);
  } finally {
    submitting.value = false;
  }
}

async function handleGoogle() {
  errorMessage.value = '';
  submitting.value = true;
  try {
    await signInGoogle();
    redirectAfterSignIn();
  } catch (err) {
    const message = friendlyError(err);
    if (message) errorMessage.value = message;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1.25rem;
  background: #f7f5f2;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.25rem;
  color: #8B4513;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}
.back-link:hover {
  text-decoration: underline;
}

h1 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.35rem;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 0.92rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-field label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #374151;
}

.field-hint {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.form-field input {
  min-height: 44px;
  padding: 0.6rem 0.85rem;
  border: 1.5px solid #d8d2c9;
  border-radius: 10px;
  font-size: 1rem;
  color: #2c3e50;
  transition: border-color 0.15s ease;
}
.form-field input:focus {
  outline: none;
  border-color: #8B4513;
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.15);
}
.form-field input:disabled {
  opacity: 0.6;
}

.password-input {
  position: relative;
  display: flex;
}
.password-input input {
  flex: 1;
  padding-right: 4.2rem;
}
.password-toggle {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  min-height: 36px;
  padding: 0 0.6rem;
  background: none;
  border: none;
  color: #8B4513;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.password-toggle:focus-visible {
  outline: 2px solid #8B4513;
  outline-offset: 2px;
  border-radius: 6px;
}

.form-error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.88rem;
  margin: 0;
}

.submit-btn {
  min-height: 46px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #8B4513, #c0763a);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(139, 69, 19, 0.4);
}
.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #9ca3af;
  font-size: 0.82rem;
  margin: 1.25rem 0;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e0d8;
}
.auth-divider span {
  padding: 0 0.75rem;
}

.google-btn {
  width: 100%;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border: 1.5px solid #d8d2c9;
  border-radius: 50px;
  background: #fff;
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.google-btn:hover:not(:disabled) {
  background: #f9f7f4;
  border-color: #c9c1b3;
}
.google-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin: 1.5rem 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}
.auth-switch a {
  color: #8B4513;
  font-weight: 600;
  text-decoration: none;
}
.auth-switch a:hover {
  text-decoration: underline;
}
</style>
