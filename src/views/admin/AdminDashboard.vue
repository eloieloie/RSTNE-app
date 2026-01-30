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
    </div>
  </div>
</template>

<script setup lang="ts">
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
