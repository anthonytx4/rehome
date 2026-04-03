import React from 'react';

const PrivacyPage = () => {
  return (
    <div id="privacy" style={{ padding: '64px 24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>Privacy Policy</h1>
      <p>Last updated: April 3, 2026</p>

      <section id="terms" style={{ marginTop: '32px' }}>
        <h2>1. Terms of Marketplace Use</h2>
        <p>By using Rehome, you agree to provide accurate listing details, communicate honestly, and complete required marketplace transactions through approved on-platform flows.</p>
      </section>

      <section id="collection" style={{ marginTop: '32px' }}>
        <h2>2. Information We Collect</h2>
        <p>At Rehome, we collect information to provide a better experience for our users. This includes:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email, and location when you register.</li>
          <li><strong>Listing Information:</strong> Details about pets, livestock, or supplies you list.</li>
          <li><strong>Communication:</strong> Messages sent through our platform.</li>
          <li><strong>Payment Information:</strong> Processed securely via Stripe (we do not store card details).</li>
        </ul>
      </section>

      <section id="use" style={{ marginTop: '32px' }}>
        <h2>3. How We Use Information</h2>
        <p>We use your information to operate the marketplace, verify breeders, process payments, and improve our services.</p>
      </section>

      <section id="sharing" style={{ marginTop: '32px' }}>
        <h2>4. Data Sharing</h2>
        <p>Your contact details may be shared with other users only when necessary for a transaction or communication you initiate.</p>
      </section>

      <section id="payments" style={{ marginTop: '32px' }}>
        <h2>5. Payments and Billing</h2>
        <p>Listing boosts, memberships, escrow payments, and other monetized tools are processed through configured payment providers such as Stripe-hosted checkout.</p>
      </section>

      <section id="trust-safety" style={{ marginTop: '32px' }}>
        <h2>6. Trust and Safety</h2>
        <p>We review listings, account activity, and payment signals to reduce fraud, enforce marketplace standards, and protect buyers, breeders, shelters, and sellers.</p>
      </section>

      <section id="rights" style={{ marginTop: '32px' }}>
        <h2>7. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time via your dashboard.</p>
      </section>
    </div>
  );
};

export default PrivacyPage;
