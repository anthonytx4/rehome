import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../api/client';
import PetDetailModal from '../components/PetDetailModal';
import { normalizeListing } from '../utils/listings';
import toast from 'react-hot-toast';

// This is a "page" wrapper for PetDetailModal content
const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <button onClick={() => navigate(-1)} className="btn btn-secondary">Go Back</button>
            <Link to="/" className="btn btn-primary">Browse Marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={() => navigate(-1)} 
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
        onClose={() => navigate(-1)} 
        isPage={true}
      />
    </div>
  );
};

export default ListingDetailPage;
