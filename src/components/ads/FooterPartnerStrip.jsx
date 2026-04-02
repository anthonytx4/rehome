import React, { useRef, useEffect } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import analytics from '../../hooks/useAnalytics';
import styles from './FooterPartnerStrip.module.css';

const PARTNERS = [
  {
    id: 'chewy',
    name: 'Chewy',
    tagline: 'Pet Supplies & Free Delivery',
    url: '#',
    emoji: '📦',
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
  },
  {
    id: 'lemonade',
    name: 'Lemonade',
    tagline: 'Pet Insurance from $12/mo',
    url: '#',
    emoji: '🛡️',
    gradient: 'linear-gradient(135deg, #FF6B8A, #FF8E53)',
  },
  {
    id: 'rover',
    name: 'Rover',
    tagline: 'Pet Sitting & Dog Walking',
    url: '#',
    emoji: '🐾',
    gradient: 'linear-gradient(135deg, #11998E, #38EF7D)',
  },
];

const FooterPartnerStrip = () => {
  const stripRef = useRef(null);

  useEffect(() => {
    if (!stripRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          analytics.adImpression('footer_strip', 'footer', 'partner_strip');
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(stripRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClick = (partner) => {
    analytics.adClick('footer_strip', 'footer', partner.id, partner.url);
    window.open(partner.url, '_blank', 'noopener');
  };

  return (
    <div ref={stripRef} className={styles.strip}>
      <div className={`container ${styles.stripContent}`}>
        <div className={styles.label}>
          <ShieldCheck size={14} />
          Our Partners
        </div>
        <div className={styles.grid}>
          {PARTNERS.map((partner) => (
            <button
              key={partner.id}
              className={styles.partnerCard}
              onClick={() => handleClick(partner)}
            >
              <div className={styles.partnerIcon} style={{ background: partner.gradient }}>
                <span>{partner.emoji}</span>
              </div>
              <div className={styles.partnerInfo}>
                <span className={styles.partnerName}>{partner.name}</span>
                <span className={styles.partnerTagline}>{partner.tagline}</span>
              </div>
              <ExternalLink size={14} className={styles.arrow} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FooterPartnerStrip;
