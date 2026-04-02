import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import analytics from '../../hooks/useAnalytics';
import styles from './PremiumBanner.module.css';

const CAMPAIGNS = [
  {
    id: 'insurance-promo',
    headline: 'Protect Your New Companion',
    subline: 'Pet insurance plans from $12/mo — accidents, illnesses & routine care covered.',
    cta: 'Get a Free Quote',
    url: '#',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    accent: '#10B981',
    emoji: '🛡️',
  },
  {
    id: 'breeder-sub',
    headline: 'Are You a Verified Breeder?',
    subline: 'Get a gold verification badge, priority placement, and direct buyer access for $29/mo.',
    cta: 'Join as Breeder',
    url: '#',
    gradient: 'linear-gradient(135deg, #78350F 0%, #92400E 50%, #78350F 100%)',
    accent: '#F59E0B',
    emoji: '⭐',
  },
  {
    id: 'premium-boost',
    headline: 'Listings Sell 4x Faster With Boost',
    subline: 'Pin your pet to the top of every search. Premium gold border. 7 days of maximum visibility.',
    cta: 'Boost a Listing — $15',
    url: '#',
    gradient: 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #312E81 100%)',
    accent: '#818CF8',
    emoji: '🚀',
  },
];

const PremiumBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);
  const bannerRef = useRef(null);

  const campaign = CAMPAIGNS[currentIndex];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % CAMPAIGNS.length);
        setIsTransitioning(false);
      }, 400);
    }, 6000);

    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!bannerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          analytics.adImpression('premium_banner', 'homepage', campaign.id);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(bannerRef.current);
    return () => observer.disconnect();
  }, [campaign.id]);

  const handleClick = () => {
    analytics.adClick('premium_banner', 'homepage', campaign.id, campaign.url);
  };

  const goTo = (direction) => {
    clearInterval(intervalRef.current);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        direction === 'next'
          ? (prev + 1) % CAMPAIGNS.length
          : (prev - 1 + CAMPAIGNS.length) % CAMPAIGNS.length
      );
      setIsTransitioning(false);
    }, 400);
  };

  if (dismissed) return null;

  return (
    <div
      ref={bannerRef}
      className={styles.banner}
      style={{ background: campaign.gradient }}
    >
      <div className={`container ${styles.bannerContent}`}>
        <button className={styles.dismissBtn} onClick={() => setDismissed(true)}>
          <X size={16} />
        </button>

        <button className={styles.navBtn} onClick={() => goTo('prev')}>
          <ChevronLeft size={18} />
        </button>

        <div className={`${styles.campaignBody} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
          <span className={styles.emoji}>{campaign.emoji}</span>
          <div className={styles.textBlock}>
            <h3 className={styles.headline}>{campaign.headline}</h3>
            <p className={styles.subline}>{campaign.subline}</p>
          </div>
          <button
            className={styles.ctaBtn}
            style={{ backgroundColor: campaign.accent }}
            onClick={handleClick}
          >
            {campaign.cta}
            <ArrowRight size={16} />
          </button>
        </div>

        <button className={styles.navBtn} onClick={() => goTo('next')}>
          <ChevronRight size={18} />
        </button>

        <div className={styles.dots}>
          {CAMPAIGNS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumBanner;
