import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import styles from './InterstitialAd.module.css';

const InterstitialAd = ({ isOpen, onClose, campaign = 'default' }) => {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(5);
    setCanClose(false);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.sponsorBadge}>Official Platinum Partner</span>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            disabled={!canClose}
          >
            {canClose ? <X size={20} /> : <span>{countdown}s</span>}
          </button>
        </div>
        
        <div className={styles.body}>
          <div className={styles.adContent}>
            <span className={styles.emoji}>🛡️</span>
            <h2>Royal Companion Insurance</h2>
            <p>Comprehensive coverage starting at $25/mo per animal. Direct payout for elite genetics and rare breeds.</p>
            <div className={styles.features}>
              <span>✓ High-Value Species Covered</span>
              <span>✓ Worldwide Transport Protection</span>
            </div>
          </div>
          
          <button className={styles.ctaBtn} onClick={() => window.open('https://partners.rehome.world/insurance', '_blank')}>
            Get Instant Quote <ExternalLink size={16} />
          </button>
        </div>
        
        <p className={styles.disclaimer}>Sponsored content supports the Rehome marketplace.</p>
      </div>
    </div>
  );
};

export default InterstitialAd;
