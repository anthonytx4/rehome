import React from 'react';
import Hero from '../components/Hero';
import PetGallery from '../components/PetGallery';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import PremiumBanner from '../components/ads/PremiumBanner';
import FooterPartnerStrip from '../components/ads/FooterPartnerStrip';
import '../App.css';

const SuppliesPage = ({ searchQuery }) => {
  return (
    <div className="supplies-page">
      <Hero 
        badge="Pet and Farm Supply Marketplace"
        title={<>Shop Better <span className="highlight">Supply</span> Listings.</>}
        subtitle="Compare grooming, feeding, and facility supplies from marketplace sellers in one place."
        ctaText="Shop Supplies"
        onOpenHowItWorks={() => document.dispatchEvent(new CustomEvent('openHowItWorks'))}
        onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <AdSenseUnit slot="supplies-top-banner" />
      <PremiumBanner />
      <div id="gallery">
        <PetGallery 
          searchQuery={searchQuery}
          overrideType="Supplies"
        />
      </div>
      <AdSenseUnit slot="supplies-bottom-native" />
      <FooterPartnerStrip />
    </div>
  );
};

export default SuppliesPage;
