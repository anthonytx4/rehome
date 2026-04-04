import React from 'react';
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
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.header}>
          <h2>How Rehome Works</h2>
          <p>A clearer way to browse listings, contact sellers, and complete the next step responsibly.</p>
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
            Ready to find your match?
          </div>
          <button className="btn btn-primary" onClick={onClose}>Start Browsing</button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
