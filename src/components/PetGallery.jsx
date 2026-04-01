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

const PetGallery = () => {
  const [activeCat, setActiveCat] = useState('All Pets');
  const [selectedPet, setSelectedPet] = useState(null);

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
        {mockPets.map(pet => (
          <PetCard key={pet.id} pet={pet} onClick={setSelectedPet} />
        ))}
        
        {/* Render a native ad */}
        <PetCard isAd={true} />
        
        {/* More dummy cards could go here to show volume */}
      </div>
      
      <div className={styles.loadMore}>
        <button className="btn btn-secondary">Load More Pets</button>
      </div>

      <PetDetailModal pet={selectedPet} onClose={() => setSelectedPet(null)} />
    </section>
  );
};

export default PetGallery;
