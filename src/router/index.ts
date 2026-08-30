import { createRouter, createWebHistory } from 'vue-router';
import { watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import BooksView from '@/views/BooksView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ChaptersView from '@/views/ChaptersView.vue';
import BroadcastView from '@/views/BroadcastView.vue';
import WeeklyReadingView from '@/views/WeeklyReadingView.vue';
import TimelineView from '@/views/TimelineView.vue';
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import ManageBooks from '@/views/admin/ManageBooks.vue';
import ManageChapters from '@/views/admin/ManageChapters.vue';
import ChapterEditor from '@/views/admin/ChapterEditor.vue';
import FindReplace from '@/views/admin/FindReplace.vue';
import CompareBook from '@/views/admin/CompareBook.vue';
import PushNotificationsAdmin from '@/views/admin/PushNotificationsAdmin.vue';
import ManageTimelineEvents from '@/views/admin/ManageTimelineEvents.vue';
import FeedbackAdmin from '@/views/admin/FeedbackAdmin.vue';
import ModificationRequired from '@/views/admin/ModificationRequired.vue';
import AudioGenerator from '@/views/admin/AudioGenerator.vue';
import FeastsView from '@/views/FeastsView.vue';
import PrivacyPolicyView from '@/views/PrivacyPolicyView.vue';
import TermsAndConditionsView from '@/views/TermsAndConditionsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'books',
      component: BooksView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/books',
      name: 'admin-books',
      component: ManageBooks,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/chapters',
      name: 'admin-chapters',
      component: ManageChapters,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/chapters/:id',
      name: 'chapter-editor',
      component: ChapterEditor,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/find-replace',
      name: 'find-replace',
      component: FindReplace,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/compare-book',
      name: 'compare-book',
      component: CompareBook,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/push-notifications',
      name: 'push-notifications',
      component: PushNotificationsAdmin,
      meta: { requiresAdmin: true }
    },
    {
      path: '/weekly-reading',
      name: 'weekly-reading',
      component: WeeklyReadingView
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: TimelineView
    },
    {
      path: '/feasts',
      name: 'feasts',
      component: FeastsView
    },
    {
      path: '/admin/timeline-events',
      name: 'admin-timeline-events',
      component: ManageTimelineEvents,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/feedback',
      name: 'admin-feedback',
      component: FeedbackAdmin,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/modification-required',
      name: 'admin-modification-required',
      component: ModificationRequired,
      meta: { requiresAdmin: true }
    },
    {
      path: '/admin/audio-generator',
      name: 'admin-audio-generator',
      component: AudioGenerator,
      meta: { requiresAdmin: true }
    },
    {
      path: '/reading-pane',
      name: 'reading-pane',
      component: ChaptersView
    },
    {
      path: '/broadcast',
      name: 'broadcast',
      component: BroadcastView
    },
    {
      path: '/broadcast/:bookName/:chapterNumber?/:verseNumber?',
      name: 'broadcast-params',
      component: BroadcastView
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: PrivacyPolicyView
    },
    {
      path: '/terms-and-conditions',
      name: 'terms-and-conditions',
      component: TermsAndConditionsView
    },
    // Legacy routes - still work but reading-pane is the preferred URL
    {
      path: '/chapters/:id',
      name: 'chapters',
      component: ChaptersView
    },
    {
      path: '/:bookName/:chapterNumber?/:verseNumber?',
      name: 'book-chapter-verse',
      component: ChaptersView
    }
  ]
});

// Waits for the initial Firebase auth-state check to complete, so a page reload
// on an admin route doesn't redirect before we know the user is actually signed in.
function waitForAuthReady(): Promise<void> {
  const { authReady } = useAuth();
  if (authReady.value) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = watch(authReady, (ready) => {
      if (ready) {
        stop();
        resolve();
      }
    });
  });
}

router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin) return true;
  await waitForAuthReady();
  const { isAdmin } = useAuth();
  if (!isAdmin.value) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
