import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import PetGallery from './components/PetGallery';
import ListPetModal from './components/ListPetModal';
import HowItWorksModal from './components/HowItWorksModal';
import PremiumBanner from './components/ads/PremiumBanner';
import FooterPartnerStrip from './components/ads/FooterPartnerStrip';
import CookieConsent from './components/ads/CookieConsent';
import PostActionBanner from './components/ads/PostActionBanner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import './App.css';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin route wrapper
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  if (!isAuthenticated || user?.email !== 'admin@rehome.world') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Homepage component (existing layout)
const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [postAction, setPostAction] = useState(null);

  return (
    <>
      <Hero 
        onOpenHowItWorks={() => document.dispatchEvent(new CustomEvent('openHowItWorks'))}
        onBrowse={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <PremiumBanner />
      <div id="gallery">
        <PetGallery 
          searchQuery={searchQuery}
          onPostAction={(type) => setPostAction(type)}
        />
      </div>
      <FooterPartnerStrip />
      <footer style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
        <p>&copy; 2026 Rehome Marketplace. Secure Escrow & Registered Breeders.</p>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.9rem' }}>
          <span>Terms</span>
          <a href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</a>
          <span>Trust & Safety</span>
        </div>
      </footer>
      {postAction && (
        <PostActionBanner type={postAction} onDismiss={() => setPostAction(null)} />
      )}
    </>
  );
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for HowItWorks events from HomePage
  React.useEffect(() => {
    const handler = () => setIsHowItWorksOpen(true);
    document.addEventListener('openHowItWorks', handler);
    return () => document.removeEventListener('openHowItWorks', handler);
  }, []);

  return (
    <div className="app-container">
      <Navigation 
        onOpenPost={() => setIsModalOpen(true)} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:listingId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Routes>
      </main>

      <ListPetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <CookieConsent />
      <Analytics />
    </div>
  );
}

export default App;
