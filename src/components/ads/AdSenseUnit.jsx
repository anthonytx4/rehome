import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AdSenseUnit.module.css';

// type: 'square' | 'horizontal'  (maps to AdSense data-ad-format)
const AdSenseUnit = ({ slot, type = 'square' }) => {
  const { user } = useAuth();
  const isAdFree = user?.membershipTier === 'breeder';

  useEffect(() => {
    if (isAdFree) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, [isAdFree]);

  if (isAdFree) return null;

  const handleClaimBonus = () => {
    toast.success('💎 Diamond Boost activated! Your listings are boosted for 30 minutes.', {
      duration: 4000,
    });
  };

  return (
    <div className={`${styles.adWrapper} ${type === 'horizontal' ? styles.horizontal : ''}`}>
      <div className={styles.adLabel}>Official Sponsor</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7995028462770772"
        data-ad-slot={slot}
        data-ad-format={type === 'horizontal' ? 'horizontal' : 'auto'}
        data-full-width-responsive="true"
      />
      <div className={styles.gamificationFooter}>
        <button className={styles.claimBonusBtn} onClick={handleClaimBonus}>
          💎 Claim Diamond Bonus
        </button>
      </div>
    </div>
  );
};

export default AdSenseUnit;
