import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
    <div style={{ maxWidth: '640px', width: '100%', padding: '48px 32px', borderRadius: '28px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '12px' }}>404</p>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>That page wandered off.</h1>
      <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
        The link may be outdated or the page may have moved. Head back to the marketplace or check the privacy page if you were looking for policy details.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">Back to Marketplace</Link>
        <Link to="/privacy" className="btn btn-secondary">Privacy Policy</Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
