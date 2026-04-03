import React from 'react';

const checklistStyle = {
  marginTop: '28px',
  padding: '20px',
  borderRadius: '20px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
};

const listStyle = {
  marginTop: '12px',
  paddingLeft: '18px',
  color: 'var(--color-text-muted)',
  lineHeight: 1.7,
};

const ContextualRecommendations = ({ petName = 'your listing' }) => {
  return (
    <div style={checklistStyle}>
      <h3 style={{ marginBottom: '8px' }}>Before You Commit to {petName}</h3>
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
        Ask for the feeding routine, transport details, medical records, and the safest pickup or delivery plan before you send payment.
      </p>
      <ul style={listStyle}>
        <li>Confirm vaccinations, breeder paperwork, or health disclosures.</li>
        <li>Clarify pickup timing, transport crates, and handoff location.</li>
        <li>Keep high-value payments and boosts inside the Rehome checkout flow.</li>
      </ul>
    </div>
  );
};

export default ContextualRecommendations;
