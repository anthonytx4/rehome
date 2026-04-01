import React from 'react';
import { X, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import styles from './HowItWorksModal.module.css';

const STEPS = [
  {
    title: 'Browse & Connect',
    desc: 'Explore thousands of verified listings. When you find your perfect match, submit an application to the breeder.',
    icon: <Heart size={24} className={styles.stepIcon} />
  },
  {
    title: 'Secure Escrow Payment',
    desc: 'Pay the rehoming fee through our secure portal. We hold the funds safely while you arrange pickup.',
    icon: <ShieldCheck size={24} className={styles.stepIcon} />
  },
  {
    title: 'Welcome Home',
    desc: 'Meet your new pet! Once you confirm the safe rehoming, we release the funds to the breeder.',
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
          <p>The safest way to find your new best friend.</p>
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
