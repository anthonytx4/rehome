import React from 'react';
import { ShieldCheck } from 'lucide-react';
import AdSenseUnit from './AdSenseUnit';
import styles from './FooterPartnerStrip.module.css';

const FooterPartnerStrip = () => {
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
