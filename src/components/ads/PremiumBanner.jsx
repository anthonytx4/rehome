import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import analytics from '../../hooks/useAnalytics';
import { useAuth } from '../../context/AuthContext';
import { startMembershipCheckout } from '../../utils/payments';
import styles from './PremiumBanner.module.css';

const CAMPAIGNS = [
  {
    id: 'breeder-membership',
    label: 'Marketplace Upgrade',
    headline: 'Verified Breeder Membership',
    subline: 'Upgrade your account for $25/month to unlock the trust badge, ad-free browsing, and premium placement across Rehome.',
    cta: 'Join as Breeder',
    action: 'membership',
    requiresAuth: true,
    url: '/dashboard?purchase=membership&tier=breeder',
    tier: 'breeder',
    amount: 25,
    gradient: 'linear-gradient(135deg, #1F2937 0%, #111827 55%, #0F172A 100%)',
    accent: '#F59E0B',
    emoji: '⭐',
  },
  {
    id: 'premium-boost',
    label: 'Seller Tools',
    headline: 'Feature a Listing for 7 Days',
    subline: 'Take an active listing to the top of search and give it a premium badge with a $15 boost checkout.',
    cta: 'Boost Now — $15',
    action: 'route',
    requiresAuth: true,
    url: '/dashboard?tab=listings&action=boost',
    gradient: 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #312E81 100%)',
    accent: '#818CF8',
    emoji: '🚀',
  },
  {
    id: 'seller-dashboard',
    label: 'Seller Dashboard',
    headline: 'Manage Listings, Messages, and Billing',
    subline: 'Jump into your dashboard to update prices, answer buyers, or review payments and account status.',
    cta: 'Open Dashboard',
    action: 'route',
    requiresAuth: true,
    url: '/dashboard',
    gradient: 'linear-gradient(135deg, #134E4A 0%, #115E59 50%, #0F766E 100%)',
    accent: '#14B8A6',
    emoji: '📈',
  },
];

const PremiumBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const intervalRef = useRef(null);
  const bannerRef = useRef(null);
  const hasPaidMembership = Boolean(user?.membershipTier && user.membershipTier !== 'free');

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

  const handleClick = async () => {
    analytics.adClick('premium_banner', 'homepage', campaign.id, campaign.url);

    const loginRedirect = `/login?redirect=${encodeURIComponent(campaign.url)}`;
    const canUseAccountActions = isAuthenticated;

    if (campaign.requiresAuth && !canUseAccountActions) {
      navigate(loginRedirect);
      return;
    }

    if (campaign.action === 'membership') {
      if (hasPaidMembership) {
        navigate('/dashboard');
        return;
      }

      setProcessingId(campaign.id);
      try {
        await startMembershipCheckout({
          tier: campaign.tier,
          amount: campaign.amount,
          cancelPath: `${location.pathname}${location.search || ''}` || '/',
        });
      } catch (err) {
        if (err.response?.status === 401) {
          navigate(loginRedirect);
          return;
        }
        toast.error(err.response?.data?.error || 'Unable to start checkout');
        setProcessingId(null);
      }
      return;
    }

    navigate(campaign.url);
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

        <div className={`${styles.campaignBody} ${isTransitioning ? styles.fadeOut : styles.fadeIn} ${campaign.flashy ? styles.isFlashy : ''}`}>
          <span className={styles.emoji}>{campaign.emoji}</span>
          <div className={styles.textBlock}>
            <div className={styles.eyebrow}>{campaign.label}</div>
            <h3 className={`${styles.headline} ${campaign.flashy ? styles.isFlashyTitle : ''}`}>{campaign.headline}</h3>
            <p className={styles.subline}>{campaign.subline}</p>
          </div>
          <button
            className={styles.ctaBtn}
            style={{ backgroundColor: campaign.accent }}
            onClick={handleClick}
            disabled={processingId === campaign.id}
          >
            {processingId === campaign.id
              ? 'Opening checkout...'
              : campaign.action === 'membership' && hasPaidMembership
                ? 'Membership Active'
                : campaign.cta}
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
