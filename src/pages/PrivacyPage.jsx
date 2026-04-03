import React from 'react';

const PrivacyPage = () => {
  return (
    <div id="privacy" style={{ padding: '64px 24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>Privacy Policy</h1>
      <p>Last updated: April 3, 2026</p>

      <section id="collection" style={{ marginTop: '32px' }}>
        <h2>1. Information We Collect</h2>
        <p>At Rehome, we collect information to provide a better experience for our users. This includes:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email, and location when you register.</li>
          <li><strong>Listing Information:</strong> Details about pets, livestock, or supplies you list.</li>
          <li><strong>Communication:</strong> Messages sent through our platform.</li>
          <li><strong>Payment Information:</strong> Processed securely via Stripe (we do not store card details).</li>
        </ul>
      </section>

      <section id="use" style={{ marginTop: '32px' }}>
        <h2>2. How We Use Information</h2>
        <p>We use your information to operate the marketplace, verify breeders, process payments, and improve our services.</p>
      </section>

      <section id="sharing" style={{ marginTop: '32px' }}>
        <h2>3. Data Sharing</h2>
        <p>Your contact details may be shared with other users only when necessary for a transaction or communication you initiate.</p>
      </section>

      <section id="rights" style={{ marginTop: '32px' }}>
        <h2>4. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time via your dashboard.</p>
      </section>
    </div>
  );
};

export default PrivacyPage;
