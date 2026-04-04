import React from 'react';
import { Link } from 'react-router-dom';

const SITE_NAME = 'Rehome';

const Footer = () => (
  <footer
    style={{
      marginTop: '48px',
      padding: '56px 0 28px',
      borderTop: '1px solid var(--color-border)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.98))',
    }}
  >
    <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--color-secondary)', fontWeight: 900, fontSize: '1.05rem' }}>
          <span style={{ color: 'var(--color-primary)' }}>{SITE_NAME}</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, maxWidth: '560px' }}>
          Marketplace messaging, seller profiles, moderation tools, and discovery flows for pets, livestock, and supplies.
        </p>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: '12px' }}>
          Live checkout, membership, and boost flows only appear when payment configuration is connected in production and should stay off until support and compliance paths are ready.
        </p>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>Marketplace</h3>
        <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'inherit' }}>Pets</Link>
          <Link to="/livestock" style={{ color: 'inherit' }}>Livestock</Link>
          <Link to="/supplies" style={{ color: 'inherit' }}>Supplies</Link>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>Account</h3>
        <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Link to="/login" style={{ color: 'inherit' }}>Sign In</Link>
          <Link to="/register" style={{ color: 'inherit' }}>Create Account</Link>
          <Link to="/dashboard" style={{ color: 'inherit' }}>Dashboard</Link>
          <Link to="/messages" style={{ color: 'inherit' }}>Messages</Link>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>Trust</h3>
        <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Link to="/help" style={{ color: 'inherit' }}>Help Center</Link>
          <Link to="/privacy#terms" style={{ color: 'inherit' }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
          <Link to="/privacy#payments" style={{ color: 'inherit' }}>Payments</Link>
          <Link to="/privacy#trust-safety" style={{ color: 'inherit' }}>Trust & Safety</Link>
        </div>
      </div>
    </div>

    <div className="container" style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
      <span>© 2026 Rehome Marketplace.</span>
      <span>Always verify identity, records, and handoff terms before paying or arranging transport.</span>
    </div>
  </footer>
);

export default Footer;
