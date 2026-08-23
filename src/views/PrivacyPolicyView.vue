<template>
  <div class="policy-page">
    <div class="policy-container">
      <div class="policy-header">
        <router-link to="/" class="back-link">← Back</router-link>
        <h1>Privacy Policy</h1>
        <p class="effective-date">Effective Date: August 23, 2026</p>
      </div>

      <div class="policy-content">
        <section>
          <h2>1. Overview</h2>
          <p>
            Restoration Scriptures True Name Edition (RSTNE) is a free Bible reading and study platform.
            We are committed to protecting your privacy and being transparent about the minimal data
            we collect.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We collect very little personal information. Specifically:</p>
          <ul>
            <li><strong>No account required</strong> — most features work without signing in.</li>
            <li><strong>No tracking</strong> — we do not use analytics, cookies, or tracking pixels.</li>
            <li><strong>Session storage</strong> — book data is cached locally in your browser's
              session storage to improve performance. This data is cleared when you close your browser.</li>
            <li><strong>Account (optional)</strong> — if you choose to sign in with email/password or
              Google, we collect your email address, name (if provided by Google), and a unique
              account ID so we can identify you across sessions and devices.</li>
            <li><strong>Notes</strong> — if you create notes while signed in, they are linked to your
              account's user ID so they can sync across your devices. If you use the app without
              signing in, notes you create are not linked to any personal identity.</li>
            <li><strong>Feedback</strong> — if you submit feedback through the app, we store your
              message and, if you choose to provide one, your email address so we can follow up.</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Information</h2>
          <p>Any data processed by the app is used solely to:</p>
          <ul>
            <li>Deliver scripture content to your device.</li>
            <li>Save and retrieve study notes you create, and sync them to your account if you're signed in.</li>
            <li>Authenticate you and maintain your signed-in session, if you choose to create an account.</li>
            <li>Respond to feedback you submit.</li>
            <li>Improve app performance and reliability.</li>
          </ul>
          <p>We do not sell, rent, or share your data with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2>4. Third-Party Services</h2>
          <p>
            The app is hosted on Firebase (Google). Firebase may collect standard server logs
            (IP addresses, request timestamps) as part of normal hosting operations. If you choose
            to sign in, authentication is handled by Firebase Authentication, and signing in with
            Google uses Google Sign-In. Please refer to Google's Privacy Policy for details on how
            Firebase and Google handle this data.
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            Notes you create are retained until you delete them. If you created an account, your
            account information (email, name, and account ID) is retained until you delete your
            account or request removal. Feedback submissions are retained to help us track and
            resolve reported issues. We do not keep historical logs of your reading activity.
          </p>
        </section>

        <section>
          <h2>6. Children's Privacy</h2>
          <p>
            This app is suitable for all ages and does not knowingly collect personal information
            from children under 13.
          </p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Changes will be reflected by an updated
            effective date at the top of this page.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, please reach out through the app's
            official website or repository.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #0f0f0f;
  color: #e5e5e5;
  padding: 2rem 1rem;
}

.policy-container {
  max-width: 780px;
  margin: 0 auto;
  text-align: left;
}

.policy-header {
  margin-bottom: 2.5rem;
}

.back-link {
  color: #8B4513;
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-block;
  margin-bottom: 1rem;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.25rem;
}

.effective-date {
  color: #888;
  font-size: 0.9rem;
  margin: 0;
}

.policy-content section {
  margin-bottom: 2rem;
  border-bottom: 1px solid #222;
  padding-bottom: 2rem;
}

.policy-content section:last-child {
  border-bottom: none;
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #d4a96a;
  margin: 0 0 0.75rem;
}

p {
  line-height: 1.7;
  margin: 0 0 0.75rem;
  color: #ccc;
}

ul {
  padding-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

ul li {
  margin-bottom: 0.4rem;
}
</style>
