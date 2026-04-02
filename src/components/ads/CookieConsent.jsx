import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';
import styles from './CookieConsent.module.css';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('rehome_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('rehome_cookie_consent', 'accepted');
    setVisible(false);
    // Enable full GA4 tracking
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
    }
  };

  const decline = () => {
    localStorage.setItem('rehome_cookie_consent', 'declined');
    setVisible(false);
    // Disable personalized tracking
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <Cookie size={24} />
        </div>
        <div className={styles.text}>
          <strong>We value your privacy</strong>
          <p>
            We use cookies to improve your experience, analyze traffic, and show relevant ads.
            Read our <a href="#privacy" className={styles.link}>Privacy Policy</a>.
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.declineBtn} onClick={decline}>Decline</button>
          <button className={styles.acceptBtn} onClick={accept}>
            <ShieldCheck size={15} />
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
