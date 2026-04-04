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
      subtitle: 'Browse available pets, compare seller details, and keep communication organized in one marketplace.',
      ctaText: 'Browse Pets'
    },
    livestock: {
      badge: 'Livestock Listings and Auctions',
      title: <>Trusted <span className={styles.highlight}>Livestock</span> Marketplace.</>,
      subtitle: 'Review livestock listings, compare breeding details, and connect directly with sellers through the platform.',
      ctaText: 'View Auctions'
    },
    supplies: {
      badge: 'Pet and Farm Supply Marketplace',
      title: <>Shop Better <span className={styles.highlight}>Supply</span> Listings.</>,
      subtitle: 'Compare grooming, feeding, and facility supplies from marketplace sellers in one place.',
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
             <div className={styles.stat}><strong>Browse</strong> Fresh listings</div>
             <div className={styles.stat}><strong>Compare</strong> Seller details</div>
             <div className={styles.stat}><strong>Message</strong> Directly on-platform</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
