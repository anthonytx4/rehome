import React, { useState } from 'react';
import { X, Clock, ShieldAlert, CreditCard, ChevronRight } from 'lucide-react';
import styles from './PetDetailModal.module.css';

const PetDetailModal = ({ pet, onClose }) => {
  const [hasSkippedQueue, setHasSkippedQueue] = useState(false);

  if (!pet) return null;

  // Calculate fees
  const baseFee = pet.fee || 0;
  const escrowFee = baseFee > 0 ? (baseFee * 0.05).toFixed(2) : '2.00'; // $2 minimum or 5%
  const total = (parseFloat(baseFee) + parseFloat(escrowFee)).toFixed(2);

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
            </div>
          </div>

          {/* Right Column: Aggressive Monetization Actions */}
          <div className={styles.rightCol}>
            
            {/* Queue Jump Extraction */}
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
                  onClick={() => setHasSkippedQueue(true)}
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

            {/* 5% Fee Escrow Checkout Extraction */}
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
              >
                <CreditCard size={18} />
                Pay ${total} via Escrow
              </button>
              
              {!hasSkippedQueue && (
                <p className={styles.disabledNote}>You must wait out the Review Queue or Skip the Queue to proceed.</p>
              )}
            </div>

            {/* Application Upsell */}
            <div className={styles.secondaryActionCard}>
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
