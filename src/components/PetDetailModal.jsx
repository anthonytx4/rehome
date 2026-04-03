import React, { useState, useEffect } from 'react';
import { X, Clock, ShieldAlert, CreditCard, ChevronRight, Heart, MessageSquare } from 'lucide-react';
import ContextualRecommendations from './ads/ContextualRecommendations';
import analytics from '../hooks/useAnalytics';
import styles from './PetDetailModal.module.css';

import api from '../api/client';
import AdSenseUnit from './ads/AdSenseUnit';

const PetDetailModal = ({ pet, onClose, onPostAction }) => {
  const [hasSkippedQueue, setHasSkippedQueue] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (pet) {
      analytics.viewListing(pet.id, pet.type, pet.breed);
    }
  }, [pet]);

  if (!pet) return null;

  const handleStripeCheckout = async (type, amount, metadata = {}) => {
    try {
      setIsProcessing(true);
      const res = await api.post('/api/payments/checkout', {
        type,
        amount,
        listingId: pet.id,
        metadata: { ...metadata, listingId: pet.id },
        successPath: `/dashboard`,
        cancelPath: `/dashboard`
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Payment failed to initialize. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate fees
  const baseFee = pet.fee || 0;
  const isAuction = pet.listingType === 'auction';
  const escrowFee = !isAuction && baseFee > 0 ? (baseFee * 0.05).toFixed(2) : '0.00';
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
              <button 
                className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteBtnActive : ''}`}
                onClick={() => setIsFavorited(!isFavorited)}
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
                    <p>This seller hasn't completed an Ethical Check. Proceed with caution.</p>
                  </div>
                </div>
              )}

              <div className={styles.description}>
                <h3>About {pet.name}</h3>
                <p>Premium {pet.type.toLowerCase()} listing. This is a highly sought-after specimen with verified health records.</p>
              </div>

              {/* Contextual Product Recommendations */}
              <ContextualRecommendations petType={pet.type} petName={pet.name} />
              
              <div style={{ marginTop: '32px' }}>
                <AdSenseUnit slot="modal-bottom-native" />
              </div>
            </div>
          </div>

          {/* Right Column: Monetization Actions */}
          <div className={styles.rightCol}>
            
            {/* Queue Jump */}
            {!hasSkippedQueue && (
              <div className={styles.actionCard}>
                <div className={styles.queueHeader}>
                  <Clock size={20} className={styles.queueIcon} />
                  <h3>Review Queue Active</h3>
                </div>
                <p className={styles.queueText}>Locked for 24 hours. Priority users skip the wait.</p>
                <button 
                  className={`btn btn-premium ${styles.fullWidthBtn}`}
                  disabled={isProcessing}
                  onClick={() => handleStripeCheckout('skip_queue', 9)}
                >
                  {isProcessing ? 'Processing...' : 'Pay $9.00 to Skip Queue'}
                </button>
              </div>
            )}

            {/* Auction vs Fixed Price */}
            {isAuction ? (
              <div className={styles.actionCard}>
                <div className={styles.queueHeader} style={{ color: 'var(--color-primary)' }}>
                  <Clock size={20} />
                  <h3>High Stakes Auction</h3>
                </div>
                <div className={styles.auctionStats}>
                  <div className={styles.statLine}>
                    <span>Current Bid</span>
                    <span className={styles.currentBid}>${pet.currentBid?.toLocaleString() || '0'}</span>
                  </div>
                  <div className={styles.statLine}>
                    <span>Time Left</span>
                    <span>2d 14h</span>
                  </div>
                </div>
                <p className={styles.escrowText}>A refundable $50.00 deposit is required to participate in this auction.</p>
                <button 
                  className={`btn btn-primary ${styles.fullWidthBtn}`}
                  disabled={isProcessing}
                  onClick={() => handleStripeCheckout('bid_deposit', 50)}
                >
                  {isProcessing ? 'Initializing...' : 'Pay $50.00 to Place Bid'}
                </button>
              </div>
            ) : (
              <div className={styles.actionCard}>
                <h3>Secure Escrow Payment</h3>
                <p className={styles.escrowText}>Mandatory 5% safety fee. Funds held until delivery.</p>
                
                <div className={styles.receipt}>
                  <div className={styles.receiptLine}>
                    <span>Base Fee</span>
                    <span>${baseFee.toFixed(2)}</span>
                  </div>
                  <div className={styles.receiptLine}>
                    <span>Safety Fee (5%)</span>
                    <span>${escrowFee}</span>
                  </div>
                  <div className={styles.receiptTotal}>
                    <span>Total Due</span>
                    <span>${total}</span>
                  </div>
                </div>

                <button 
                  className={`btn btn-primary ${styles.fullWidthBtn}`}
                  disabled={isProcessing}
                  onClick={() => handleStripeCheckout('escrow', total)}
                >
                  {isProcessing ? 'Processing...' : `Pay $${total} via Escrow`}
                </button>
              </div>
            )}

            {/* Support/Questions */}
            <div className={styles.actionCard}>
              <h3>Contact Questions</h3>
              <button 
                className={`btn btn-secondary ${styles.fullWidthBtn}`}
                onClick={() => window.location.href = `/messages/${pet.id}`}
              >
                <MessageSquare size={18} />
                Message Seller
              </button>
            </div>

            {/* Priority Application */}
            <div className={styles.secondaryActionCard} onClick={() => handleStripeCheckout('priority_app', 5)}>
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
