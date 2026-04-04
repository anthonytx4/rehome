import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../api/client';
import PetDetailModal from '../components/PetDetailModal';
import { normalizeListing } from '../utils/listings';
import toast from 'react-hot-toast';

const SITE_ORIGIN = 'https://rehome.world';

const setMetaContent = (key, value, isProperty = false) => {
  const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (isProperty) tag.setAttribute('property', key);
    else tag.setAttribute('name', key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
};

const setCanonical = (href) => {
  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
};

// This is a "page" wrapper for PetDetailModal content
const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoryPath = (() => {
    const category = String(listing?.category || '').toLowerCase();
    if (category === 'livestock') return '/livestock';
    if (category === 'supplies') return '/supplies';
    return '/';
  })();
  const fallbackPath = location.state?.from || categoryPath;

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
      return;
    }
    navigate(fallbackPath, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    const fetchListing = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        if (cancelled) return;
        setListing(normalizeListing(res.data));
        setError(null);
      } catch {
        if (cancelled) return;
        setError('That listing could not be found or is no longer available.');
        toast.error('Listing not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchListing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!listing) return;

    const title = `${listing.name || listing.title} in ${listing.location} | Rehome`;
    const description = `${listing.description}`.slice(0, 155);
    const canonicalUrl = `${SITE_ORIGIN}/listing/${id}`;
    const shouldIndex = listing.status === 'available';

    document.title = title;
    setMetaContent('description', description);
    setMetaContent('robots', shouldIndex ? 'index,follow,max-image-preview:large' : 'noindex,nofollow');
    setMetaContent('og:title', title, true);
    setMetaContent('og:description', description, true);
    setMetaContent('og:type', 'article', true);
    setMetaContent('og:url', canonicalUrl, true);
    setMetaContent('twitter:title', title);
    setMetaContent('twitter:description', description);
    setCanonical(canonicalUrl);
  }, [id, listing]);

  if (loading) {
    return (
      <div style={{ padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '999px', margin: '0 auto 20px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', opacity: 0.85 }} />
          <h1 style={{ marginBottom: '8px' }}>Loading listing</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>We’re pulling the latest details and images.</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={{ padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ marginBottom: '12px' }}>Listing unavailable</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{error || 'We could not load this listing.'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleBack} className="btn btn-secondary">Go Back</button>
            <Link to={fallbackPath} className="btn btn-primary">Browse Marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClassifiedAd',
    name: listing.title || listing.name,
    description: listing.description,
    url: `${SITE_ORIGIN}/listing/${listing.id}`,
    category: listing.category,
    datePosted: listing.createdAt || undefined,
    image: [listing.image, ...(listing.images || [])].filter(Boolean),
    seller: listing.sellerName
      ? {
          '@type': 'Person',
          name: listing.sellerName,
        }
      : undefined,
    itemOffered: {
      '@type': 'Thing',
      name: listing.name || listing.title,
      description: `${listing.breed} • ${listing.type}`,
    },
    offers: {
      '@type': 'Offer',
      price: String(listing.fee || 0),
      priceCurrency: 'USD',
      availability: listing.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <script type="application/ld+json">{JSON.stringify(listingJsonLd)}</script>
      <button 
        onClick={handleBack}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '20px', 
          border: 'none', 
          background: 'none', 
          cursor: 'pointer',
          color: 'var(--color-primary)',
          fontWeight: '600'
        }}
      >
        <ChevronLeft size={20} /> Back to marketplace
      </button>
      
      <PetDetailModal 
        pet={listing} 
        onClose={handleBack}
        isPage={true}
      />
    </div>
  );
};

export default ListingDetailPage;
