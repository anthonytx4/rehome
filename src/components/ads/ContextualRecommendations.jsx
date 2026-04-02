import React, { useRef, useEffect } from 'react';
import { ExternalLink, ShieldCheck, Truck, Heart, Star } from 'lucide-react';
import analytics from '../../hooks/useAnalytics';
import styles from './ContextualRecommendations.module.css';

const PRODUCT_DATA = {
  Dog: [
    { id: 'dog-crate', name: 'Premium Dog Crate', brand: 'Chewy', price: '$89', emoji: '🏠', url: '#', tag: 'Essential' },
    { id: 'dog-food', name: 'Organic Dry Food', brand: 'Chewy', price: '$54', emoji: '🍖', url: '#', tag: 'Top Rated' },
    { id: 'dog-leash', name: 'No-Pull Harness', brand: 'Amazon', price: '$28', emoji: '🦮', url: '#', tag: 'Best Seller' },
    { id: 'dog-bed', name: 'Orthopedic Dog Bed', brand: 'Chewy', price: '$65', emoji: '🛏️', url: '#', tag: 'Comfort' },
  ],
  Cat: [
    { id: 'cat-tree', name: 'Cat Tower & Scratcher', brand: 'Chewy', price: '$120', emoji: '🌳', url: '#', tag: 'Essential' },
    { id: 'cat-litter', name: 'Self-Cleaning Litter Box', brand: 'Petco', price: '$350', emoji: '✨', url: '#', tag: 'Premium' },
    { id: 'cat-food', name: 'Grain-Free Wet Food', brand: 'Chewy', price: '$36', emoji: '🐟', url: '#', tag: 'Top Rated' },
    { id: 'cat-toy', name: 'Interactive Laser Toy', brand: 'Amazon', price: '$18', emoji: '🔴', url: '#', tag: 'Fun' },
  ],
  Bird: [
    { id: 'bird-cage', name: 'Flight Cage XL', brand: 'Petco', price: '$199', emoji: '🏠', url: '#', tag: 'Essential' },
    { id: 'bird-food', name: 'Seed & Pellet Mix', brand: 'Chewy', price: '$24', emoji: '🌾', url: '#', tag: 'Nutrition' },
    { id: 'bird-perch', name: 'Natural Wood Perch Set', brand: 'Amazon', price: '$15', emoji: '🌿', url: '#', tag: 'Comfort' },
    { id: 'bird-toy', name: 'Foraging Toy Bundle', brand: 'Chewy', price: '$22', emoji: '🧩', url: '#', tag: 'Enrichment' },
  ],
  default: [
    { id: 'gen-carrier', name: 'Travel Carrier', brand: 'Chewy', price: '$45', emoji: '🧳', url: '#', tag: 'Essential' },
    { id: 'gen-insurance', name: 'Pet Insurance Plan', brand: 'Lemonade', price: '$12/mo', emoji: '🛡️', url: '#', tag: 'Protection' },
    { id: 'gen-treats', name: 'Training Treats Variety', brand: 'Amazon', price: '$16', emoji: '🦴', url: '#', tag: 'Training' },
    { id: 'gen-grooming', name: 'Grooming Kit', brand: 'Petco', price: '$32', emoji: '✂️', url: '#', tag: 'Care' },
  ],
};

const ContextualRecommendations = ({ petType = 'Dog', petName = 'your pet' }) => {
  const products = PRODUCT_DATA[petType] || PRODUCT_DATA.default;
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          analytics.adImpression('contextual_recs', 'listing_detail', `recs_${petType}`);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [petType]);

  const handleProductClick = (product) => {
    analytics.adClick('contextual_recs', 'listing_detail', product.id, product.url);
  };

  return (
    <div ref={sectionRef} className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Heart size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>Prepare for {petName}</h3>
        </div>
        <span className={styles.partnerLabel}>
          <ShieldCheck size={12} />
          Partner Products
        </span>
      </div>

      <div className={styles.grid}>
        {products.map((product) => (
          <a
            key={product.id}
            href={product.url}
            className={styles.productCard}
            onClick={() => handleProductClick(product)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.productTag}>{product.tag}</div>
            <div className={styles.productEmoji}>{product.emoji}</div>
            <div className={styles.productInfo}>
              <h4 className={styles.productName}>{product.name}</h4>
              <div className={styles.productMeta}>
                <span className={styles.productBrand}>
                  <Truck size={11} />
                  {product.brand}
                </span>
                <span className={styles.productPrice}>{product.price}</span>
              </div>
            </div>
            <ExternalLink size={14} className={styles.productArrow} />
          </a>
        ))}
      </div>
    </div>
  );
};

export default ContextualRecommendations;
