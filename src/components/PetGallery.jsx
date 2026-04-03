import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PetCard from './PetCard';
import PetDetailModal from './PetDetailModal';
import AdSenseUnit from './ads/AdSenseUnit';
import styles from './PetGallery.module.css';

const mockPets = [
  {
    id: 1,
    name: 'Cooper',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: '3 Months',
    gender: 'Male',
    location: 'Austin, TX',
    fee: 450,
    verified: true,
    isPremium: true,
    image: '/images/mock_dog_1775037305181.png'
  },
  {
    id: 2,
    name: 'Luna',
    type: 'Cat',
    breed: 'Calico',
    age: '2 Years',
    gender: 'Female',
    location: 'Seattle, WA',
    fee: 100,
    verified: true,
    isPremium: true,
    image: '/images/mock_cat_1775037291038.png'
  },
  {
    id: 3,
    name: 'Rio',
    type: 'Bird',
    breed: 'Macaw',
    age: '5 Years',
    gender: 'Male',
    location: 'Miami, FL',
    fee: 800,
    verified: false,
    isPremium: false,
    image: '/images/mock_bird_1775037276059.png'
  }
];

const categories = ['All Pets', 'Dogs', 'Cats', 'Birds', 'Reptiles', 'Other'];

const PetGallery = ({ searchQuery, onPostAction, overrideType }) => {
  const [activeCat, setActiveCat] = useState(overrideType || 'All Pets');
  const [selectedPet, setSelectedPet] = useState(null);

  const filteredPets = mockPets.filter(pet => {
    const matchesCat = activeCat === 'All Pets' || pet.type === activeCat || (activeCat === 'Dogs' && pet.type === 'Dog') || (activeCat === 'Cats' && pet.type === 'Cat') || (activeCat === 'Birds' && pet.type === 'Bird');
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchLower) ||
      pet.breed.toLowerCase().includes(searchLower) ||
      pet.type.toLowerCase().includes(searchLower);
    
    return matchesCat && matchesSearch;
  });

  // Build mixed items: pets + native sponsored cards every 6th position
  const buildFeedItems = () => {
    const items = [];
    let adIndex = 0;
    
    filteredPets.forEach((pet, i) => {
      items.push({ type: 'pet', data: pet });
      
      // Insert a native sponsored card after every 6th pet
      if ((i + 1) % 6 === 0 && searchQuery === '') {
        items.push({ type: 'sponsored', index: adIndex++ });
      }
    });

    // If there are few pets and no search, still show at least one ad
    if (filteredPets.length > 0 && filteredPets.length < 3 && searchQuery === '' && activeCat === 'All Pets') {
      items.push({ type: 'sponsored', index: 0 });
    }

    return items;
  };

  const feedItems = buildFeedItems();

  return (
    <section className={`container ${styles.gallerySection}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Pets closest to you</h2>
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
      
      <div className={styles.loadMore}>
        <button className="btn btn-secondary">Load More Pets</button>
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
