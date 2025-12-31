import { createRouter, createWebHistory } from 'vue-router';
import BooksView from '@/views/BooksView.vue';
import ChaptersView from '@/views/ChaptersView.vue';
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import ManageBooks from '@/views/admin/ManageBooks.vue';
import ManageChapters from '@/views/admin/ManageChapters.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'books',
      component: BooksView
    },
    {
      path: '/chapters/:id',
      name: 'chapters',
      component: ChaptersView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard
    },
    {
      path: '/admin/books',
      name: 'admin-books',
      component: ManageBooks
    },
    {
      path: '/admin/chapters',
      name: 'admin-chapters',
      component: ManageChapters
    }
  ]
});

export default router;
