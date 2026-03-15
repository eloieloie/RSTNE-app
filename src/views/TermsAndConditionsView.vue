<template>
  <div class="policy-page">
    <div class="policy-container">
      <div class="policy-header">
        <router-link to="/" class="back-link">← Back</router-link>
        <h1>Terms &amp; Conditions</h1>
        <p class="effective-date">Effective Date: March 15, 2026</p>
      </div>

      <div class="policy-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Restoration Scriptures True Name Edition (RSTNE) web application,
            you agree to be bound by these Terms and Conditions. If you do not agree, please do not
            use the app.
          </p>
        </section>

        <section>
          <h2>2. About the Content</h2>
          <p>
            RSTNE provides scripture text from the Restoration Scriptures True Name Edition, including
            First Covenant, New Covenant, and Restored Apocryphal books, along with study notes,
            cross-references, and other related materials.
          </p>
        </section>

        <section>
          <h2>3. Permitted Use — Personal &amp; Non-Commercial</h2>
          <p>
            You are free to read, copy, share, and distribute the scripture content found in this
            app for <strong>personal, educational, ministry, and non-commercial purposes</strong>.
            This includes:
          </p>
          <ul>
            <li>Printing passages for personal study or group Bible study.</li>
            <li>Sharing verses or chapters in sermons, teachings, or ministry materials.</li>
            <li>Quoting scripture in non-commercial books, articles, or social media posts.</li>
            <li>Using content in free educational or faith-based materials.</li>
          </ul>
          <p>
            When reproducing significant portions of the text, a credit such as
            <em>"Restoration Scriptures True Name Edition (RSTNE)"</em> is appreciated but not
            strictly required for personal or ministry use.
          </p>
        </section>

        <section>
          <h2>4. Prohibited Use — Commercial</h2>
          <p>
            <strong>Commercial use of the content is not permitted</strong> without explicit written
            permission from the copyright holder. This includes but is not limited to:
          </p>
          <ul>
            <li>Selling physical or digital copies of the scripture text.</li>
            <li>Incorporating the text into paid products, apps, or subscription services.</li>
            <li>Licensing or sub-licensing the content to third parties for profit.</li>
            <li>Using the content in advertisements or commercial marketing materials.</li>
          </ul>
          <p>
            If you would like to use RSTNE content commercially, please contact us to request
            permission before doing so.
          </p>
        </section>

        <section>
          <h2>5. Prohibited Conduct</h2>
          <p>When using this app, you agree not to:</p>
          <ul>
            <li>Attempt to scrape, crawl, or systematically download the entire database.</li>
            <li>Reverse-engineer, decompile, or tamper with the app's source code or database.</li>
            <li>Use the app in any way that violates applicable laws or regulations.</li>
            <li>Misrepresent the content or attribute it to a source other than RSTNE.</li>
          </ul>
        </section>

        <section>
          <h2>6. User Notes</h2>
          <p>
            Notes you create within the app belong to you. By saving notes, you grant us a limited
            license to store and return them to you. We do not claim ownership over your notes.
          </p>
        </section>

        <section>
          <h2>7. Disclaimer of Warranties</h2>
          <p>
            RSTNE is provided "as is" without warranties of any kind. We make no guarantee of
            uninterrupted availability, accuracy of content, or fitness for a particular purpose.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, RSTNE and its operators shall not be liable
            for any indirect, incidental, or consequential damages arising from your use of the app.
          </p>
        </section>

        <section>
          <h2>9. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the app after changes
            are posted constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            For questions about these Terms, or to request commercial use permission, please
            reach out through the app's official website or repository.
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
