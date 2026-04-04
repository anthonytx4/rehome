import React from 'react';

const Loading = ({ message = 'Loading' }) => (
  <div style={{ minHeight: '55vh', display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
    <div style={{ textAlign: 'center', padding: '32px 28px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', minWidth: '280px' }}>
      <div style={{ width: '52px', height: '52px', margin: '0 auto 16px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', opacity: 0.9 }} />
      <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{message}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Just a moment while we prepare your session.</p>
    </div>
  </div>
);

export default Loading;
