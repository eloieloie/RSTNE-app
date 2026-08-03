<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>📚 Admin Dashboard</h1>
      <router-link to="/" class="home-link">← Back to Home</router-link>
    </header>

    <div class="dashboard-grid">
      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(0)" :while-hover="hoverLift">
        <div class="card-icon">📖</div>
        <h2>Manage Books</h2>
        <p>Create, edit, and delete books in the library</p>
        <router-link to="/admin/books" class="action-btn">
          Manage Books
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(1)" :while-hover="hoverLift">
        <div class="card-icon">📝</div>
        <h2>Manage Chapters</h2>
        <p>Create, edit, and delete chapters for all books</p>
        <router-link to="/admin/chapters" class="action-btn">
          Manage Chapters
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(2)" :while-hover="hoverLift">
        <div class="card-icon">🔍</div>
        <h2>Find & Replace</h2>
        <p>Search and replace words in verses across all books</p>
        <router-link to="/admin/find-replace" class="action-btn">
          Find & Replace
        </router-link>
      </motion.div>
      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(3)" :while-hover="hoverLift">
        <div class="card-icon">📑</div>
        <h2>Compare with RSTNE</h2>
        <p>Side-by-side comparison of database verses vs the live RSTNE page with diff highlighting</p>
        <router-link to="/admin/compare-book" class="action-btn">
          Compare Book
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(4)" :while-hover="hoverLift">
        <div class="card-icon">🔔</div>
        <h2>Push Notifications</h2>
        <p>Send push notifications to all registered devices or specific devices with optional deep links</p>
        <router-link to="/admin/push-notifications" class="action-btn">
          Send Notification
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(5)" :while-hover="hoverLift">
        <div class="card-icon">📜</div>
        <h2>Timeline Events</h2>
        <p>Manage the 6,000-year Biblical history timeline — add, edit, or delete events with AM year, BC/AD year, Jubilee, and Shemittah markers</p>
        <router-link to="/admin/timeline-events" class="action-btn">
          Manage Timeline
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(6)" :while-hover="hoverLift">
        <div class="card-icon">📝</div>
        <h2>Modification Required</h2>
        <p>Review verses that have no Telugu text — flagged as citation required and awaiting translation</p>
        <router-link to="/admin/modification-required" class="action-btn">
          View Verses
        </router-link>
      </motion.div>

      <motion.div class="dashboard-card" :initial="cardInitial" :animate="{ opacity: 1, y: 0 }" :transition="staggerTransition(7)" :while-hover="hoverLift">
        <div class="card-icon">💬</div>
        <h2>User Feedback</h2>
        <p>View, filter, and manage feedback submitted from the mobile app — bug reports, feature requests, and general comments</p>
        <router-link to="/admin/feedback" class="action-btn">
          View Feedback
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
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.admin-header {
  max-width: 1200px;
  margin: 0 auto 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.admin-header h1 {
  font-size: 2.5rem;
  margin: 0;
}

.home-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: background 0.2s;
}

.home-link:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dashboard-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.dashboard-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.dashboard-card h2 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.dashboard-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.action-btn {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #5568d3;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .admin-header h1 {
    font-size: 1.75rem;
  }

  .home-link {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .dashboard-card {
    padding: 1.5rem;
  }

  .card-icon {
    font-size: 2.5rem;
  }

  .dashboard-card h2 {
    font-size: 1.25rem;
  }

  .dashboard-card p {
    font-size: 0.9rem;
  }

  .action-btn {
    width: 100%;
    text-align: center;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 480px) {
  .admin-dashboard {
    padding: 0.75rem;
  }

  .admin-header h1 {
    font-size: 1.5rem;
  }

  .dashboard-card {
    padding: 1.25rem;
  }

  .card-icon {
    font-size: 2rem;
  }

  .dashboard-card h2 {
    font-size: 1.1rem;
  }

  .dashboard-card p {
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .action-btn {
    font-size: 0.9rem;
    padding: 0.65rem 1rem;
  }
}
</style>
