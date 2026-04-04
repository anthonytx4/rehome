import React, { useDeferredValue, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PetCard from './PetCard';
import PetDetailModal from './PetDetailModal';
import NativeSponsoredCard from './ads/NativeSponsoredCard';
import styles from './PetGallery.module.css';
import { normalizeListing } from '../utils/listings';

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const categoryMaps = {
  pets: ['All Pets', 'Dogs', 'Cats', 'Birds', 'Reptiles', 'Other'],
  livestock: ['All Lots', 'Cattle', 'Sheep & Goats', 'Equine', 'Swine', 'Poultry', 'Specialty'],
  supplies: ['All Supplies', 'Hygiene', 'Grooming', 'Healthcare', 'Feeding', 'Other'],
};

const livestockCategoryAliases = {
  'Cattle': ['cattle', 'beef', 'dairy', 'cow', 'bull', 'heifer', 'steer', 'calf'],
  'Sheep & Goats': ['goat', 'sheep', 'ram', 'ewe', 'lamb', 'doe', 'buck', 'kid', 'wether'],
  'Equine': ['equine', 'horse', 'mare', 'stallion', 'gelding', 'pony', 'donkey', 'mule'],
  'Swine': ['swine', 'pig', 'hog', 'boar', 'sow', 'piglet'],
  'Poultry': ['poultry', 'chicken', 'hen', 'rooster', 'duck', 'goose', 'turkey', 'broiler', 'layer'],
  'Specialty': ['alpaca', 'llama', 'bison', 'yak', 'emu', 'ostrich', 'rabbit', 'hare', 'fiber', 'specialty'],
};

const filterOptions = {
  pets: {
    gender: ['Any Gender', 'Male', 'Female'],
    age: ['Any Age', 'Baby', 'Young', 'Adult', 'Senior'],
    sort: ['Newest', 'Price: Low to High', 'Price: High to Low'],
  },
  livestock: {
    gender: ['Any Lot Makeup', 'Female', 'Male', 'Pair', 'Mixed Lot', 'Breeding Group'],
    listingType: ['Any Sale Format', 'Timed Auction', 'Fixed Price'],
    sort: ['Closing Soon', 'Newest Lots', 'Highest Bid', 'Starting Bid: Low to High', 'Largest Lots'],
  },
  supplies: {
    sort: ['Newest', 'Price: Low to High', 'Price: High to Low'],
  },
};

const searchPlaceholders = {
  pets: 'Search pets by name, breed...',
  livestock: 'Search lots by tag, breed, or livestock class...',
  supplies: 'Search supplies by name, type...',
};

const getDefaultFilters = (marketplaceContext) => (
  marketplaceContext === 'livestock'
    ? { gender: 'Any Lot Makeup', age: '', sort: 'Closing Soon', listingType: 'Any Sale Format' }
    : { gender: '', age: '', sort: '', listingType: '' }
);

const getAuctionCloseTimestamp = (item) => {
  const timestamp = item?.auctionEndsAt ? new Date(item.auctionEndsAt).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};

const getCreatedTimestamp = (item) => {
  const timestamp = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getLivestockHaystack = (item) => (
  `${safeText(item.type)} ${safeText(item.species)} ${safeText(item.breed)} ${safeText(item.name)}`
).toLowerCase();

const matchesActiveCategory = (item, activeCategory, marketplaceContext) => {
  if (activeCategory.startsWith('All')) return true;

  const type = safeText(item.type).toLowerCase();
  switch (marketplaceContext) {
    case 'pets':
      if (activeCategory === 'Dogs') return type === 'dog';
      if (activeCategory === 'Cats') return type === 'cat';
      if (activeCategory === 'Birds') return type === 'bird';
      if (activeCategory === 'Reptiles') return type.includes('reptile');
      if (activeCategory === 'Other') return !['dog', 'cat', 'bird'].includes(type) && !type.includes('reptile');
      return false;
    case 'livestock':
      return (livestockCategoryAliases[activeCategory] || []).some((value) => getLivestockHaystack(item).includes(value));
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

const PetGallery = ({ searchQuery: externalSearchQuery = '', onPostAction, overrideType = '' }) => {
  const { user } = useAuth();
  const isAdFree = Boolean(user?.membershipTier && user.membershipTier !== 'free');
  const location = useLocation();
  const path = location.pathname;
  const urlMarketplace = path === '/livestock' ? 'livestock' : path === '/supplies' ? 'supplies' : 'pets';
  const marketplaceContext = (overrideType || urlMarketplace).toLowerCase();
  const categories = categoryMaps[marketplaceContext] || categoryMaps.pets;

  const [activeCat, setActiveCat] = useState(categories[0]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [localSearch, setLocalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => getDefaultFilters(marketplaceContext));
  const combinedSearch = localSearch || externalSearchQuery;
  const deferredSearchQuery = useDeferredValue(combinedSearch);
  const defaultFilters = getDefaultFilters(marketplaceContext);
  const hasCustomFilters = filters.gender !== defaultFilters.gender
    || filters.age !== defaultFilters.age
    || filters.sort !== defaultFilters.sort
    || filters.listingType !== defaultFilters.listingType;

  useEffect(() => {
    setActiveCat(categories[0]);
    setSelectedPet(null);
    setLocalSearch('');
    setFilters(getDefaultFilters(marketplaceContext));
    setShowFilters(false);
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
        const liveListings = (res.data.listings || []).map(normalizeListing).filter(Boolean);
        setListings(liveListings);
        setError(null);
      } catch {
        if (cancelled) return;
        setError('Live listings are temporarily unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [marketplaceContext, reloadToken]);

  const filteredPets = listings
    .filter((item) => item && item.category === marketplaceContext)
    .filter((item) => matchesActiveCategory(item, activeCat, marketplaceContext))
    .filter((item) => {
      const searchLower = (deferredSearchQuery || '').toLowerCase();
      const itemName = safeText(item.name).toLowerCase();
      const itemBreed = safeText(item.breed).toLowerCase();
      const itemType = safeText(item.type).toLowerCase();
      const itemTitle = safeText(item.title).toLowerCase();
      const itemDescription = safeText(item.description).toLowerCase();
      const itemLocation = safeText(item.location).toLowerCase();
      const itemSeller = safeText(item.sellerName).toLowerCase();
      return (
        itemName.includes(searchLower) ||
        itemBreed.includes(searchLower) ||
        itemType.includes(searchLower) ||
        itemTitle.includes(searchLower) ||
        itemDescription.includes(searchLower) ||
        itemLocation.includes(searchLower) ||
        itemSeller.includes(searchLower)
      );
    })
    .filter((item) => {
      const gender = filters.gender
        && filters.gender !== 'Any Gender'
        && filters.gender !== 'Any Lot Makeup';
      const age = filters.age && filters.age !== 'Any Age';
      const listingType = filters.listingType && filters.listingType !== 'Any Sale Format';
      const matchesGender = !gender || safeText(item.gender).toLowerCase() === filters.gender.toLowerCase();
      const matchesAge = !age || safeText(item.age).toLowerCase().includes(filters.age.toLowerCase());
      const matchesListingType = !listingType
        || (filters.listingType === 'Timed Auction' ? item.listingType === 'auction' : item.listingType !== 'auction');
      return matchesGender && matchesAge && matchesListingType;
    })
    .sort((a, b) => {
      if (marketplaceContext === 'livestock') {
        const effectiveSort = filters.sort || 'Closing Soon';
        if (effectiveSort === 'Closing Soon') {
          const auctionOrder = getAuctionCloseTimestamp(a) - getAuctionCloseTimestamp(b);
          if (auctionOrder !== 0) return auctionOrder;
          return (b.currentBid || b.fee || 0) - (a.currentBid || a.fee || 0);
        }
        if (effectiveSort === 'Newest Lots') {
          return getCreatedTimestamp(b) - getCreatedTimestamp(a);
        }
        if (effectiveSort === 'Highest Bid') return (b.currentBid || b.fee || 0) - (a.currentBid || a.fee || 0);
        if (effectiveSort === 'Starting Bid: Low to High') return (a.fee || 0) - (b.fee || 0);
        if (effectiveSort === 'Largest Lots') return (b.lotSize || 0) - (a.lotSize || 0);
      }
      if (filters.sort === 'Price: Low to High') return (a.fee || 0) - (b.fee || 0);
      if (filters.sort === 'Price: High to Low') return (b.fee || 0) - (a.fee || 0);
      return 0;
    });

  const feedItems = [];
  let adIndex = 0;
  filteredPets.forEach((pet, index) => {
    feedItems.push({ type: 'pet', data: pet });
    if ((index + 1) % 8 === 0 && deferredSearchQuery === '' && !isAdFree) {
      feedItems.push({ type: 'sponsored', index: adIndex += 1 });
    }
  });

  const title = marketplaceContext === 'livestock'
    ? 'Livestock Lots & Auctions'
    : marketplaceContext === 'supplies'
      ? 'Supply listings'
      : 'Available pets';

  const subtitle = marketplaceContext === 'livestock'
    ? 'Browse cattle, sheep, goats, equine, swine, poultry, and specialty stock by sale format, lot makeup, and closing time.'
    : '';

  const hasSearch = Boolean((deferredSearchQuery || '').trim());

  const emptyCopy = error
    ? 'We could not load fresh inventory. Try again in a moment.'
    : marketplaceContext === 'livestock' && (hasCustomFilters || hasSearch)
      ? 'No livestock lots matched these filters. Try another stock category, sale format, or search term.'
    : marketplaceContext === 'pets'
      ? 'There are no live pet listings in this category yet. Check back soon or switch categories.'
      : marketplaceContext === 'livestock'
        ? 'There are no live livestock lots in this segment right now. Try another stock category or check back for the next closing group.'
        : `There are no live ${marketplaceContext} listings yet. Check back soon or switch categories.`;

  return (
    <section className={`container ${styles.gallerySection}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && (
            <p style={{ marginTop: '10px', color: 'var(--color-text-muted)', maxWidth: '620px', lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
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
              type="button"
              key={cat}
              className={`${styles.filterBtn} ${activeCat === cat ? styles.activeFilter : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchInputWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholders[marketplaceContext] || 'Search listings...'}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button type="button" className={styles.searchClear} onClick={() => setLocalSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterRow}>
          {filterOptions[marketplaceContext]?.gender && (
            <select
              className={styles.filterSelect}
              value={filters.gender}
              onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
            >
              {filterOptions[marketplaceContext].gender.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {filterOptions[marketplaceContext]?.listingType && (
            <select
              className={styles.filterSelect}
              value={filters.listingType}
              onChange={(e) => setFilters((f) => ({ ...f, listingType: e.target.value }))}
            >
              {filterOptions[marketplaceContext].listingType.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {filterOptions[marketplaceContext]?.age && (
            <select
              className={styles.filterSelect}
              value={filters.age}
              onChange={(e) => setFilters((f) => ({ ...f, age: e.target.value }))}
            >
              {filterOptions[marketplaceContext].age.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {filterOptions[marketplaceContext]?.sort && (
            <select
              className={styles.filterSelect}
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              {filterOptions[marketplaceContext].sort.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {hasCustomFilters && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={() => setFilters(getDefaultFilters(marketplaceContext))}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {loading && listings.length === 0 ? (
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
      ) : (
        <div className={styles.grid}>
          {feedItems.map((item) => {
            if (item.type === 'sponsored') {
              return <NativeSponsoredCard key={`ad-${item.index}`} index={item.index} />;
            }
            return <PetCard key={item.data.id} pet={item.data} onClick={setSelectedPet} />;
          })}
        </div>
      )}

      {!loading && filteredPets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)', marginTop: '28px' }}>
          <h3 style={{ color: 'var(--color-secondary)', marginBottom: '8px' }}>
            {error ? 'Browse paused' : 'No live listings right now'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            {emptyCopy}
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => setReloadToken((value) => value + 1)}>
            Refresh
          </button>
          {hasCustomFilters && !error && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: '12px' }}
              onClick={() => setFilters(getDefaultFilters(marketplaceContext))}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && filteredPets.length > 0 && (
        <div className={styles.loadMore}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Showing {filteredPets.length} {marketplaceContext === 'livestock' ? `lot${filteredPets.length === 1 ? '' : 's'}` : `listing${filteredPets.length === 1 ? '' : 's'}`}
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
