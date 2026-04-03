import { MapPin, ShieldCheck, Star, AlertTriangle, Gavel, Users, Boxes, TrendingUp } from 'lucide-react';
import styles from './PetCard.module.css';

const PetCard = ({ pet, isAd, onClick }) => {
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

  return (
    <div 
      className={`${styles.card} ${pet.isPremium ? styles.premiumCard : ''}`}
      onClick={() => onClick(pet)}
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
        <img src={pet.image} alt={pet.name} className={styles.image} />
        {pet.verified && (
          <div className={styles.verifiedBadge}>
            <ShieldCheck size={14} className={styles.verifiedIcon} />
            Verified
          </div>
        )}
        
        {pet.lotSize && (
          <div className={styles.lotBadge}>
            <Boxes size={12} /> {pet.lotSize}
          </div>
        )}
      </div>
      
      <div className={styles.details}>
        <div className={styles.header}>
          <h3 className={styles.name}>{pet.name}</h3>
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>{isAuction ? 'Current Bid' : 'Price'}</span>
            <span className={styles.price}>${(pet.currentBid || pet.fee || 0).toLocaleString()}</span>
          </div>
        </div>
        
        <p className={styles.breed}>{pet.breed} • {pet.age}</p>
        
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
