import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import PetGallery from './components/PetGallery';
import ListPetModal from './components/ListPetModal';
import HowItWorksModal from './components/HowItWorksModal';
import PremiumBanner from './components/ads/PremiumBanner';
import FooterPartnerStrip from './components/ads/FooterPartnerStrip';
import CookieConsent from './components/ads/CookieConsent';
import PostActionBanner from './components/ads/PostActionBanner';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [postAction, setPostAction] = useState(null);

  const triggerPostAction = (type) => {
    setPostAction(type);
  };

  return (
    <div className="app-container">
      <Navigation 
        onOpenPost={() => setIsModalOpen(true)} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />
      <main>
        <Hero 
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)} 
          onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
        />
        
        {/* Premium rotating campaign banner */}
        <PremiumBanner />

        <div id="gallery">
          <PetGallery 
            searchQuery={searchQuery}
            onPostAction={triggerPostAction}
          />
        </div>
      </main>

      {/* Partners strip above footer */}
      <FooterPartnerStrip />
      
      <footer style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
        <p>&copy; 2026 Rehome Marketplace. Secure Escrow & Registered Breeders.</p>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <span>Terms</span>
          <a href="#privacy" style={{ cursor: 'pointer' }}>Privacy Policy</a>
          <span>Trust & Safety</span>
        </div>
      </footer>

      <ListPetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      
      {/* Cookie consent banner (required for AdSense) */}
      <CookieConsent />

      {/* Post-action smart ads */}
      {postAction && (
        <PostActionBanner 
          type={postAction} 
          onDismiss={() => setPostAction(null)} 
        />
      )}

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
