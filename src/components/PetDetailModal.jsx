import React, { useEffect, useMemo, useState } from 'react';
import { X, ShieldAlert, ChevronRight, Heart, MessageSquare, Zap, TrendingUp, Users, Lock, MapPin, CalendarClock, Images } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import analytics from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import styles from './PetDetailModal.module.css';

import AdSenseUnit from './ads/AdSenseUnit';
import { normalizeListing } from '../utils/listings';
import { startCheckout } from '../utils/payments';
import usePaymentConfig from '../hooks/usePaymentConfig';

const QUEUE_HOURS = 24;
const formatMonthYear = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const PetDetailModal = ({ pet, onClose, onPostAction, isPage = false }) => {
  const [queueStatus, setQueueStatus] = useState(null); // null = loading, { allowed, hoursLeft }
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { configured: paymentsConfigured } = usePaymentConfig();
  const displayPet = useMemo(() => normalizeListing(pet), [pet]);

  const isPremium = Boolean(user?.membershipTier && user.membershipTier !== 'free');
  const isOwner = user?.id === displayPet?.sellerId;
  const isPetCategory = displayPet?.category === 'pets';

  // Check queue status on mount — only for pets
  useEffect(() => {
    if (!displayPet || isOwner) {
      setQueueStatus({ allowed: true });
      return;
    }
    // Livestock and supplies skip the queue entirely
    if (!isPetCategory) {
      setQueueStatus({ allowed: true });
      return;
    }
    // Pets: treat guests separately so we do not imply the queue already evaluated them.
    if (!isAuthenticated) {
      setQueueStatus({ requiresAuth: true });
      return;
    }
    api.get(`/messages/queue/${displayPet.id}`)
      .then(res => setQueueStatus(res.data))
      .catch(() => setQueueStatus({ allowed: false, hoursLeft: QUEUE_HOURS }));
  }, [displayPet, isAuthenticated, isOwner, isPetCategory]);

  useEffect(() => {
    if (displayPet) {
      analytics.viewListing(displayPet.id, displayPet.type, displayPet.breed);
    }
  }, [displayPet]);

  useEffect(() => {
    if (!displayPet?.id || !isAuthenticated) {
      setIsFavorited(false);
      return;
    }

    let cancelled = false;

    api.get('/favorites')
      .then((res) => {
        if (!cancelled) {
          setIsFavorited(res.data.some((favorite) => favorite.listingId === displayPet.id));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsFavorited(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [displayPet?.id, isAuthenticated]);

  if (!displayPet) return null;

  const galleryImages = displayPet.images?.length ? displayPet.images : [displayPet.image].filter(Boolean);
  const activeImage = galleryImages[selectedImage] || galleryImages[0] || displayPet.image;
  const savedCount = Number(displayPet.favoritesCount || 0);
  const reviewCount = Number(displayPet.sellerReviewCount || 0);
  const sellerRating = Number(displayPet.sellerAvgRating || 0);
  const sellerSince = formatMonthYear(displayPet.sellerMemberSince);
  const showSellerRating = reviewCount > 0 && sellerRating > 0;
  const guestNeedsAuth = Boolean(queueStatus?.requiresAuth);

  const handleStripeCheckout = async (type, amount, metadata = {}) => {
    if (!isAuthenticated) {
      toast('Sign in to continue to checkout.', { icon: '🔐' });
      navigate(`/login?redirect=${encodeURIComponent(`/listing/${displayPet.id}`)}`);
      return;
    }

    if (!paymentsConfigured) {
      toast.error('Payments are not configured yet. Connect Stripe before taking paid actions.');
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
          setQueueStatus({ allowed: true, skipped: true });
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

  const handleMessageSeller = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }
    if (isPetCategory && queueStatus && !queueStatus.allowed) {
      toast('Pay to skip the queue or wait for it to expire.', { icon: '🔒' });
      return;
    }
    analytics.contactSeller(displayPet.id);
    navigate(messageUrl);
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }

    try {
      if (isFavorited) {
        await api.delete(`/favorites/${displayPet.id}`);
        analytics.removeFromFavorites(displayPet.id);
        setIsFavorited(false);
        toast.success('Removed from saved listings');
        return;
      }

      await api.post(`/favorites/${displayPet.id}`);
      analytics.addToFavorites(displayPet.id, displayPet.type);
      setIsFavorited(true);
      toast.success('Saved to your dashboard');
    } catch (err) {
      if (err.response?.status === 409) {
        setIsFavorited(true);
        return;
      }
      toast.error(err.response?.data?.error || 'Unable to update saved listings');
    }
  };

  // Calculate fees
  const baseFee = displayPet.fee || 0;
  const isAuction = displayPet.listingType === 'auction';
  const escrowFee = !isAuction && baseFee > 0 ? (baseFee * 0.05).toFixed(2) : '0.00';
  const total = (parseFloat(baseFee) + parseFloat(escrowFee)).toFixed(2);
  const description = displayPet.description || `${displayPet.name} is listed on Rehome.`;
  const messageUrl = displayPet.sellerId ? `/messages/${displayPet.id}?sellerId=${displayPet.sellerId}` : '/messages';
  const timeLeftLabel = displayPet.raw?.auctionEndsAt
    ? new Date(displayPet.raw.auctionEndsAt).toLocaleString()
    : 'Ending soon';
  const canUseCheckout = !isAuction && baseFee > 0;

  const queueLocked = Boolean(queueStatus && !queueStatus.allowed && !queueStatus.requiresAuth);
  const queueLoading = queueStatus === null;

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
              <img src={activeImage} alt={displayPet.name} className={styles.mainImage} />
              <button
                className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteBtnActive : ''}`}
                onClick={handleFavoriteToggle}
              >
                <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
              {(savedCount > 0 || reviewCount > 0) && (
                <div className={styles.socialProof}>
                  {savedCount > 0 && <span><Heart size={14} /> Saved {savedCount} time{savedCount === 1 ? '' : 's'}</span>}
                  {reviewCount > 0 && <span><Users size={14} /> {reviewCount} seller review{reviewCount === 1 ? '' : 's'}</span>}
                </div>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className={styles.thumbnailRow}>
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`${styles.thumbnailBtn} ${selectedImage === index ? styles.thumbnailBtnActive : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${displayPet.name} photo ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}

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
                    <strong>Seller not verified yet</strong>
                    <p>Use messages to confirm identity, records, and pickup details before paying.</p>
                  </div>
                </div>
              )}

              <div className={styles.description}>
                <h3>About {displayPet.name}</h3>
                <p>{description}</p>
              </div>

              <div className={styles.listingFacts}>
                <div className={styles.factPill}>
                  <Images size={15} />
                  {galleryImages.length} photo{galleryImages.length === 1 ? '' : 's'}
                </div>
                {displayPet.createdAt && (
                  <div className={styles.factPill}>
                    <CalendarClock size={15} />
                    Listed {new Date(displayPet.createdAt).toLocaleDateString()}
                  </div>
                )}
                {savedCount > 0 && (
                  <div className={styles.factPill}>
                    <Heart size={15} />
                    {savedCount} save{savedCount === 1 ? '' : 's'}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '32px' }}>
                <AdSenseUnit slot="modal-bottom-native" />
              </div>
            </div>
          </div>

          {/* Right Column: Monetization Actions */}
          <div className={styles.rightCol}>
            <div className={styles.actionCard}>
              <div className={styles.queueHeader}>
                <Users size={20} />
                <h3>Seller profile</h3>
              </div>
              <div className={styles.sellerMeta}>
                <div>
                  <strong>{displayPet.sellerName || 'Rehome seller'}</strong>
                  <p>{displayPet.verified ? 'Verified breeder or seller' : 'Standard marketplace seller'}</p>
                </div>
                {displayPet.sellerLocation && (
                  <span className={styles.sellerMetaTag}><MapPin size={14} /> {displayPet.sellerLocation}</span>
                )}
              </div>
              <div className={styles.sellerStats}>
                <div>
                  <span>Verification</span>
                  <strong>{displayPet.verified ? 'Verified' : 'Not verified'}</strong>
                </div>
                <div>
                  <span>Reviews</span>
                  <strong>{showSellerRating ? `${sellerRating.toFixed(1)} stars · ${reviewCount}` : reviewCount > 0 ? `${reviewCount} total` : 'No reviews yet'}</strong>
                </div>
                <div>
                  <span>Member since</span>
                  <strong>{sellerSince || 'Recently joined'}</strong>
                </div>
              </div>
              <p className={styles.profileNote}>
                Review records, pickup or shipping terms, and payment expectations with the seller before completing a handoff.
              </p>
            </div>

            {/* Queue Gate — only shown for pets */}
            {isPetCategory && queueLocked && (
              <div className={`${styles.actionCard} ${styles.queueCard}`}>
                <div className={styles.queueHeader}>
                  <Lock size={20} className={styles.queueIcon} />
                  <h3>Inquiry Queue Active</h3>
                </div>
                <div className={styles.queueTimerBar}>
                  <div className={styles.queueTimerFill} style={{ width: `${((QUEUE_HOURS - (queueStatus.hoursLeft || 0)) / QUEUE_HOURS) * 100}%` }} />
                </div>
                <p className={styles.queueText}>
                  <strong>{queueStatus.hoursLeft}h</strong> until free messaging unlocks.
                  <br />
                  <span className={styles.queueSubtext}>Pay only if you want immediate access now.</span>
                </p>
                <button
                  className={`btn btn-premium ${styles.fullWidthBtn} ${styles.pulseBtn}`}
                  disabled={isProcessing}
                  onClick={() => handleStripeCheckout('skip_queue', 9)}
                >
                  <Zap size={18} />
                  {isProcessing ? 'Processing...' : 'Skip Queue — $9.00'}
                </button>
                <p className={styles.skipNote}>Instant access. Message the seller right now.</p>
              </div>
            )}

            {/* Premium upsell — shown to non-premium when queue is active (pets only) */}
            {isPetCategory && queueLocked && !isPremium && (
              <div className={`${styles.secondaryActionCard} ${styles.premiumUpsell}`} onClick={() => navigate('/dashboard?purchase=membership&tier=breeder')}>
                <div className={styles.appRow}>
                  <div>
                    <strong>Membership removes queue delays</strong>
                    <p>$25/mo with ad-free browsing, a trust badge, and faster messaging access.</p>
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              </div>
            )}

            {/* Auction vs Fixed Price */}
            {isAuction ? (
              <div className={styles.actionCard}>
                <div className={styles.queueHeader} style={{ color: 'var(--color-primary)' }}>
                  <TrendingUp size={20} />
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
                  <div className={styles.statLine}>
                    <span>Bidders</span>
                    <span>{displayPet.raw?.bidCount || 0} active</span>
                  </div>
                </div>
                <p className={styles.escrowText}>
                  {paymentsConfigured
                    ? 'A refundable $50.00 deposit is required before bidding opens.'
                    : 'Bidding is blocked until Stripe billing is connected.'}
                </p>
                <button
                  className={`btn btn-primary ${styles.fullWidthBtn}`}
                  disabled={isProcessing || !paymentsConfigured}
                  onClick={() => handleStripeCheckout('bid_deposit', 50)}
                >
                  {paymentsConfigured
                    ? (isProcessing ? 'Initializing...' : 'Pay $50.00 to Place Bid')
                  : 'Bidding Unavailable'}
                </button>
              </div>
            ) : (
              <div className={styles.actionCard}>
                <h3>On-platform checkout</h3>
                <p className={styles.escrowText}>
                  {paymentsConfigured
                    ? 'Checkout runs through Stripe when the seller has set an online price. Confirm records and handoff terms before paying.'
                    : 'Checkout is not active yet. Do not promise buyers on-platform payment until Stripe is connected.'}
                </p>

                {canUseCheckout ? (
                  <>
                    <div className={styles.receipt}>
                      <div className={styles.receiptLine}>
                        <span>Base Fee</span>
                        <span>${baseFee.toFixed(2)}</span>
                      </div>
                      <div className={styles.receiptLine}>
                        <span>Marketplace fee (5%)</span>
                        <span>${escrowFee}</span>
                      </div>
                      <div className={styles.receiptTotal}>
                        <span>Total Due</span>
                        <span>${total}</span>
                      </div>
                    </div>

                    <button
                      className={`btn btn-primary ${styles.fullWidthBtn}`}
                      disabled={isProcessing || !paymentsConfigured}
                      onClick={() => handleStripeCheckout('escrow', total)}
                    >
                      {paymentsConfigured
                        ? (isProcessing ? 'Processing...' : `Pay $${total} via Checkout`)
                        : 'Checkout Unavailable'}
                    </button>
                  </>
                ) : (
                  <div className={styles.noCheckoutState}>
                    <strong>Message seller for handoff details</strong>
                    <p>This listing does not have an online checkout amount configured yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Message Seller — gated for pets only */}
            <div className={styles.actionCard}>
              <h3>Contact Seller</h3>
              <button
                className={`btn ${isPetCategory && queueLocked ? 'btn-disabled' : guestNeedsAuth ? 'btn-primary' : 'btn-secondary'} ${styles.fullWidthBtn}`}
                disabled={(isPetCategory && queueLocked) || queueLoading}
                onClick={handleMessageSeller}
              >
                {guestNeedsAuth ? (
                  <><MessageSquare size={18} /> Sign in to message seller</>
                ) : isPetCategory && queueLocked ? (
                  <><Lock size={18} /> Queue Locked — {queueStatus.hoursLeft}h left</>
                ) : (
                  <><MessageSquare size={18} /> Message {displayPet.sellerName || 'Seller'}</>
                )}
              </button>
              {guestNeedsAuth && (
                <p className={styles.profileNote}>
                  Sign in to view real message availability and continue the conversation on-platform.
                </p>
              )}
              {isPetCategory && isPremium && (
                <p className={styles.premiumBypass}>Premium member — queue bypassed</p>
              )}
            </div>

            {/* Priority Application */}
            <div
              className={styles.secondaryActionCard}
              onClick={() => {
                if (!paymentsConfigured) {
                  toast.error('Priority applications are unavailable until Stripe billing is connected.');
                  return;
                }
                handleStripeCheckout('priority_app', 5);
              }}
            >
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
