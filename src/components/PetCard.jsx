import { Link, useLocation } from 'react-router-dom';
import { MapPin, ShieldCheck, Star, AlertTriangle, Gavel, Users, Boxes, TrendingUp } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';
import styles from './PetCard.module.css';

const formatAuctionEnd = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const PetCard = ({ pet, isAd, onClick }) => {
  const location = useLocation();

  if (isAd) {
    return (
      <div className={`${styles.card} ${styles.adCard}`}>
        <div className={styles.adBadge}>Sponsored</div>
        <div className={styles.adContent}>
          <h3 className={styles.adTitle}>Premium Pet Insurance</h3>
          <p className={styles.adDesc}>Get your furry friend covered starting at $15/month.</p>
          <button className={`btn btn-primary ${styles.adBtn}`}>Get Quote</button>
        </div>
      </div>
    );
  }

  const isAuction = pet.listingType === 'auction';
  const isHot = pet.bidCount > 10;
  const lotLabel = pet.lotLabel || null;
  const auctionEndsAt = formatAuctionEnd(pet.auctionEndsAt || pet.raw?.auctionEndsAt);
  const imageSource = resolveMediaUrl(pet.image || pet.images?.[0] || '/images/mock_dog_1775037305181.png');
  const listingPath = `/listing/${pet.id}`;

  return (
    <div
      className={`${styles.card} ${pet.isPremium ? styles.premiumCard : ''}`}
      onClick={() => onClick(pet)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(pet);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open quick details for ${pet.name}`}
    >
      {pet.isPremium && (
        <div className={styles.premiumBadge}>
          <Star size={12} fill="currentColor" /> Promoted
        </div>
      )}

      {isHot && (
        <div className={styles.hotBadge}>
          <TrendingUp size={12} /> Hot Auction
        </div>
      )}
      
      {!pet.verified && (
        <div className={styles.unverifiedBanner}>
          <AlertTriangle size={12} /> Unverified
        </div>
      )}
      
      <div className={styles.imageContainer}>
        <Link
          to={listingPath}
          state={{ from: location.pathname }}
          className={styles.imageLink}
          aria-label={`Open full listing for ${pet.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <img src={imageSource} alt={pet.name} className={styles.image} loading="lazy" decoding="async" />
        </Link>
        {pet.verified && (
          <div className={styles.verifiedBadge}>
            <ShieldCheck size={14} className={styles.verifiedIcon} />
            Verified
          </div>
        )}
        
        {pet.lotSize && (
          <div className={styles.lotBadge}>
            <Boxes size={12} /> Lot of {pet.lotSize}
          </div>
        )}
      </div>
      
      <div className={styles.details}>
        <div className={styles.header}>
          <Link
            to={listingPath}
            state={{ from: location.pathname }}
            className={styles.nameLink}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Open full listing for ${pet.name}`}
          >
            <h3 className={styles.name}>{pet.name}</h3>
          </Link>
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>{isAuction ? 'Current Bid' : 'Price'}</span>
            <span className={styles.price}>${(pet.currentBid || pet.fee || 0).toLocaleString()}</span>
          </div>
        </div>
        
        <p className={styles.breed}>{pet.breed} • {pet.age}</p>

        {(lotLabel || auctionEndsAt) && (
          <div className={styles.metaRow}>
            {lotLabel && <span className={styles.metaTag}>{lotLabel}</span>}
            {auctionEndsAt && <span className={styles.metaTagSecondary}>Closes {auctionEndsAt}</span>}
          </div>
        )}
        
        {isAuction && (
          <div className={styles.auctionStats}>
            <span className={styles.bidCount}>
              <Users size={14} /> {pet.bidCount || 0} Bidders
            </span>
            <span className={styles.gavel}>
              <Gavel size={14} /> Active
            </span>
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.location}>
            <MapPin size={14} />
            {pet.location}
          </span>
          <span className={styles.typeBadge}>{pet.type}</span>
        </div>
      </div>
    </div>
  );
};

export default PetCard;
