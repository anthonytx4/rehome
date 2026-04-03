import React from 'react';
import { ShieldCheck } from 'lucide-react';
import AdSenseUnit from './AdSenseUnit';
import { hasAdSlot } from '../../config/ads';
import styles from './FooterPartnerStrip.module.css';

const FooterPartnerStrip = () => {
  if (!hasAdSlot('footerPartners') && !import.meta.env.DEV) {
    return null;
  }

  return (
    <div className={styles.strip}>
      <div className={`container ${styles.stripContent}`}>
        <div className={styles.label}>
          <ShieldCheck size={14} />
          Sponsored
        </div>
        <AdSenseUnit
          placement="footerPartners"
          type="horizontal"
          label="Google AdSense"
          className={styles.footerAd}
          minHeight={120}
        />
      </div>
    </div>
  );
};

export default FooterPartnerStrip;
