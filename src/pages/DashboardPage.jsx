import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Heart, MessageSquare, Plus, Trash2, Eye, TrendingUp, Users, BarChart3, DollarSign, ShieldCheck, Rocket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import AdSenseUnit from '../components/ads/AdSenseUnit';
import { startBillingPortal, startCheckout, startMembershipCheckout } from '../utils/payments';
import usePaymentConfig from '../hooks/usePaymentConfig';
import { resolveMediaUrl } from '../utils/media';
import styles from './DashboardPage.module.css';

const DASHBOARD_TABS = ['listings', 'favorites', 'insights'];

const formatDateLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const getBoostStatus = (listing) => {
  if (!listing?.boostType) return null;

  const expiresAt = listing.boostExpiresAt ? new Date(listing.boostExpiresAt) : null;
  const expiresLabel = expiresAt && !Number.isNaN(expiresAt.getTime())
    ? formatDateLabel(expiresAt)
    : null;
  const isActive = !expiresAt || expiresAt.getTime() > Date.now();
  const label = listing.boostType === 'urgent'
    ? 'Urgent boost'
    : listing.boostType === 'featured'
      ? 'Featured boost'
      : 'Promoted';

  return {
    label,
    active: isActive,
    expiresLabel,
    text: isActive
      ? (expiresLabel ? `${label} active until ${expiresLabel}` : `${label} active`)
      : (expiresLabel ? `${label} expired on ${expiresLabel}` : `${label} expired`),
  };
};

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const { configured: paymentsConfigured } = usePaymentConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [tab, setTab] = useState(
    DASHBOARD_TABS.includes(requestedTab) ? requestedTab : 'listings'
  );
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const hasPaidMembership = Boolean(user?.membershipTier && user.membershipTier !== 'free');
  const membershipEndsLabel = formatDateLabel(user?.membershipExpiresAt);

  const replaceDashboardSearch = useCallback((mutateParams) => {
    const params = new URLSearchParams(searchParams);
    mutateParams(params);
    const nextSearch = params.toString();
    navigate(nextSearch ? `/dashboard?${nextSearch}` : '/dashboard', { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    const nextTab = DASHBOARD_TABS.includes(searchParams.get('tab'))
      ? searchParams.get('tab')
      : 'listings';
    setTab((current) => (current === nextTab ? current : nextTab));
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      try {
        if (tab === 'listings') {
          const res = await api.get(`/listings/user/${user.id}`);
          if (!ignore) setListings(res.data);
        } else if (tab === 'favorites') {
          const res = await api.get('/favorites');
          if (!ignore) setFavorites(res.data);
        } else if (tab === 'insights') {
          const res = await api.get('/users/insights');
          if (!ignore) setInsights(res.data);
        }
      } catch {
        if (!ignore) toast.error('Failed to load data');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [tab, user?.id, reloadKey]);

  useEffect(() => {
    const paymentState = searchParams.get('payment');
    const paymentType = searchParams.get('type');
    const sessionId = searchParams.get('session_id');
    const action = searchParams.get('action');
    const purchase = searchParams.get('purchase');
    const tier = searchParams.get('tier') === 'royal' ? 'breeder' : (searchParams.get('tier') || 'breeder');

    if (!user?.id) return;

    if (action === 'boost') {
      setTab('listings');
      toast('Choose one of your listings below to boost it for 7 days.', { icon: '🚀' });
      replaceDashboardSearch((params) => {
        params.delete('action');
        params.delete('tab');
      });
      return;
    }

    if (paymentState === 'cancelled') {
      toast('Checkout cancelled.');
      replaceDashboardSearch((params) => {
        params.delete('payment');
        params.delete('type');
        params.delete('session_id');
      });
      return;
    }

    if (paymentState === 'success' && sessionId) {
      let cancelled = false;

      const verifyPayment = async () => {
        setCheckoutLoading('verify');
        try {
          await api.get('/payments/verify', { params: { sessionId } });
          const refreshedUser = await refreshUser();
          setReloadKey((value) => value + 1);
          if (paymentType === 'membership') {
            const refreshedEndsLabel = formatDateLabel(refreshedUser?.membershipExpiresAt);
            toast.success(
              refreshedEndsLabel
                ? `Breeder membership activated through ${refreshedEndsLabel}.`
                : 'Breeder membership activated.'
            );
          } else if (paymentType === 'boost') {
            toast.success('Boost payment verified. Refresh your listings to see the promotion status update.');
          } else {
            toast.success('Payment completed successfully.');
          }
        } catch (err) {
          toast.error(err.response?.data?.error || 'We could not verify that payment yet.');
        } finally {
          if (!cancelled) {
            setCheckoutLoading('');
            replaceDashboardSearch((params) => {
              params.delete('payment');
              params.delete('type');
              params.delete('session_id');
            });
          }
        }
      };

      verifyPayment();
      return () => {
        cancelled = true;
      };
    }

    if (purchase === 'membership') {
      if (hasPaidMembership) {
        toast.success('Your breeder membership is already active.');
        replaceDashboardSearch((params) => {
          params.delete('purchase');
          params.delete('tier');
        });
        return;
      }

      let cancelled = false;

      const launchMembershipCheckout = async () => {
        setCheckoutLoading('membership');
        try {
          await startMembershipCheckout({
            tier,
            amount: 25,
            cancelPath: '/dashboard',
          });
        } catch (err) {
          toast.error(err.response?.data?.error || 'Unable to start membership checkout.');
          if (!cancelled) {
            setCheckoutLoading('');
            replaceDashboardSearch((params) => {
              params.delete('purchase');
              params.delete('tier');
            });
          }
        }
      };

      launchMembershipCheckout();
      return () => {
        cancelled = true;
      };
    }
  }, [hasPaidMembership, refreshUser, replaceDashboardSearch, searchParams, user?.id]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings(listings.filter(l => l.id !== id));
      toast.success('Listing deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/listings/${id}`, { status });
      setListings(listings.map(l => l.id === id ? { ...l, status } : l));
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    replaceDashboardSearch((params) => {
      if (nextTab === 'listings') {
        params.delete('tab');
      } else {
        params.set('tab', nextTab);
      }
    });
  };

  const handleMembershipCheckout = async () => {
    if (!paymentsConfigured) {
      toast.error('Stripe billing is not configured yet. Membership checkout is blocked until billing is connected.');
      return;
    }

    if (hasPaidMembership) {
      setCheckoutLoading('portal');
      try {
        await startBillingPortal();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Unable to open billing portal.');
        setCheckoutLoading('');
      }
      return;
    }

    setCheckoutLoading('membership');
    try {
      await startMembershipCheckout({
        tier: 'breeder',
        amount: 25,
        cancelPath: '/dashboard',
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent('/dashboard?purchase=membership&tier=breeder')}`);
        return;
      }
      toast.error(err.response?.data?.error || 'Unable to start membership checkout.');
      setCheckoutLoading('');
    }
  };

  const handleBoostCheckout = async (listing) => {
    if (!paymentsConfigured) {
      toast.error('Stripe billing is not configured yet. Boost checkout is blocked until billing is connected.');
      return;
    }

    setCheckoutLoading(`boost:${listing.id}`);
    try {
      await startCheckout({
        type: 'boost',
        amount: 15,
        description: `${listing.petName} listing boost`,
        metadata: {
          listingId: listing.id,
          boostType: 'featured',
        },
        successPath: '/dashboard',
        cancelPath: '/dashboard?tab=listings&action=boost',
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent('/dashboard?tab=listings&action=boost')}`);
        return;
      }
      toast.error(err.response?.data?.error || 'Unable to start boost checkout.');
      setCheckoutLoading('');
    }
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Welcome back, {user?.name}!</p>
          </div>
          <button onClick={() => document.dispatchEvent(new CustomEvent('openPostModal'))} className="btn btn-primary">
            <Plus size={18} /> New Listing
          </button>
        </div>

        <div style={{ marginBottom: '24px', padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(41, 37, 36, 0.92))', color: '#fff', display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'center', flexWrap: 'wrap', boxShadow: 'var(--shadow-lg)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FDE68A', fontWeight: 800, marginBottom: '10px' }}>
              <ShieldCheck size={14} />
              {hasPaidMembership ? 'Membership Active' : 'Verified Breeder Membership'}
            </div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>
              {hasPaidMembership ? 'Your account is ad-free and verified.' : 'Unlock breeder verification and billing controls for $25/month.'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', maxWidth: '640px', lineHeight: 1.6 }}>
              {hasPaidMembership
                ? `You currently have breeder verification, ad-free browsing, and premium account treatment enabled.${membershipEndsLabel ? ` Current billing period ends ${membershipEndsLabel}.` : ''}`
                : paymentsConfigured
                  ? 'Complete the membership checkout to get the trust badge, remove ads, and keep premium buyer-facing status across the marketplace.'
                  : 'Membership billing is ready in the product but still blocked until Stripe is connected in production.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleMembershipCheckout}
            disabled={checkoutLoading === 'membership' || checkoutLoading === 'portal' || checkoutLoading === 'verify'}
          >
            {hasPaidMembership
              ? checkoutLoading === 'portal'
                ? 'Opening billing...'
                : 'Manage Billing'
              : !paymentsConfigured
                ? 'Billing Setup Needed'
              : checkoutLoading === 'membership'
                ? 'Opening checkout...'
                : 'Join as Breeder'}
          </button>
        </div>

        <AdSenseUnit placement="dashboardTop" type="horizontal" />

        <div className={styles.tabs}>
          {[
            { key: 'listings', label: 'My Listings', icon: <Package size={18} /> },
            { key: 'favorites', label: 'Saved', icon: <Heart size={18} /> },
            { key: 'insights', label: 'Insights', icon: <BarChart3 size={18} /> },
          ].map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {tab === 'listings' && (
              <div className={styles.listingsGrid}>
                {listings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Package size={48} />
                    <h3>No listings yet</h3>
                    <p>Create your first listing to start collecting messages, favorites, and buyer interest.</p>
                    <p>Boosts add a time-limited promotion badge after checkout. Membership unlocks ad-free browsing and billing controls.</p>
                    {!paymentsConfigured && <p>Billing setup is still pending, so paid boosts and memberships stay disabled for now.</p>}
                    <button onClick={() => document.dispatchEvent(new CustomEvent('openPostModal'))} className="btn btn-primary">Create Listing</button>
                  </div>
                ) : listings.map((listing) => {
                  const boostStatus = getBoostStatus(listing);

                  return (
                    <div key={listing.id} className={styles.listingCard}>
                      <div className={styles.listingImage}>
                        <img src={resolveMediaUrl(listing.image || listing.images?.[0] || '/images/mock_dog_1775037305181.png')} alt={listing.petName} />
                        <div className={styles.badgeStack}>
                          <span className={`${styles.statusBadge} ${styles[`status_${listing.status}`]}`}>
                            {listing.status}
                          </span>
                          {boostStatus && (
                            <span className={`${styles.boostBadge} ${boostStatus.active ? styles.boostBadgeActive : styles.boostBadgeExpired}`}>
                              {boostStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.listingInfo}>
                        <h3>{listing.petName}</h3>
                        <p>{listing.breed} • {listing.age}</p>
                        <span className={styles.price}>${listing.price}</span>
                        {boostStatus && (
                          <p className={styles.boostMeta}>{boostStatus.active ? 'Promotion attached' : 'Promotion expired'}</p>
                        )}
                      </div>
                      <div className={styles.listingActions}>
                        {listing.status === 'available' && (
                          <button
                            onClick={() => handleBoostCheckout(listing)}
                            className={styles.actionBtn}
                            title="Boost Listing"
                            disabled={checkoutLoading === `boost:${listing.id}`}
                          >
                            {checkoutLoading === `boost:${listing.id}` ? '...' : <Rocket size={16} />}
                          </button>
                        )}
                        {listing.status === 'available' && (
                          <button onClick={() => handleStatusChange(listing.id, 'adopted')} className={styles.actionBtn} title="Mark Adopted">
                            ✅
                          </button>
                        )}
                        <button onClick={() => handleDelete(listing.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'favorites' && (
              <div className={styles.listingsGrid}>
                {favorites.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Heart size={48} />
                      <h3>No saved pets</h3>
                      <p>Browse listings and save your favorites.</p>
                      <Link to="/" className="btn btn-primary">Browse Pets</Link>
                  </div>
                ) : favorites.map(fav => (
                  <Link to={`/listing/${fav.listing.id}`} key={fav.id} className={styles.listingCard}>
                    <div className={styles.listingImage}>
                      <img src={resolveMediaUrl(fav.listing.image || fav.listing.images?.[0] || '/images/mock_dog_1775037305181.png')} alt={fav.listing.petName} />
                    </div>
                    <div className={styles.listingInfo}>
                      <h3>{fav.listing.petName}</h3>
                      <p>{fav.listing.breed}</p>
                      <span className={styles.price}>${fav.listing.price}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tab === 'insights' && insights && (
              <div className={styles.insightsGrid}>
                <div className={styles.insightCard}>
                  <Users size={24} />
                  <div className={styles.insightValue}>{insights.users.total}</div>
                  <div className={styles.insightLabel}>{insights.labels?.users || 'Total Users'}</div>
                </div>
                <div className={styles.insightCard}>
                  <Package size={24} />
                  <div className={styles.insightValue}>{insights.listings.total}</div>
                  <div className={styles.insightLabel}>{insights.labels?.listingsTotal || 'Total Listings'}</div>
                </div>
                <div className={styles.insightCard}>
                  <Eye size={24} />
                  <div className={styles.insightValue}>{insights.listings.active}</div>
                  <div className={styles.insightLabel}>{insights.labels?.listingsActive || 'Active Listings'}</div>
                </div>
                <div className={styles.insightCard}>
                  <MessageSquare size={24} />
                  <div className={styles.insightValue}>{insights.messages.total}</div>
                  <div className={styles.insightLabel}>{insights.labels?.messages || 'Messages Sent'}</div>
                </div>
                <div className={styles.insightCard}>
                  <Heart size={24} />
                  <div className={styles.insightValue}>{insights.favorites.total}</div>
                  <div className={styles.insightLabel}>{insights.labels?.favorites || 'Total Favorites'}</div>
                </div>
                <div className={styles.insightCard}>
                  <TrendingUp size={24} />
                  <div className={styles.insightValue}>{insights.listings.thisWeek}</div>
                  <div className={styles.insightLabel}>{insights.labels?.listingsThisWeek || 'Listings This Week'}</div>
                </div>
                  <div className={`${styles.insightCard} ${styles.revenueCard}`}>
                    <DollarSign size={24} />
                    <div className={styles.insightLabel}>{insights.scope === 'admin' ? 'Completed Revenue' : 'Completed Purchases'}</div>
                    <div className={styles.revenueBreakdown}>
                    <div><span>Boosts:</span> <strong>{insights.revenue.boostRevenue}</strong></div>
                    <div><span>Checkout:</span> <strong>{insights.revenue.escrowRevenue}</strong></div>
                    <div><span>Queue Skips:</span> <strong>{insights.revenue.queueSkipRevenue}</strong></div>
                    <div><span>Priority Apps:</span> <strong>{insights.revenue.priorityAppRevenue}</strong></div>
                    <div><span>Membership:</span> <strong>{insights.revenue.membershipRevenue}</strong></div>
                    <div><span>Total:</span> <strong>{insights.revenue.totalRevenue}</strong></div>
                    </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
