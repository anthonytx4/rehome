import React from 'react';

const PrivacyPage = () => {
  return (
    <div id="privacy" style={{ padding: '64px 24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>Privacy Policy</h1>
      <p>Last updated: April 3, 2026</p>

      <section style={{ marginTop: '24px', padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <h2 style={{ marginTop: 0 }}>Launch Status Notice</h2>
        <p>
          Rehome supports marketplace messaging, account creation, listing management, and seller dashboards today.
          Paid checkout, billing portal access, and any Stripe-dependent purchase flow only become available after Stripe is connected in production.
        </p>
      </section>

      <section id="terms" style={{ marginTop: '32px' }}>
        <h2>1. Terms of Marketplace Use</h2>
        <p>By using Rehome, you agree to provide accurate listing details, communicate honestly, and avoid misleading claims about ownership, health records, breeding status, shipping, or payment readiness.</p>
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
        <p>Listing boosts, memberships, and checkout tools are only available when Rehome has an active payment provider such as Stripe configured. Until then, those flows stay disabled and should not be represented as live escrow or billing services.</p>
      </section>

      <section id="trust-safety" style={{ marginTop: '32px' }}>
        <h2>6. Trust and Safety</h2>
        <p>We review listings, account activity, and messaging signals to reduce fraud, enforce marketplace standards, and protect buyers, breeders, shelters, and sellers. Buyers should still independently confirm identity, records, and handoff terms before paying.</p>
      </section>

      <section id="rights" style={{ marginTop: '32px' }}>
        <h2>7. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time via your dashboard.</p>
      </section>

      <section style={{ marginTop: '32px' }}>
        <h2>8. Contact</h2>
        <p>For billing, privacy, or trust-and-safety questions, publish a monitored support email before launch so buyers and sellers have a clear escalation path.</p>
      </section>
    </div>
  );
};

export default PrivacyPage;
