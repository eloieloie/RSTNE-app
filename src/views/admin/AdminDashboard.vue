<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>📚 Admin Dashboard</h1>
      <router-link to="/" class="home-link">← Back to Home</router-link>
    </header>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-icon">📖</div>
        <h2>Manage Books</h2>
        <p>Create, edit, and delete books in the library</p>
        <router-link to="/admin/books" class="action-btn">
          Manage Books
        </router-link>
      </div>

      <div class="dashboard-card">
        <div class="card-icon">📝</div>
        <h2>Manage Chapters</h2>
        <p>Create, edit, and delete chapters for all books</p>
        <router-link to="/admin/chapters" class="action-btn">
          Manage Chapters
        </router-link>
      </div>

      <div class="dashboard-card">
        <div class="card-icon">📊</div>
        <h2>Statistics</h2>
        <p>View library statistics and analytics</p>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Total Books:</span>
            <span class="stat-value">{{ stats.totalBooks }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Chapters:</span>
            <span class="stat-value">{{ stats.totalChapters }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const stats = ref({
  totalBooks: 0,
  totalChapters: 0
});

onMounted(async () => {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      stats.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
});
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
  transition: transform 0.2s;
}

.dashboard-card:hover {
  transform: translateY(-8px);
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

.stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.stat-value {
  color: #667eea;
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
