import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import styles from './HowItWorksModal.module.css';

const STEPS = [
  {
    title: 'Browse & Connect',
    desc: 'Browse available listings, compare seller details, and shortlist the ones that fit your needs.',
    icon: <Heart size={24} className={styles.stepIcon} />
  },
  {
    title: 'Message and Review',
    desc: 'Ask about records, pickup plans, pricing, and availability before you commit to the next step.',
    icon: <ShieldCheck size={24} className={styles.stepIcon} />
  },
  {
    title: 'Complete the Handoff',
    desc: 'Finalize pickup or delivery and keep high-value payments on-platform once billing is fully configured.',
    icon: <ArrowRight size={24} className={styles.stepIcon} />
  }
];

const HowItWorksModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalBg} onClick={onClose} />
      <div className={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="how-it-works-title">
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close how it works">
          <X size={24} />
        </button>

        <div className={styles.header}>
          <h2 id="how-it-works-title">How Rehome Works</h2>
          <p>A clearer way to browse listings, contact sellers, and complete the next step responsibly without faking trust signals that are not live.</p>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS.map((step, idx) => (
            <div key={idx} className={styles.stepCard}>
              <div className={styles.iconWrapper}>{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.safetyBadge}>
            <ShieldCheck size={20} />
            Verify identity, records, and handoff terms before paying.
          </div>
          <p className={styles.supportNote}>Read the help center for safe rehoming guidance, listing standards, and common scam signals.</p>
          <div className={styles.footerActions}>
            <Link to="/help" className="btn btn-secondary" onClick={onClose}>Open Help Center</Link>
            <button type="button" className="btn btn-primary" onClick={onClose}>Start Browsing</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
