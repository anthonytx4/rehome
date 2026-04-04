import React from 'react';
import Hero from '../components/Hero';
import PetGallery from '../components/PetGallery';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import PremiumBanner from '../components/ads/PremiumBanner';
import FooterPartnerStrip from '../components/ads/FooterPartnerStrip';
import styles from './LivestockPage.module.css'; // Changed to local module
import '../App.css'; 

const LivestockPage = ({ searchQuery }) => {
  return (
    <div className="livestock-page">
      <Hero 
        badge="Timed livestock auctions and quality stock lots"
        title={<>Trusted <span className={styles.highlight}>Livestock</span> Auction Market.</>}
        subtitle="Browse timed cattle, small stock, equine, poultry, and specialty lots with clearer breeding, herd-health, and pickup details."
        ctaText="Browse Lots"
        onOpenHowItWorks={() => document.dispatchEvent(new CustomEvent('openHowItWorks'))}
        onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <AdSenseUnit slot="livestock-top-banner" />
      <PremiumBanner />
      <div id="gallery">
        <PetGallery 
          searchQuery={searchQuery}
          overrideType="Livestock"
        />
      </div>
      <AdSenseUnit slot="livestock-bottom-native" />
      <FooterPartnerStrip />
    </div>
  );
};

export default LivestockPage;
