import React, { useEffect, useMemo, useState } from 'react';
import { X, Clock, ShieldAlert, ChevronRight, Heart, MessageSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import analytics from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import styles from './PetDetailModal.module.css';

import AdSenseUnit from './ads/AdSenseUnit';
import { normalizeListing } from '../utils/listings';
import { startCheckout } from '../utils/payments';

const PetDetailModal = ({ pet, onClose, onPostAction, isPage = false }) => {
  const [hasSkippedQueue, setHasSkippedQueue] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const displayPet = useMemo(() => normalizeListing(pet), [pet]);

  useEffect(() => {
    if (displayPet) {
      analytics.viewListing(displayPet.id, displayPet.type, displayPet.breed);
    }
  }, [displayPet]);

  if (!displayPet) return null;

  const handleStripeCheckout = async (type, amount, metadata = {}) => {
    if (!isAuthenticated) {
      toast('Sign in to continue to checkout.', { icon: '🔐' });
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${displayPet.id}`)}`);
      return;
    }

    try {
      setIsProcessing(true);
      const successPath = '/dashboard';
      const cancelPath = `/listing/${displayPet.id}`;

      const res = await startCheckout({
        type,
        amount,
        description: `${displayPet.name} ${type.replaceAll('_', ' ')}`,
        metadata: { ...metadata, listingId: displayPet.id },
        successPath,
        cancelPath,
      });

      if (res.success) {
        if (type === 'skip_queue') {
          setHasSkippedQueue(true);
        }
        onPostAction?.(type === 'priority_app' ? 'favorite' : type === 'skip_queue' ? 'message' : 'listing');
        navigate(`${successPath}?payment=success&type=${type}&session_id=${res.payment?.stripePaymentId || ''}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      if (err.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(`/listing/${displayPet.id}`)}`);
        return;
      }
      toast.error(err.response?.data?.error || 'Payment failed to initialize. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate fees
  const baseFee = displayPet.fee || 0;
  const isAuction = displayPet.listingType === 'auction';
  const escrowFee = !isAuction && baseFee > 0 ? (baseFee * 0.05).toFixed(2) : '0.00';
  const total = (parseFloat(baseFee) + parseFloat(escrowFee)).toFixed(2);
  const description = displayPet.description || `A well cared-for ${String(displayPet.type || 'listing').toLowerCase()} with verified details and a clear handoff process.`;
  const messageUrl = displayPet.sellerId ? `/messages/${displayPet.id}?sellerId=${displayPet.sellerId}` : '/messages';
  const timeLeftLabel = displayPet.raw?.auctionEndsAt
    ? new Date(displayPet.raw.auctionEndsAt).toLocaleString()
    : 'Ending soon';

  return (
    <div className={isPage ? styles.pageShell : styles.overlay}>
      {!isPage && <div className={styles.modalBg} onClick={onClose} />}
      <div className={`${styles.modalContent} ${isPage ? styles.pageContent : ''}`}>
        
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.contentGrid}>
          {/* Left Column: Pet Media & Info */}
          <div className={styles.leftCol}>
            <div className={styles.imageGallery}>
              <img src={displayPet.image} alt={displayPet.name} className={styles.mainImage} />
              <button 
                className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteBtnActive : ''}`}
                onClick={() => setIsFavorited(!isFavorited)}
              >
                <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            </div>
            
            <div className={styles.petInfo}>
              <div className={styles.header}>
                <h2 className={styles.name}>{displayPet.name}</h2>
                <span className={styles.typeBadge}>{displayPet.breed}</span>
              </div>
              <p className={styles.location}>{displayPet.location} • {displayPet.age} • {displayPet.gender}</p>
              
              {!displayPet.verified && (
                <div className={styles.warningBox}>
                  <ShieldAlert size={20} className={styles.warningIcon} />
                  <div>
                    <strong>Unverified Seller</strong>
                    <p>This seller hasn't completed an Ethical Check. Proceed with caution.</p>
                  </div>
                </div>
              )}

              <div className={styles.description}>
                <h3>About {displayPet.name}</h3>
                <p>{description}</p>
              </div>

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
                    <span className={styles.currentBid}>${displayPet.currentBid?.toLocaleString() || '0'}</span>
                  </div>
                  <div className={styles.statLine}>
                    <span>Ends</span>
                    <span>{timeLeftLabel}</span>
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
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
                    return;
                  }
                  navigate(messageUrl);
                }}
              >
                <MessageSquare size={18} />
                Message {displayPet.sellerName || 'Seller'}
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
