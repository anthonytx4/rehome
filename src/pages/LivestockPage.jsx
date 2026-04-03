import React, { useState } from 'react';
import Hero from '../components/Hero';
import PetGallery from '../components/PetGallery';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import PremiumBanner from '../components/ads/PremiumBanner';
import FooterPartnerStrip from '../components/ads/FooterPartnerStrip';
import styles from './LivestockPage.module.css'; // Changed to local module
import '../App.css'; 

const LivestockPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="livestock-page">
      <Hero 
        title="Elite Livestock Auctions"
        subtitle="The world's most exclusive marketplace for premium livestock. Verified genetics, secure escrow."
        onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <AdSenseUnit slot="livestock-top-banner" />
      <PremiumBanner />
      <div id="gallery">
        <PetGallery 
          searchQuery={searchQuery}
          overrideType="Livestock" // We'll need to update PetGallery to accept this
        />
      </div>
      <AdSenseUnit slot="livestock-bottom-native" />
      <FooterPartnerStrip />
    </div>
  );
};

export default LivestockPage;
