<template>
  <div class="admin-dashboard admin-page">
    <header class="admin-page-header">
      <h1 class="admin-title">📚 Admin Dashboard</h1>
      <router-link to="/" class="admin-back-link">← Back to Home</router-link>
    </header>

    <div class="dashboard-grid admin-card-grid">
      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(0)" :while-hover="hoverLift">
        <div class="card-icon">📖</div>
        <h2>Manage Books</h2>
        <p>Create, edit, and delete books in the library</p>
        <router-link to="/admin/books" class="action-btn admin-btn admin-btn--primary">
          Manage Books
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(1)" :while-hover="hoverLift">
        <div class="card-icon">📝</div>
        <h2>Manage Chapters</h2>
        <p>Create, edit, and delete chapters for all books</p>
        <router-link to="/admin/chapters" class="action-btn admin-btn admin-btn--primary">
          Manage Chapters
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(2)" :while-hover="hoverLift">
        <div class="card-icon">🔍</div>
        <h2>Find & Replace</h2>
        <p>Search and replace words in verses across all books</p>
        <router-link to="/admin/find-replace" class="action-btn admin-btn admin-btn--primary">
          Find & Replace
        </router-link>
      </motion.div>
      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(3)" :while-hover="hoverLift">
        <div class="card-icon">📑</div>
        <h2>Compare with RSTNE</h2>
        <p>Side-by-side comparison of database verses vs the live RSTNE page with diff highlighting</p>
        <div class="card-actions">
          <router-link to="/admin/compare-book" class="action-btn admin-btn admin-btn--primary">
            Compare Book
          </router-link>
          <router-link to="/admin/rstne-js-rules" class="action-btn admin-btn admin-btn--secondary">
            View JS Word Rules
          </router-link>
        </div>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(4)" :while-hover="hoverLift">
        <div class="card-icon">🔔</div>
        <h2>Push Notifications</h2>
        <p>Send push notifications to all registered devices or specific devices with optional deep links</p>
        <router-link to="/admin/push-notifications" class="action-btn admin-btn admin-btn--primary">
          Send Notification
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(5)" :while-hover="hoverLift">
        <div class="card-icon">📜</div>
        <h2>Timeline Events</h2>
        <p>Manage the 6,000-year Biblical history timeline — add, edit, or delete events with AM year, BC/AD year, Jubilee, and Shemittah markers</p>
        <router-link to="/admin/timeline-events" class="action-btn admin-btn admin-btn--primary">
          Manage Timeline
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(6)" :while-hover="hoverLift">
        <div class="card-icon">📝</div>
        <h2>Modification Required</h2>
        <p>Review verses that have no Telugu text — flagged as citation required and awaiting translation</p>
        <router-link to="/admin/modification-required" class="action-btn admin-btn admin-btn--primary">
          View Verses
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(7)" :while-hover="hoverLift">
        <div class="card-icon">💬</div>
        <h2>User Feedback</h2>
        <p>View, filter, and manage feedback submitted from the mobile app — bug reports, feature requests, and general comments</p>
        <router-link to="/admin/feedback" class="action-btn admin-btn admin-btn--primary">
          View Feedback
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(8)" :while-hover="hoverLift">
        <div class="card-icon">🔊</div>
        <h2>Verse Audio Generator</h2>
        <p>Generate and listen to text-to-speech audio per verse or chapter before shipping playback in the app</p>
        <div class="card-actions">
          <router-link to="/admin/audio-generator" class="action-btn admin-btn admin-btn--primary">
            Generate Audio
          </router-link>
          <router-link to="/admin/chapter-announcements" class="action-btn admin-btn admin-btn--secondary">
            Manage Announcements
          </router-link>
        </div>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(9)" :while-hover="hoverLift">
        <div class="card-icon">🎯</div>
        <h2>Punctuation Suggestions</h2>
        <p>Review Telugu punctuation fixes suggested by the local punctuation_corrector tool — so generated audio pauses where it should — and approve or reject each one</p>
        <router-link to="/admin/punctuation-suggestions" class="action-btn admin-btn admin-btn--primary">
          Review Suggestions
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(10)" :while-hover="hoverLift">
        <div class="card-icon">✍️</div>
        <h2>Punctuation Review</h2>
        <p>Find long verses with little or no punctuation (worst first), edit them in place, and mark the ones that are fine as reviewed — English or Telugu</p>
        <router-link to="/admin/punctuation-review" class="action-btn admin-btn admin-btn--primary">
          Review Verses
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(11)" :while-hover="hoverLift">
        <div class="card-icon">🩹</div>
        <h2>Range-Ref Audio Fix (TEMP)</h2>
        <p>Temporary QA page listing already-generated audio affected by the "#Gene9 11-17" range-ref bug — the "-17" tail used to be spoken/cut off incorrectly. Review and regenerate affected audio here</p>
        <div class="card-actions">
          <router-link to="/admin/temp-range-ref-verses-english" class="action-btn admin-btn admin-btn--primary">
            English Audio
          </router-link>
          <router-link to="/admin/temp-range-ref-verses-telugu" class="action-btn admin-btn admin-btn--secondary">
            Telugu Audio
          </router-link>
        </div>
      </motion.div>

      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(12)" :while-hover="hoverLift">
        <div class="card-icon">🔗</div>
        <h2>Same-Chapter Range-Ref Fixes (TEMP)</h2>
        <p>Verses where a "(→ v.N)" same-chapter reference is followed by a stray ",M" instead of a proper "N-M" range — review the proposed fix for each and apply individually</p>
        <router-link to="/admin/range-ref-fixes" class="action-btn admin-btn admin-btn--primary">
          Review Fixes
        </router-link>
      </motion.div>
      <motion.div class="dashboard-card admin-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(13)" :while-hover="hoverLift">
        <div class="card-icon">🔢</div>
        <h2>Strong's Codes</h2>
        <p>Find verses with bare Strong's numbers (H6086, G1557…) and wrap them in [square brackets] so audio generation skips them — English or Telugu</p>
        <router-link to="/admin/strongs-codes" class="action-btn admin-btn admin-btn--primary">
          Bracket Codes
        </router-link>
      </motion.div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';
import { useMotionPresets } from '@/composables/useMotionPresets';

const { prefersReducedMotion, hoverLift, staggerTransition } = useMotionPresets();
const cardInitial = prefersReducedMotion.value ? false : { opacity: 0, y: 12 };
</script>

<style scoped>
/* Layout, colors, fonts, cards, and buttons come from the shared .admin-page /
   .admin-card / .admin-btn classes (src/assets/admin-ui.css). Only this page's
   own grid sizing and icon/description tweaks live here. */

.dashboard-grid {
  max-width: 1200px;
  margin: 0 auto;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.card-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
}

.dashboard-card h2 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-lg);
}

.dashboard-card p {
  color: var(--color-muted-foreground);
  margin-bottom: var(--space-6);
  line-height: 1.5;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .card-icon {
    font-size: 2.5rem;
  }

  .dashboard-card h2 {
    font-size: var(--font-size-md);
  }

  .dashboard-card p {
    font-size: var(--font-size-sm);
  }
}

@media (max-width: 480px) {
  .card-icon {
    font-size: 2rem;
  }
}
</style>
