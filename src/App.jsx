import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import ListPetModal from './components/ListPetModal';
import HowItWorksModal from './components/HowItWorksModal';
import CookieConsent from './components/ads/CookieConsent';
import InterstitialAd from './components/ads/InterstitialAd';
import { ProtectedRoute, AdminRoute } from './components/auth/AuthRules';
import Footer from './components/layout/Footer';

// Page Imports
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import AdminPage from './pages/AdminPage';
import CategoryPage from './pages/CategoryPage';
import ListingDetailPage from './pages/ListingDetailPage';
import PrivacyPage from './pages/PrivacyPage';
import HelpCenterPage from './pages/HelpCenterPage';
import NotFoundPage from './pages/NotFoundPage';

import './App.css';

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

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    let theme = 'pets';
    const shouldShowInterstitial = location.pathname === '/livestock' || location.pathname === '/supplies';
    if (location.pathname === '/livestock') theme = 'livestock';
    if (location.pathname === '/supplies') theme = 'supplies';
    
    const timer = setTimeout(() => setShowInterstitial(shouldShowInterstitial), 0);
    document.documentElement.setAttribute('data-marketplace', theme);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
          <Route path="/livestock" element={<CategoryPage category="livestock" searchQuery={searchQuery} />} />
          <Route path="/supplies" element={<CategoryPage category="supplies" searchQuery={searchQuery} />} />
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
      <Footer />
      <Analytics />
    </div>
  );
}

export default App;
