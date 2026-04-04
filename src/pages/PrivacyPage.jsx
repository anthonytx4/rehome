import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div id="privacy" style={{ padding: '64px 24px', maxWidth: '840px', margin: '0 auto', lineHeight: '1.7' }}>
      <h1 style={{ fontSize: '2.6rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>Privacy Policy</h1>
      <p>Last updated: April 4, 2026</p>

      <section style={{ marginTop: '24px', padding: '24px', borderRadius: '22px', border: '1px solid var(--color-border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ marginTop: 0 }}>Launch Status Notice</h2>
        <p>
          This policy covers account creation, listings, favorites, messaging, marketplace browsing, and any payment flow that is explicitly enabled in production.
          Paid checkout, memberships, boosts, and billing portal access should only be treated as live when the configured payment provider is connected and working.
        </p>
        <p style={{ marginBottom: 0 }}>Use the <Link to="/help">Help Center</Link> for safe rehoming guidance, listing standards, and marketplace FAQ.</p>
      </section>

      <section id="terms" style={{ marginTop: '32px' }}>
        <h2>1. Marketplace Use</h2>
        <p>By using Rehome, you agree to provide accurate listing details, communicate honestly, and avoid misleading claims about ownership, health records, breeding status, shipping, payment readiness, or product condition.</p>
      </section>

      <section id="collection" style={{ marginTop: '32px' }}>
        <h2>2. Information We Collect</h2>
        <p>We collect only the information needed to run the marketplace and keep accounts secure. This may include:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email, and location when you register.</li>
          <li><strong>Listing Information:</strong> Details about pets, livestock, or supplies you list.</li>
          <li><strong>Communication:</strong> Messages sent through our platform.</li>
          <li><strong>Usage Information:</strong> Basic analytics, device, and browser data used to measure performance and improve the site.</li>
          <li><strong>Payment Information:</strong> Payment details are handled by the configured payment provider; Rehome should not store full card details.</li>
        </ul>
      </section>

      <section id="use" style={{ marginTop: '32px' }}>
        <h2>3. How We Use Information</h2>
        <p>We use information to operate the marketplace, authenticate accounts, display listings, route messages, process enabled payment flows, and improve product quality and safety.</p>
      </section>

      <section id="sharing" style={{ marginTop: '32px' }}>
        <h2>4. Data Sharing</h2>
        <p>Your contact details may be shared with other users only when necessary for a transaction or communication you initiate. We may also share limited data with service providers that help us host the site, deliver analytics, or process payments when those services are enabled.</p>
      </section>

      <section id="payments" style={{ marginTop: '32px' }}>
        <h2>5. Payments and Billing</h2>
        <p>Listing boosts, memberships, and checkout tools are only available when Rehome has an active payment provider configured. Rehome should not represent escrow, billing, or payment protection as live unless the relevant checkout flow is actually enabled and visible in the product.</p>
      </section>

      <section id="trust-safety" style={{ marginTop: '32px' }}>
        <h2>6. Trust and Safety</h2>
        <p>Rehome is a marketplace, not a guarantee. Buyers and sellers should independently confirm identity, records, ownership, handoff terms, and payment expectations before completing any transaction.</p>
      </section>

      <section id="cookies" style={{ marginTop: '32px' }}>
        <h2>7. Cookies and Analytics</h2>
        <p>Rehome may use cookies, analytics, and ad measurement tools to understand site traffic and improve the experience. You can control cookies through your browser settings and any consent prompt the site shows.</p>
      </section>

      <section id="rights" style={{ marginTop: '32px' }}>
        <h2>8. Your Rights</h2>
        <p>You can review and update your account information through your dashboard. If you need data deletion, billing help, or a formal complaint path, publish a monitored support contact before accepting live payments.</p>
      </section>

      <section style={{ marginTop: '32px' }}>
        <h2>9. Contact</h2>
        <p>Rehome should publish a monitored support email or help form before launch so buyers and sellers have a clear escalation path for privacy, billing, and trust-and-safety concerns. Until that exists, avoid representing live support coverage beyond the documentation available in the Help Center and policy pages.</p>
      </section>
    </div>
  );
};

export default PrivacyPage;
