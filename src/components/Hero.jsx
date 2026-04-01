import React from 'react';
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <div className={styles.heroSection}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>New listings verified daily</span>
          <h1 className={styles.title}>
            Find your new <span className={styles.highlight}>best friend</span> today.
          </h1>
          <p className={styles.subtitle}>
            Premium adoption and rehoming marketplace. Connect safely with trusted breeders, loving shelters, and verified pet owners.
          </p>
          
          <div className={styles.ctaGroup}>
            <button className={`btn btn-primary ${styles.ctaBtn}`}>
              Browse Pets
            </button>
            <button className={`btn btn-secondary ${styles.ctaBtn}`}>
              How It Works
            </button>
          </div>
          
          <div className={styles.statsRow}>
             <div className={styles.stat}><strong>Verify</strong> Trusted Platform</div>
             <div className={styles.stat}><strong>Secure</strong> Escrow Payments</div>
             <div className={styles.stat}><strong>Direct</strong> Breeder Access</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
