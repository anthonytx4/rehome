import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import PetGallery from './components/PetGallery';
import ListPetModal from './components/ListPetModal';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

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
        <div id="gallery">
          <PetGallery searchQuery={searchQuery} />
        </div>
      </main>
      
      <footer style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: '64px' }}>
        <p>&copy; 2026 Rehome Marketplace. Secure Escrow & Registered Breeders.</p>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <span>Terms</span>
          <span>Privacy</span>
          <span>Trust & Safety</span>
        </div>
      </footer>

      <ListPetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
    </div>
  );
}

export default App;
