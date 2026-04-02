import React, { useEffect, useRef } from 'react';
import { MapPin, ShieldCheck, Star, ExternalLink } from 'lucide-react';
import analytics from '../../hooks/useAnalytics';
import styles from './NativeSponsoredCard.module.css';

const SPONSORED_ADS = [
  {
    id: 'pet-insurance-lemonade',
    title: 'Lemonade Pet Insurance',
    subtitle: 'Plans from $12/month',
    description: 'Cover vet bills, accidents, and illnesses. Instant claims powered by AI.',
    image: null,
    gradient: 'linear-gradient(135deg, #FF6B8A 0%, #FF8E53 100%)',
    emoji: '🛡️',
    cta: 'Get a Free Quote',
    url: '#',
    badge: 'Insurance Partner',
    category: 'insurance',
  },
  {
    id: 'chewy-supplies',
    title: 'Chewy Pet Supplies',
    subtitle: 'Free delivery on first order',
    description: 'Premium pet food, treats, toys & accessories with autoship savings up to 35%.',
    image: null,
    gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    emoji: '📦',
    cta: 'Shop Now',
    url: '#',
    badge: 'Supply Partner',
    category: 'supplies',
  },
  {
    id: 'rover-services',
    title: 'Rover Pet Sitting',
    subtitle: 'Trusted care in your area',
    description: 'Book insured pet sitters and dog walkers near you. Background-checked and reviewed.',
    image: null,
    gradient: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
    emoji: '🐾',
    cta: 'Find Sitters',
    url: '#',
    badge: 'Care Partner',
    category: 'services',
  },
  {
    id: 'barkbox-subscription',
    title: 'BarkBox Monthly',
    subtitle: '2 toys, 2 treats, 1 chew',
    description: 'Monthly themed boxes crafted for your dog\'s size and play style. Cancel anytime.',
    image: null,
    gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
    emoji: '🎁',
    cta: 'Subscribe',
    url: '#',
    badge: 'Featured',
    category: 'subscription',
  },
];

const NativeSponsoredCard = ({ index = 0 }) => {
  const ad = SPONSORED_ADS[index % SPONSORED_ADS.length];
  const cardRef = useRef(null);
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    if (!cardRef.current || hasTrackedImpression.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedImpression.current) {
          hasTrackedImpression.current = true;
          analytics.adImpression('native_sponsored', 'feed', ad.id);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [ad.id]);

  const handleClick = () => {
    analytics.adClick('native_sponsored', 'feed', ad.id, ad.url);
    window.open(ad.url, '_blank', 'noopener');
  };

  return (
    <div ref={cardRef} className={styles.card} onClick={handleClick}>
      <div className={styles.sponsoredLabel}>
        <Star size={10} fill="currentColor" />
        Sponsored
      </div>

      <div className={styles.imageContainer} style={{ background: ad.gradient }}>
        <span className={styles.emoji}>{ad.emoji}</span>
        <div className={styles.partnerBadge}>
          <ShieldCheck size={12} />
          {ad.badge}
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.header}>
          <h3 className={styles.name}>{ad.title}</h3>
          <span className={styles.price}>{ad.subtitle}</span>
        </div>
        <p className={styles.breed}>{ad.description}</p>
        <div className={styles.footer}>
          <button className={styles.ctaButton}>
            {ad.cta}
            <ExternalLink size={13} />
          </button>
          <span className={styles.typeBadge}>Ad</span>
        </div>
      </div>
    </div>
  );
};

export default NativeSponsoredCard;
