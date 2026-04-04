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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import LivestockPage from './pages/LivestockPage';
import SuppliesPage from './pages/SuppliesPage';
import ListingDetailPage from './pages/ListingDetailPage';
import PrivacyPage from './pages/PrivacyPage';
import HelpCenterPage from './pages/HelpCenterPage';
import './App.css';

const SITE_NAME = 'Rehome';
const SITE_ORIGIN = 'https://rehome.world';
const PRIVATE_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password', '/dashboard', '/messages', '/admin']);

const PAGE_META = {
  '/': {
    title: 'Rehome | Pets, Livestock, and Supplies Marketplace',
    description: 'Browse marketplace listings, message sellers, and manage your account on Rehome. Paid checkout, boosts, and billing tools only appear when configured.',
    ogType: 'website',
  },
  '/livestock': {
    title: 'Rehome Livestock Marketplace',
    description: 'Browse livestock listings, compare sellers, and manage inquiries in one marketplace.',
    ogType: 'website',
  },
  '/supplies': {
    title: 'Rehome Supplies Marketplace',
    description: 'Browse pet and farm supplies, compare listings, and message sellers from one place.',
    ogType: 'website',
  },
  '/privacy': {
    title: 'Privacy, Terms, and Trust | Rehome',
    description: 'Read Rehome’s privacy policy, marketplace terms, payment notes, and trust and safety guidance.',
    ogType: 'article',
  },
  '/forgot-password': {
    title: 'Forgot Password | Rehome',
    description: 'Request a secure password reset for your Rehome account.',
    ogType: 'website',
  },
  '/reset-password': {
    title: 'Reset Password | Rehome',
    description: 'Set a new password for your Rehome account.',
    ogType: 'website',
  },
  '/help': {
    title: 'Help Center, FAQ, and Safety Guide | Rehome',
    description: 'Read Rehome’s listing standards, safe rehoming guidance, prohibited behavior policy, and marketplace FAQ.',
    ogType: 'article',
  },
  '/listing': {
    title: 'Listing Details | Rehome',
    description: 'View listing details, seller information, and contact options on Rehome.',
    ogType: 'article',
  },
  default: {
    title: 'Rehome',
    description: 'Rehome marketplace',
    ogType: 'website',
  },
};

const setLinkMeta = (rel, attribute, value) => {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attribute, value);
};

const setMetaContent = (key, value, isProperty = false) => {
  const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (isProperty) {
      tag.setAttribute('property', key);
    } else {
      tag.setAttribute('name', key);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
};

const getPageMeta = (pathname) => {
  if (pathname.startsWith('/listing/')) return PAGE_META['/listing'];
  return PAGE_META[pathname] || PAGE_META.default;
};

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

const SiteFooter = () => (
  <footer
    style={{
      marginTop: '48px',
      padding: '56px 0 28px',
      borderTop: '1px solid var(--color-border)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.98))',
    }}
  >
    <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--color-secondary)', fontWeight: 900, fontSize: '1.05rem' }}>
          <span style={{ color: 'var(--color-primary)' }}>{SITE_NAME}</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, maxWidth: '560px' }}>
          Marketplace messaging, seller profiles, moderation tools, and discovery flows for pets, livestock, and supplies.
        </p>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: '12px' }}>
          Live checkout, membership, and boost flows only appear when payment configuration is connected in production and should stay off until support and compliance paths are ready.
        </p>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>Marketplace</h3>
        <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'inherit' }}>Pets</Link>
          <Link to="/livestock" style={{ color: 'inherit' }}>Livestock</Link>
          <Link to="/supplies" style={{ color: 'inherit' }}>Supplies</Link>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>Account</h3>
        <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Link to="/login" style={{ color: 'inherit' }}>Sign In</Link>
          <Link to="/register" style={{ color: 'inherit' }}>Create Account</Link>
          <Link to="/dashboard" style={{ color: 'inherit' }}>Dashboard</Link>
          <Link to="/messages" style={{ color: 'inherit' }}>Messages</Link>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>Trust</h3>
        <div style={{ display: 'grid', gap: '10px', color: 'var(--color-text-muted)' }}>
          <Link to="/help" style={{ color: 'inherit' }}>Help Center</Link>
          <Link to="/privacy#terms" style={{ color: 'inherit' }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
          <Link to="/privacy#payments" style={{ color: 'inherit' }}>Payments</Link>
          <Link to="/privacy#trust-safety" style={{ color: 'inherit' }}>Trust & Safety</Link>
        </div>
      </div>
    </div>

    <div className="container" style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
      <span>© 2026 Rehome Marketplace.</span>
      <span>Always verify identity, records, and handoff terms before paying or arranging transport.</span>
    </div>
  </footer>
);

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

  useEffect(() => {
    const meta = getPageMeta(location.pathname);
    const canonicalUrl = `${SITE_ORIGIN}${location.pathname}`;
    const isPrivateRoute = PRIVATE_PATHS.has(location.pathname) || location.pathname.startsWith('/messages/');

    document.title = meta.title;
    setMetaContent('description', meta.description);
    setMetaContent('robots', isPrivateRoute ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    setMetaContent('googlebot', isPrivateRoute ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    setMetaContent('og:title', meta.title, true);
    setMetaContent('og:description', meta.description, true);
    setMetaContent('og:type', meta.ogType, true);
    setMetaContent('og:url', canonicalUrl, true);
    setMetaContent('twitter:title', meta.title);
    setMetaContent('twitter:description', meta.description);
    setMetaContent('twitter:card', 'summary_large_image');
    setMetaContent('theme-color', '#10B981');
    setLinkMeta('canonical', 'href', canonicalUrl);
  }, [location.pathname]);

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:listingId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/livestock" element={<LivestockPage searchQuery={searchQuery} />} />
          <Route path="/supplies" element={<SuppliesPage searchQuery={searchQuery} />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <ListPetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <InterstitialAd isOpen={showInterstitial} onClose={() => setShowInterstitial(false)} />
      <CookieConsent />
      <SiteFooter />
      <Analytics />
    </div>
  );
}

export default App;
