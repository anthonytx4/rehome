import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import analytics from '../../hooks/useAnalytics';
import styles from './PostActionBanner.module.css';

const BANNERS = {
  favorite: {
    icon: <ShieldCheck size={20} />,
    title: 'Protect Your Future Pet',
    message: 'Get pet insurance coverage from day one — plans starting at $12/month.',
    cta: 'Get a Quote',
    url: '#',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
  },
  message: {
    icon: <Sparkles size={20} />,
    title: 'While You Wait...',
    message: 'Gear up for your new companion — browse supplies with free shipping.',
    cta: 'Shop Supplies',
    url: '#',
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
  },
  listing: {
    icon: <Heart size={20} />,
    title: 'Listing Published!',
    message: 'Boost your listing to the top of every search for 7 days.',
    cta: 'Boost for $15',
    url: '#',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
  },
};

const PostActionBanner = ({ type = 'favorite', onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const banner = BANNERS[type] || BANNERS.favorite;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    const autoClose = setTimeout(() => dismiss(), 8000);

    analytics.adImpression('post_action', type, `post_${type}`);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [type]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 400);
  };

  const handleClick = () => {
    analytics.adClick('post_action', type, `post_${type}`, banner.url);
    dismiss();
  };

  if (!visible && !exiting) return null;

  return (
    <div className={`${styles.banner} ${exiting ? styles.exit : styles.enter}`} style={{ background: banner.gradient }}>
      <div className={styles.content}>
        <div className={styles.iconWrap}>{banner.icon}</div>
        <div className={styles.text}>
          <strong className={styles.title}>{banner.title}</strong>
          <span className={styles.message}>{banner.message}</span>
        </div>
        <button className={styles.cta} onClick={handleClick}>
          {banner.cta}
          <ArrowRight size={14} />
        </button>
        <button className={styles.close} onClick={dismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default PostActionBanner;
