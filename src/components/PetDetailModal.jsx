import React, { useState, useEffect } from 'react';
import { X, Clock, ShieldAlert, CreditCard, ChevronRight, Heart } from 'lucide-react';
import ContextualRecommendations from './ads/ContextualRecommendations';
import analytics from '../hooks/useAnalytics';
import styles from './PetDetailModal.module.css';

const PetDetailModal = ({ pet, onClose, onPostAction }) => {
  const [hasSkippedQueue, setHasSkippedQueue] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (pet) {
      analytics.viewListing(pet.id, pet.type, pet.breed);
    }
  }, [pet]);

  if (!pet) return null;

  // Calculate fees
  const baseFee = pet.fee || 0;
  const escrowFee = baseFee > 0 ? (baseFee * 0.05).toFixed(2) : '2.00';
  const total = (parseFloat(baseFee) + parseFloat(escrowFee)).toFixed(2);

  const handleSkipQueue = () => {
    setHasSkippedQueue(true);
    analytics.skipQueue(pet.id, 9);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (!isFavorited) {
      analytics.addToFavorites(pet.id, pet.type);
      onPostAction?.('favorite');
    } else {
      analytics.removeFromFavorites(pet.id);
    }
  };

  const handleCheckout = () => {
    analytics.beginCheckout(parseFloat(total));
    analytics.escrowPayment(pet.id, baseFee, parseFloat(escrowFee));
  };

  const handlePriorityApp = () => {
    analytics.priorityApplication(pet.id);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalBg} onClick={onClose} />
      <div className={styles.modalContent}>
        
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.contentGrid}>
          {/* Left Column: Pet Media & Info */}
          <div className={styles.leftCol}>
            <div className={styles.imageGallery}>
              <img src={pet.image} alt={pet.name} className={styles.mainImage} />
              <button 
                className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteBtnActive : ''}`}
                onClick={handleFavorite}
              >
                <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            </div>
            
            <div className={styles.petInfo}>
              <div className={styles.header}>
                <h2 className={styles.name}>{pet.name}</h2>
                <span className={styles.typeBadge}>{pet.breed}</span>
              </div>
              <p className={styles.location}>{pet.location} • {pet.age} • {pet.gender}</p>
              
              {!pet.verified && (
                <div className={styles.warningBox}>
                  <ShieldAlert size={20} className={styles.warningIcon} />
                  <div>
                    <strong>Unverified Seller</strong>
                    <p>This seller has not paid for an Ethical Breeder Check. Proceed with extreme caution.</p>
                  </div>
                </div>
              )}

              <div className={styles.description}>
                <h3>About {pet.name}</h3>
                <p>This is a healthy, active {pet.type.toLowerCase()} looking for a forever home. Highly sociable and up to date on shots.</p>
              </div>

              {/* Contextual Product Recommendations */}
              <ContextualRecommendations petType={pet.type} petName={pet.name} />
            </div>
          </div>

          {/* Right Column: Monetization Actions */}
          <div className={styles.rightCol}>
            
            {/* Queue Jump */}
            {!hasSkippedQueue ? (
              <div className={styles.actionCard}>
                <div className={styles.queueHeader}>
                  <Clock size={20} className={styles.queueIcon} />
                  <h3>Review Queue Active</h3>
                </div>
                <p className={styles.queueText}>
                  This is a high-demand listing. New listings are locked in a 24-hour review queue before you can submit an application to the seller.
                </p>
                <div className={styles.queueTimer}>Time remaining: <strong>23h 45m 12s</strong></div>
                <button 
                  className={`btn btn-premium ${styles.fullWidthBtn}`}
                  onClick={handleSkipQueue}
                >
                  Pay $9.00 to Skip Queue
                </button>
              </div>
            ) : (
              <div className={`${styles.actionCard} ${styles.actionCardSuccess}`}>
                <h3>Queue Skipped!</h3>
                <p>You now have priority access to contact this seller.</p>
              </div>
            )}

            {/* Escrow Checkout */}
            <div className={styles.actionCard}>
              <h3>Secure Escrow Payment</h3>
              <p className={styles.escrowText}>
                We guarantee your payment until you physically pick up {pet.name}. A mandatory 5% safety fee applies.
              </p>
              
              <div className={styles.receipt}>
                <div className={styles.receiptLine}>
                  <span>Rehoming Fee</span>
                  <span>${baseFee.toFixed(2)}</span>
                </div>
                <div className={styles.receiptLine}>
                  <span>Rehome Safety Fee (5%) <ShieldAlert size={12} className={styles.infoIcon} /></span>
                  <span>${escrowFee}</span>
                </div>
                <div className={styles.receiptTotal}>
                  <span>Total Due Today</span>
                  <span>${total}</span>
                </div>
              </div>

              <button 
                className={`btn btn-primary ${styles.fullWidthBtn}`}
                disabled={!hasSkippedQueue}
                onClick={handleCheckout}
              >
                <CreditCard size={18} />
                Pay ${total} via Escrow
              </button>
              
              {!hasSkippedQueue && (
                <p className={styles.disabledNote}>You must wait out the Review Queue or Skip the Queue to proceed.</p>
              )}
            </div>

            {/* Priority Application */}
            <div className={styles.secondaryActionCard} onClick={handlePriorityApp}>
              <div className={styles.appRow}>
                <div>
                  <strong>Priority Application ($5)</strong>
                  <p>Pin your profile to the top of the seller's inbox.</p>
                </div>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PetDetailModal;
