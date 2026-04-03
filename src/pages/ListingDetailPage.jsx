import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../api/client';
import PetDetailModal from '../components/PetDetailModal';
import toast from 'react-hot-toast';

// This is a "page" wrapper for PetDetailModal content
const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data);
      } catch (err) {
        toast.error('Listing not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, navigate]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading listing...</div>;
  if (!listing) return null;

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
      
      {/* Reusing the PetDetailModal layout but without the overlay since it's a page */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PetDetailModal 
          pet={listing} 
          onClose={() => navigate(-1)} 
          isPage={true} // Add a prop to handle page vs modal styling if needed
        />
      </div>
    </div>
  );
};

export default ListingDetailPage;
