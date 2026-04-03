import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, BookmarkCheck, Sparkles, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import analytics from '../../hooks/useAnalytics';
import styles from './PostActionBanner.module.css';

const BANNERS = {
  favorite: {
    icon: <BookmarkCheck size={20} />,
    title: 'Saved to Favorites',
    message: 'Open your saved listings whenever you want to compare pets, livestock, or supplies.',
    cta: 'View Saved',
    action: 'route',
    url: '/dashboard?tab=favorites',
    gradient: 'linear-gradient(135deg, #0F766E, #14B8A6)',
  },
  message: {
    icon: <Sparkles size={20} />,
    title: 'Message Sent',
    message: 'Your inbox is ready if the seller replies or wants to send photos, videos, or pickup details.',
    cta: 'Open Messages',
    action: 'route',
    url: '/messages',
    gradient: 'linear-gradient(135deg, #1D4ED8, #4F46E5)',
  },
  listing: {
    icon: <Rocket size={20} />,
    title: 'Listing Published!',
    message: 'Manage your listing, watch messages, or upgrade it to a paid boost from the dashboard.',
    cta: 'Boost for $15',
    action: 'route',
    url: '/dashboard?action=boost',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
  },
};

const PostActionBanner = ({ type = 'favorite', onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();
  const banner = BANNERS[type] || BANNERS.favorite;
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismissRef.current?.();
    }, 400);
  };

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    const autoClose = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        onDismissRef.current?.();
      }, 400);
    }, 8000);

    analytics.adImpression('post_action', type, `post_${type}`);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [type]);

  const handleClick = () => {
    analytics.adClick('post_action', type, `post_${type}`, banner.url);
    navigate(banner.url);
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
