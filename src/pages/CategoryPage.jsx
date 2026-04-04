import React from 'react';
import Hero from '../components/Hero';
import PetGallery from '../components/PetGallery';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import PremiumBanner from '../components/ads/PremiumBanner';
import FooterPartnerStrip from '../components/ads/FooterPartnerStrip';
import '../App.css';

const CATEGORY_CONFIG = {
  livestock: {
    badge: "Timed livestock auctions and quality stock lots",
    title: ["Trusted ", "Livestock", " Auction Market."],
    subtitle: "Browse timed cattle, small stock, equine, poultry, and specialty lots with clearer breeding, herd-health, and pickup details.",
    cta: "Browse Lots",
    type: "Livestock",
    slotPrefix: "livestock",
  },
  supplies: {
    badge: "Pet and Farm Supply Marketplace",
    title: ["Shop Better ", "Supply", " Listings."],
    subtitle: "Compare grooming, feeding, and facility supplies from marketplace sellers in one place.",
    cta: "Shop Supplies",
    type: "Supplies",
    slotPrefix: "supplies",
  },
};

const CategoryPage = ({ category, searchQuery }) => {
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;

  return (
    <div className={`${category}-page`}>
      <Hero 
        badge={config.badge}
        title={<>{config.title[0]}<span className="highlight">{config.title[1]}</span>{config.title[2]}</>}
        subtitle={config.subtitle}
        ctaText={config.cta}
        onOpenHowItWorks={() => document.dispatchEvent(new CustomEvent('openHowItWorks'))}
        onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <AdSenseUnit slot={`${config.slotPrefix}-top-banner`} />
      <PremiumBanner />
      <div id="gallery">
        <PetGallery 
          searchQuery={searchQuery}
          overrideType={config.type}
        />
      </div>
      <AdSenseUnit slot={`${config.slotPrefix}-bottom-native`} />
      <FooterPartnerStrip />
    </div>
  );
};

export default CategoryPage;
