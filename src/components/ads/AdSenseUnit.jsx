import React, { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ADSENSE_CLIENT_ID, getAdSlot } from '../../config/ads';
import styles from './AdSenseUnit.module.css';

const FORMAT_MAP = {
  square: 'auto',
  horizontal: 'horizontal',
  rectangle: 'rectangle',
  fluid: 'autorelaxed',
};

// placement maps to a configured AdSense slot id in env.
const AdSenseUnit = ({
  slot,
  placement,
  type = 'square',
  label = 'Advertisement',
  className = '',
  minHeight,
}) => {
  const { user } = useAuth();
  const insRef = useRef(null);
  const isAdFree = Boolean(user?.membershipTier && user.membershipTier !== 'free');
  const resolvedPlacement = placement || slot;
  const resolvedSlot = useMemo(() => getAdSlot(resolvedPlacement), [resolvedPlacement]);
  const format = FORMAT_MAP[type] || 'auto';

  useEffect(() => {
    if (isAdFree || !resolvedSlot || !ADSENSE_CLIENT_ID || !insRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('AdSense push skipped:', error);
      }
    }
  }, [isAdFree, resolvedSlot, format]);

  if (isAdFree || !resolvedSlot || !ADSENSE_CLIENT_ID) {
    if (import.meta.env.DEV && !resolvedSlot) {
      console.warn(`AdSense slot not configured for "${resolvedPlacement}"`);
    }
    return null;
  }

  return (
    <div className={`${styles.adWrapper} ${type === 'horizontal' ? styles.horizontal : ''} ${className}`}>
      <div className={styles.adLabel}>{label}</div>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={resolvedSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSenseUnit;
