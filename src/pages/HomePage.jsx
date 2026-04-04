import React, { useState } from 'react';
import Hero from '../components/Hero';
import PetGallery from '../components/PetGallery';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import PremiumBanner from '../components/ads/PremiumBanner';
import FooterPartnerStrip from '../components/ads/FooterPartnerStrip';
import PostActionBanner from '../components/ads/PostActionBanner';

const HomePage = ({ searchQuery }) => {
  const [postAction, setPostAction] = useState(null);

  return (
    <>
      <Hero 
        badge="Browse live marketplace listings"
        title={<>Find your new <span className="highlight">best friend</span> today.</>}
        subtitle="Browse available pets, compare seller details, and keep communication organized in one marketplace."
        ctaText="Browse Pets"
        onOpenHowItWorks={() => document.dispatchEvent(new CustomEvent('openHowItWorks'))}
        onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <PremiumBanner />
      <AdSenseUnit slot="homepage-top-banner" type="horizontal" />
      <div id="gallery">
        <PetGallery 
          searchQuery={searchQuery}
          onPostAction={(type) => setPostAction(type)}
        />
      </div>
      <AdSenseUnit slot="homepage-bottom-native" />
      <FooterPartnerStrip />
      {postAction && (
        <PostActionBanner type={postAction} onDismiss={() => setPostAction(null)} />
      )}
    </>
  );
};

export default HomePage;
