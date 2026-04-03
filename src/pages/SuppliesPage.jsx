import React, { useState } from 'react';
import Hero from '../components/Hero';
import PetGallery from '../components/PetGallery';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import PremiumBanner from '../components/ads/PremiumBanner';
import FooterPartnerStrip from '../components/ads/FooterPartnerStrip';
import '../App.css';

const SuppliesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="supplies-page">
      <Hero 
        badge="Premium Market Supplies — Built for Champions"
        title={<>Luxury <span className="highlight">Market</span> Supplies.</>}
        subtitle="Exclusive accessories, high-performance nutrition, and elite habitat solutions for your companions. Bulk options available."
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
