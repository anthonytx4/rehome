import React, { useState } from 'react';
import PetCard from './PetCard';
import PetDetailModal from './PetDetailModal';
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

const PetGallery = ({ searchQuery }) => {
  const [activeCat, setActiveCat] = useState('All Pets');
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
        {/* Render actual pets */}
        {filteredPets.map(pet => (
          <PetCard key={pet.id} pet={pet} onClick={setSelectedPet} />
        ))}
        
        {/* Render a native ad only if no active search or if it's 'All Pets' */}
        {(searchQuery === '' && activeCat === 'All Pets') && <PetCard isAd={true} />}
      </div>
      
      <div className={styles.loadMore}>
        <button className="btn btn-secondary">Load More Pets</button>
      </div>

      <PetDetailModal pet={selectedPet} onClose={() => setSelectedPet(null)} />
    </section>
  );
};

export default PetGallery;
