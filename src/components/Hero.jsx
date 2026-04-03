import { useLocation } from 'react-router-dom';
import styles from './Hero.module.css';

const Hero = ({ onOpenHowItWorks, onBrowse, title, subtitle, badge, ctaText }) => {
  const location = useLocation();
  const path = location.pathname;
  const marketplace = path === '/livestock' ? 'livestock' : path === '/supplies' ? 'supplies' : 'pets';
  
  const defaultContent = {
    pets: {
      badge: 'New listings verified daily',
      title: <>Find your new <span className={styles.highlight}>best friend</span> today.</>,
      subtitle: 'Premium adoption and rehoming marketplace. Connect safely with trusted breeders, loving shelters, and verified pet owners.',
      ctaText: 'Browse Pets'
    },
    livestock: {
      badge: 'Elite Livestock Auctions — High Stakes Bidding',
      title: <>Royal <span className={styles.highlight}>Livestock</span> Marketplace.</>,
      subtitle: "The world's most exclusive marketplace for premium livestock. Verified genetics, secure escrow, and high-impact trading.",
      ctaText: 'View Auctions'
    },
    supplies: {
      badge: 'B2B/B2C Premium Supplies Market',
      title: <>The Ultimate <span className={styles.highlight}>Supply</span> Market.</>,
      subtitle: 'Stock your facility with professional-grade hygiene, grooming, and healthcare supplies for any species.',
      ctaText: 'Browse Supplies'
    }
  };

  const content = defaultContent[marketplace] || defaultContent.pets;

  return (
    <div className={styles.heroSection}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>{badge || content.badge}</span>
          <h1 className={styles.title}>
            {title || content.title}
          </h1>
          <p className={styles.subtitle}>
            {subtitle || content.subtitle}
          </p>
          
          <div className={styles.ctaGroup}>
            <button className={`btn btn-primary ${styles.ctaBtn}`} onClick={onBrowse}>
              {ctaText || content.ctaText}
            </button>
            <button className={`btn btn-secondary ${styles.ctaBtn}`} onClick={onOpenHowItWorks}>
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
