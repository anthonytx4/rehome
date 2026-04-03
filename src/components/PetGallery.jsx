import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PetCard from './PetCard';
import PetDetailModal from './PetDetailModal';
import AdSenseUnit from './ads/AdSenseUnit';
import styles from './PetGallery.module.css';

const mockPets = [
  { id: 1, name: 'Cooper', type: 'Dog', breed: 'Golden Retriever', age: '3 Months', gender: 'Male', location: 'Austin, TX', fee: 450, verified: true, isPremium: true, image: '/images/mock_dog_1775037305181.png', category: 'pets' },
  { id: 2, name: 'Luna', type: 'Cat', breed: 'Calico', age: '2 Years', gender: 'Female', location: 'Seattle, WA', fee: 100, verified: true, isPremium: true, image: '/images/mock_cat_1775037291038.png', category: 'pets' },
  { id: 3, name: 'Rio', type: 'Bird', breed: 'Macaw', age: '5 Years', gender: 'Male', location: 'Miami, FL', fee: 800, verified: false, isPremium: false, image: '/images/mock_bird_1775037276059.png', category: 'pets' },
  
  // Livestock Mock Data
  { id: 101, name: 'Angus Lot #42', type: 'Cattle', breed: 'Black Angus', age: '1 Year', gender: 'Mixed Lot', location: 'Omaha, NE', fee: 18500, verified: true, isPremium: true, image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=800', category: 'livestock', lotSize: 'Complete Lot (10)', listingType: 'auction', currentBid: 19200, bidCount: 14 },
  { id: 102, name: 'Stallion "Spirit"', type: 'Horse', breed: 'Arabian', age: '4 Years', gender: 'Male', location: 'Lexington, KY', fee: 25000, verified: true, isPremium: true, image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=800', category: 'livestock', listingType: 'auction', currentBid: 26500, bidCount: 8 },
  { id: 103, name: 'Layer Hen Lot', type: 'Poultry', breed: 'Rhode Island Red', age: '6 Months', gender: 'Female', location: 'Des Moines, IA', fee: 450, verified: false, isPremium: false, image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800', category: 'livestock', lotSize: 'Half Lot (25)', listingType: 'fixed' },

  // Supplies Mock Data
  { id: 201, name: 'Industrial Grooming Kit', type: 'Grooming', breed: 'Professional Grade', age: 'New', gender: 'Bulk', location: 'Phoenix, AZ', fee: 899, verified: true, isPremium: true, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800', category: 'supplies', lotSize: 'Bulk Pack (5)' },
  { id: 202, name: 'Antibacterial Livestock Soap', type: 'Hygiene', breed: 'Large Animal', age: 'New', gender: 'Case', location: 'Dallas, TX', fee: 120, verified: true, isPremium: false, image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&q=80&w=800', category: 'supplies', lotSize: 'Case of 12' },
  { id: 203, name: 'Electric Fence Energizer', type: 'Healthcare', breed: '20-Mile Range', age: 'New', gender: 'Unit', location: 'Denver, CO', fee: 350, verified: false, isPremium: true, image: 'https://images.unsplash.com/photo-1590684153482-d3302273aa4a?auto=format&fit=crop&q=80&w=800', category: 'supplies' }
];

const categoryMaps = {
  'pets': ['All Pets', 'Dogs', 'Cats', 'Birds', 'Reptiles', 'Other'],
  'livestock': ['All Livestock', 'Cattle', 'Horses', 'Poultry', 'Sheep', 'Other'],
  'supplies': ['All Supplies', 'Hygiene', 'Grooming', 'Healthcare', 'Feeding', 'Other']
};

const PetGallery = ({ searchQuery, onPostAction, overrideType }) => {
  const location = useLocation();
  const path = location.pathname;
  const urlMarketplace = path === '/livestock' ? 'livestock' : path === '/supplies' ? 'supplies' : 'pets';
  
  const marketplaceContext = (overrideType || urlMarketplace).toLowerCase();
  const categories = categoryMaps[marketplaceContext] || categoryMaps['pets'];
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [selectedPet, setSelectedPet] = useState(null);

  const filteredPets = mockPets.filter(item => {
    // Stage 1: Market Isolation
    if (item.category !== marketplaceContext) return false;

    // Stage 2: Category Filter
    const isAll = activeCat.startsWith('All');
    const matchesCat = isAll || item.type === activeCat;
    
    // Stage 3: Search Filter
    const searchLower = searchQuery.toLowerCase();
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
      if ((i + 1) % 12 === 0 && searchQuery === '') {
        items.push({ type: 'sponsored', index: adIndex++ });
      }
    });

    return items;
  };

  const feedItems = buildFeedItems();

  return (
    <section className={`container ${styles.gallerySection}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {marketplaceContext === 'Livestock' ? 'Elite Auctions' : 
           marketplaceContext === 'Supplies' ? 'Today\'s Premium Market' : 
           'Pets closest to you'}
        </h2>
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
        {feedItems.map((item, i) => {
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

      <div className={styles.loadMore}>
        <button className="btn btn-secondary">Load More</button>
      </div>

      <PetDetailModal 
        pet={selectedPet} 
        onClose={() => setSelectedPet(null)}
        onPostAction={onPostAction}
      />
    </section>
  );
};

export default PetGallery;
