import React, { useDeferredValue, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import PetCard from './PetCard';
import PetDetailModal from './PetDetailModal';
import AdSenseUnit from './ads/AdSenseUnit';
import styles from './PetGallery.module.css';
import { normalizeListing } from '../utils/listings';

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const makeMockArtwork = (pet, index) => {
  const palette = [
    ['#F59E0B', '#FB7185'],
    ['#0EA5E9', '#38BDF8'],
    ['#10B981', '#34D399'],
    ['#8B5CF6', '#A78BFA'],
    ['#E11D48', '#F97316'],
  ];
  const [accent, accent2] = palette[hashString(`${pet.name}|${pet.type}|${index}`) % palette.length];
  const title = escapeXml(pet.name);
  const subtitle = escapeXml(`${pet.breed} · ${pet.location}`);
  const footer = escapeXml(`${pet.category.toUpperCase()} · ${pet.fee}`);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${accent2}" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" rx="40" fill="url(#bg)" />
      <circle cx="640" cy="150" r="72" fill="rgba(255,255,255,0.14)" />
      <circle cx="140" cy="140" r="52" fill="rgba(255,255,255,0.12)" />
      <circle cx="645" cy="460" r="120" fill="rgba(255,255,255,0.08)" />
      <rect x="50" y="350" width="700" height="190" rx="28" fill="#08101C" fill-opacity="0.82" />
      <text x="68" y="428" font-size="54" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#FFFFFF">${title}</text>
      <text x="68" y="474" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="#E5E7EB">${subtitle}</text>
      <text x="68" y="520" font-size="22" font-family="Arial, Helvetica, sans-serif" fill="#FDE68A">${footer}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const mockPetBlueprints = [
  { name: 'Cooper', type: 'Dog', breed: 'Golden Retriever', age: '3 Months', gender: 'Male', location: 'Austin, TX', fee: 450, verified: true, isPremium: true },
  { name: 'Luna', type: 'Cat', breed: 'Calico', age: '2 Years', gender: 'Female', location: 'Seattle, WA', fee: 100, verified: true, isPremium: true },
  { name: 'Rio', type: 'Bird', breed: 'Macaw', age: '5 Years', gender: 'Male', location: 'Miami, FL', fee: 800, verified: false, isPremium: false },
  { name: 'Milo', type: 'Dog', breed: 'Cocker Spaniel', age: '1 Year', gender: 'Male', location: 'Nashville, TN', fee: 620, verified: true, isPremium: false },
  { name: 'Pearl', type: 'Cat', breed: 'Russian Blue', age: '18 Months', gender: 'Female', location: 'Portland, OR', fee: 945, verified: true, isPremium: true },
  { name: 'Bluebell', type: 'Bird', breed: 'Cockatiel', age: '2 Years', gender: 'Male', location: 'Phoenix, AZ', fee: 320, verified: true, isPremium: false },
  { name: 'Biscuit', type: 'Dog', breed: 'Beagle', age: '9 Months', gender: 'Female', location: 'Dallas, TX', fee: 740, verified: true, isPremium: false },
  { name: 'Sable', type: 'Cat', breed: 'Tuxedo', age: '4 Years', gender: 'Female', location: 'Milwaukee, WI', fee: 280, verified: false, isPremium: false },
  { name: 'Comet', type: 'Rabbit', breed: 'Holland Lop', age: '10 Months', gender: 'Male', location: 'Madison, WI', fee: 215, verified: true, isPremium: false },
  { name: 'Juniper', type: 'Dog', breed: 'Australian Shepherd', age: '14 Months', gender: 'Female', location: 'Boise, ID', fee: 1320, verified: true, isPremium: true },
  { name: 'Taffy', type: 'Cat', breed: 'Maine Coon', age: '7 Months', gender: 'Female', location: 'Charleston, SC', fee: 1485, verified: true, isPremium: true },
  { name: 'Mosaic', type: 'Bird', breed: 'Sun Conure', age: '15 Months', gender: 'Female', location: 'Orlando, FL', fee: 890, verified: false, isPremium: true },
  { name: 'Ember', type: 'Dog', breed: 'Miniature Poodle', age: '2 Years', gender: 'Male', location: 'San Antonio, TX', fee: 1250, verified: true, isPremium: false },
  { name: 'Velvet', type: 'Cat', breed: 'Ragdoll', age: '16 Months', gender: 'Female', location: 'Minneapolis, MN', fee: 975, verified: true, isPremium: false },
  { name: 'Tilly', type: 'Rabbit', breed: 'Mini Rex', age: '1 Year', gender: 'Female', location: 'Reno, NV', fee: 180, verified: false, isPremium: false },
  { name: 'Cedar', type: 'Bird', breed: 'Parakeet Pair', age: '8 Months', gender: 'Pair', location: 'Tampa, FL', fee: 190, verified: true, isPremium: false },
  { name: 'Nectar', type: 'Dog', breed: 'Labrador Retriever', age: '10 Months', gender: 'Female', location: 'Baton Rouge, LA', fee: 1100, verified: true, isPremium: true },
  { name: 'Orbit', type: 'Cat', breed: 'British Shorthair', age: '2 Years', gender: 'Male', location: 'Salt Lake City, UT', fee: 1125, verified: true, isPremium: false },
  { name: 'Poppy', type: 'Rabbit', breed: 'Angora', age: '10 Months', gender: 'Female', location: 'Bozeman, MT', fee: 235, verified: false, isPremium: false },
  { name: 'Sky', type: 'Bird', breed: 'Quaker Pair', age: '2 Years', gender: 'Pair', location: 'Charlotte, NC', fee: 620, verified: true, isPremium: false },
];

const mockPets = mockPetBlueprints.map((pet, index) => {
  const image = makeMockArtwork(pet, index);
  return {
    id: index + 1,
    ...pet,
    category: 'pets',
    image,
    images: [image],
  };
});

const categoryMaps = {
  'pets': ['All Pets', 'Dogs', 'Cats', 'Birds', 'Reptiles', 'Other'],
  'livestock': ['All Livestock', 'Cattle', 'Horses', 'Poultry', 'Sheep', 'Other'],
  'supplies': ['All Supplies', 'Hygiene', 'Grooming', 'Healthcare', 'Feeding', 'Other']
};

const matchesActiveCategory = (item, activeCategory, marketplaceContext) => {
  if (activeCategory.startsWith('All')) return true;

  const type = item.type.toLowerCase();
  switch (marketplaceContext) {
    case 'pets':
      if (activeCategory === 'Dogs') return type === 'dog';
      if (activeCategory === 'Cats') return type === 'cat';
      if (activeCategory === 'Birds') return type === 'bird';
      if (activeCategory === 'Reptiles') return type.includes('reptile');
      if (activeCategory === 'Other') return !['dog', 'cat', 'bird'].includes(type) && !type.includes('reptile');
      return false;
    case 'livestock':
      if (activeCategory === 'Cattle') return type.includes('cattle') || type.includes('cow');
      if (activeCategory === 'Horses') return type.includes('horse');
      if (activeCategory === 'Poultry') return ['poultry', 'chicken', 'duck', 'turkey'].some((value) => type.includes(value));
      if (activeCategory === 'Sheep') return ['sheep', 'goat'].some((value) => type.includes(value));
      if (activeCategory === 'Other') {
        return !['cattle', 'cow', 'horse', 'poultry', 'chicken', 'duck', 'turkey', 'sheep', 'goat'].some((value) => type.includes(value));
      }
      return false;
    case 'supplies':
      if (activeCategory === 'Hygiene') return type.includes('hygiene');
      if (activeCategory === 'Grooming') return type.includes('grooming');
      if (activeCategory === 'Healthcare') return type.includes('healthcare');
      if (activeCategory === 'Feeding') return type.includes('feeding') || type.includes('feed');
      if (activeCategory === 'Other') {
        return !['hygiene', 'grooming', 'healthcare', 'feeding', 'feed'].some((value) => type.includes(value));
      }
      return false;
    default:
      return true;
  }
};

const PetGallery = ({ searchQuery = '', onPostAction, overrideType = '' }) => {
  const location = useLocation();
  const path = location.pathname;
  const urlMarketplace = path === '/livestock' ? 'livestock' : path === '/supplies' ? 'supplies' : 'pets';
  const marketplaceContext = (overrideType || urlMarketplace).toLowerCase();
  const categories = categoryMaps[marketplaceContext] || categoryMaps['pets'];
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setActiveCat(categories[0]);
    setSelectedPet(null);
  }, [categories, marketplaceContext]);

  useEffect(() => {
    let cancelled = false;

    const loadListings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/listings', {
          params: {
            category: marketplaceContext,
            limit: 100,
          },
        });
        if (cancelled) return;
        const liveListings = (res.data.listings || []).map(normalizeListing);
        setListings(liveListings);
        setError(null);
      } catch {
        if (cancelled) return;
        setError('Live listings are temporarily unavailable. Showing curated demo content instead.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [marketplaceContext, reloadToken]);

  const hasMarketplaceListings = listings.some((item) => item.category === marketplaceContext);
  const sourcePets = hasMarketplaceListings ? listings : mockPets;

  const filteredPets = sourcePets.filter(item => {
    // Stage 1: Market Isolation
    if (item.category !== marketplaceContext) return false;

    // Stage 2: Category Filter
    const matchesCat = matchesActiveCategory(item, activeCat, marketplaceContext);
    
    // Stage 3: Search Filter
    const searchLower = (deferredSearchQuery || '').toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(searchLower) ||
      (item.breed && item.breed.toLowerCase().includes(searchLower)) ||
      item.type.toLowerCase().includes(searchLower);
    
    return matchesCat && matchesSearch;
  });

  // Build mixed items: pets + native sponsored cards every 6th position
  const buildFeedItems = () => {
    const items = [];
    let adIndex = 0;
    
    filteredPets.forEach((pet, i) => {
      items.push({ type: 'pet', data: pet });
      
      // Insert a native sponsored card after every 6th pet
      if ((i + 1) % 12 === 0 && deferredSearchQuery === '') {
        items.push({ type: 'sponsored', index: adIndex++ });
      }
    });

    return items;
  };

  const feedItems = buildFeedItems();
  const title = marketplaceContext === 'livestock'
    ? 'Elite Livestock'
    : marketplaceContext === 'supplies'
      ? "Today's Premium Market"
      : 'Pets closest to you';

  if (loading && listings.length === 0) {
    return (
      <section className={`container ${styles.gallerySection}`}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p style={{ marginTop: '8px', color: 'var(--color-text-muted)' }}>Loading the latest listings...</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                minHeight: '320px',
                borderRadius: '24px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(243,244,246,0.95))',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              <div style={{ aspectRatio: '4 / 3', background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ padding: '18px' }}>
                <div style={{ height: '16px', width: '65%', borderRadius: '999px', background: '#e5e7eb', marginBottom: '12px' }} />
                <div style={{ height: '14px', width: '45%', borderRadius: '999px', background: '#e5e7eb', marginBottom: '8px' }} />
                <div style={{ height: '14px', width: '30%', borderRadius: '999px', background: '#e5e7eb' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`container ${styles.gallerySection}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {error && (
            <p style={{ marginTop: '8px', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              {error}{' '}
              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="btn btn-secondary"
                style={{ marginLeft: '8px', padding: '8px 14px' }}
              >
                Retry
              </button>
            </p>
          )}
        </div>
        <div className={styles.categoryFilters}>
          {categories.map((cat) => (
            <button 
              key={cat}
              className={`${styles.filterBtn} ${activeCat === cat ? styles.activeFilter : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {feedItems.map((item) => {
          if (item.type === 'sponsored') {
            return <AdSenseUnit key={`ad-${item.index}`} slot="pet-gallery-native" />;
          }
          return (
            <PetCard key={item.data.id} pet={item.data} onClick={setSelectedPet} />
          );
        })}
      </div>
      
      {filteredPets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }}>No matches found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Try adjusting your filters or search query.</p>
        </div>
      )}
      {!loading && filteredPets.length > 0 && (
        <div className={styles.loadMore}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Showing {filteredPets.length} listing{filteredPets.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      <PetDetailModal 
        pet={selectedPet} 
        onClose={() => setSelectedPet(null)}
        onPostAction={onPostAction}
      />
    </section>
  );
};

export default PetGallery;
