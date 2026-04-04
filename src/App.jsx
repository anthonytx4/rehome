import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import PetGallery from './components/PetGallery';
import ListPetModal from './components/ListPetModal';
import HowItWorksModal from './components/HowItWorksModal';
import AdSenseUnit from './components/ads/AdSenseUnit';
import PremiumBanner from './components/ads/PremiumBanner';
import FooterPartnerStrip from './components/ads/FooterPartnerStrip';
import CookieConsent from './components/ads/CookieConsent';
import PostActionBanner from './components/ads/PostActionBanner';
import InterstitialAd from './components/ads/InterstitialAd';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import LivestockPage from './pages/LivestockPage';
import SuppliesPage from './pages/SuppliesPage';
import ListingDetailPage from './pages/ListingDetailPage';
import PrivacyPage from './pages/PrivacyPage';
import './App.css';

const RouteLoading = ({ message }) => (
  <div style={{ minHeight: '55vh', display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
    <div style={{ textAlign: 'center', padding: '32px 28px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', minWidth: '280px' }}>
      <div style={{ width: '52px', height: '52px', margin: '0 auto 16px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', opacity: 0.9 }} />
      <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{message}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Just a moment while we prepare your session.</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, authActionPending } = useAuth();
  if (loading || authActionPending) return <RouteLoading message="Loading your account" />;
  if (isAuthenticated) return children;
  const redirect = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
};

// Admin route wrapper
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading, authActionPending } = useAuth();
  if (loading || authActionPending) return <RouteLoading message="Loading admin tools" />;
  if (!isAuthenticated || user?.email !== 'admin@rehome.world') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Homepage component (existing layout)
const HomePage = ({ searchQuery }) => {
  const [postAction, setPostAction] = useState(null);

  return (
    <>
      <Hero 
        badge="Trusted by Verified Breeders"
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
      <footer style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
        <p>&copy; 2026 Rehome Marketplace. Marketplace messaging, seller profiles, and buyer-friendly discovery tools.</p>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.9rem' }}>
          <Link to="/privacy#terms" style={{ color: 'inherit' }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link>
          <Link to="/privacy#trust-safety" style={{ color: 'inherit' }}>Trust & Safety</Link>
        </div>
      </footer>
      {postAction && (
        <PostActionBanner type={postAction} onDismiss={() => setPostAction(null)} />
      )}
    </>
  );
};

const NotFoundPage = () => (
  <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '48px 24px' }}>
    <div style={{ maxWidth: '640px', width: '100%', padding: '48px 32px', borderRadius: '28px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '12px' }}>404</p>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>That page wandered off.</h1>
      <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
        The link may be outdated or the page may have moved. Head back to the marketplace or check the privacy page if you were looking for policy details.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">Back to Marketplace</Link>
        <Link to="/privacy" className="btn btn-secondary">Privacy Policy</Link>
      </div>
    </div>
  </div>
);

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Dynamic Marketplace Theming & Aggressive Monetization
  useEffect(() => {
    let theme = 'pets';
    const shouldShowInterstitial = location.pathname === '/livestock' || location.pathname === '/supplies';
    if (location.pathname === '/livestock') {
      theme = 'livestock';
    }
    if (location.pathname === '/supplies') { 
      theme = 'supplies';
    }
    const timer = setTimeout(() => setShowInterstitial(shouldShowInterstitial), 0);
    document.documentElement.setAttribute('data-marketplace', theme);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Listen for HowItWorks events from HomePage
  useEffect(() => {
    const handler = () => setIsHowItWorksOpen(true);
    document.addEventListener('openHowItWorks', handler);
    return () => document.removeEventListener('openHowItWorks', handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    document.addEventListener('openPostModal', handler);
    return () => document.removeEventListener('openPostModal', handler);
  }, []);

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => {
        const target = document.getElementById(location.hash.slice(1));
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.hash, location.pathname]);

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
          <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:listingId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/livestock" element={<LivestockPage searchQuery={searchQuery} />} />
          <Route path="/supplies" element={<SuppliesPage searchQuery={searchQuery} />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <ListPetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <InterstitialAd isOpen={showInterstitial} onClose={() => setShowInterstitial(false)} />
      <CookieConsent />
      <Analytics />
    </div>
  );
}

export default App;
