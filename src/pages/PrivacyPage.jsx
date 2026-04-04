import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div id="privacy" style={{ padding: '64px 24px', maxWidth: '840px', margin: '0 auto', lineHeight: '1.7' }}>
      <h1 style={{ fontSize: '2.6rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>Privacy Policy</h1>
      <p>Last updated: April 4, 2026</p>

      <section style={{ marginTop: '24px', padding: '24px', borderRadius: '22px', border: '1px solid var(--color-border)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ marginTop: 0 }}>Marketplace Terms</h2>
        <p>
          This policy covers account creation, listings, favorites, messaging, marketplace browsing, and all secure payment flows enabled on the Rehome platform.
          Our focus is on providing a safe, transparent, and reliable environment for rehoming pets, livestock, and supplies.
        </p>
        <p style={{ marginBottom: 0 }}>Visit our <Link to="/help">Help Center</Link> for safe rehoming guidance, listing standards, and marketplace FAQ.</p>
      </section>

      <section id="terms" style={{ marginTop: '32px' }}>
        <h2>1. Marketplace Use</h2>
        <p>By using Rehome, you agree to provide accurate listing details, communicate honestly, and avoid misleading claims about ownership, health records, breeding status, or product condition.</p>
      </section>

      <section id="collection" style={{ marginTop: '32px' }}>
        <h2>2. Information We Collect</h2>
        <p>We collect only the information needed to run the marketplace and keep accounts secure. This includes:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email, and location provided during registration.</li>
          <li><strong>Listing Information:</strong> Details, photos, and descriptions of pets or goods you list.</li>
          <li><strong>Communication:</strong> Messages sent through our secure on-platform messaging system.</li>
          <li><strong>Usage Information:</strong> Basic analytics and device data used to maintain site performance and security.</li>
          <li><strong>Payment Information:</strong> All financial transactions are handled securely via Stripe; Rehome does not store full credit card details.</li>
        </ul>
      </section>

      <section id="use" style={{ marginTop: '32px' }}>
        <h2>3. How We Use Information</h2>
        <p>We use information to operate the marketplace, authenticate accounts, display listings, route messages, process secure payments, and improve the safety and quality of the Rehome experience.</p>
      </section>

      <section id="sharing" style={{ marginTop: '32px' }}>
        <h2>4. Data Sharing</h2>
        <p>Your contact details are only shared with other users when necessary for a communication or transaction you initiate. We may share limited data with trusted service providers who help us host the site or process secure payments.</p>
      </section>

      <section id="payments" style={{ marginTop: '32px' }}>
        <h2>5. Payments and Billing</h2>
        <p>Listing boosts, memberships, and checkout tools use Stripe for secure processing. We prioritize transparency in all transaction fees and marketplace escrow services.</p>
      </section>

      <section id="trust-safety" style={{ marginTop: '32px' }}>
        <h2>6. Trust and Safety</h2>
        <p>Rehome is a community marketplace. Buyers and sellers should independently confirm identity, ownership, and health records before completing any high-value transaction.</p>
      </section>

      <section id="cookies" style={{ marginTop: '32px' }}>
        <h2>7. Cookies and Analytics</h2>
        <p>We use cookies and basic analytics to understand site traffic and improve our services. You can manage your cookie preferences through your browser settings.</p>
      </section>

      <section id="rights" style={{ marginTop: '32px' }}>
        <h2>8. Your Rights</h2>
        <p>You can review and update your account information directly through your dashboard. For data deletion requests, billing inquiries, or trust-and-safety concerns, please reach out to our support team.</p>
      </section>

      <section style={{ marginTop: '32px' }}>
        <h2>9. Contact Support</h2>
        <p>For help with your account, privacy questions, or security concerns, please use the contact options provided in our Help Center or reach out via the support tools in your dashboard.</p>
      </section>
    </div>
  );
};

export default PrivacyPage;
