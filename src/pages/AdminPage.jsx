import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Eye, MessageSquare, Heart, TrendingUp, DollarSign, BarChart3, ShieldCheck, AlertCircle, ExternalLink, CheckCircle2, RotateCcw, Ban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';
import { maskEmail } from '../utils/text';

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const AdminPage = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moderationAction, setModerationAction] = useState('');

  const fetchInsights = useCallback(async () => {
    try {
      const res = await api.get('/users/insights');
      setInsights(res.data);
    } catch {
      toast.error('Failed to load admin insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleModerationAction = async (listingId, action) => {
    const actionKey = `${listingId}:${action}`;
    setModerationAction(actionKey);
    try {
      await api.post(`/listings/${listingId}/moderate`, { action });
      toast.success(
        action === 'approve'
          ? 'Listing approved and returned to browse results.'
          : action === 'remove'
            ? 'Listing removed from public browse results.'
            : 'Listing sent back to the review queue.'
      );
      await fetchInsights();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Moderation action failed');
    } finally {
      setModerationAction('');
    }
  };

  if (user?.email !== 'admin@rehome.world') {
    return (
      <div className={styles.noAccess}>
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>This page is restricted to platform administrators only.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

  const moderation = insights?.moderation || {
    pendingReviewCount: 0,
    removedListingsCount: 0,
    flaggedMessageCount: 0,
    listingQueue: [],
    sellerWatchlist: [],
    messageAlerts: [],
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Headquarters</h1>
            <p className={styles.subtitle}>Marketplace health, trust, moderation, and revenue analytics.</p>
          </div>
          <div className={styles.adminBadge}>
            <ShieldCheck size={18} /> Staff Account
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {[
            { label: 'Total Users', value: insights.users.total, icon: <Users size={24} />, color: '#3B82F6' },
            { label: 'Total Listings', value: insights.listings.total, icon: <Package size={24} />, color: '#10B981' },
            { label: 'Active Listings', value: insights.listings.active, icon: <Eye size={24} />, color: '#F59E0B' },
            { label: 'Messages Sent', value: insights.messages.total, icon: <MessageSquare size={24} />, color: '#8B5CF6' },
            { label: 'Total Favorites', value: insights.favorites.total, icon: <Heart size={24} />, color: '#EF4444' },
            { label: 'New This Week', value: insights.listings.thisWeek, icon: <TrendingUp size={24} />, color: '#06B6D4' },
          ].map(stat => (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
              <div className={styles.statInfo}>
                <div className={stat.value === 0 ? styles.statValueEmpty : styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Breakdown */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <DollarSign size={20} />
            <h2>Revenue Tracking</h2>
          </div>
          <div className={styles.revenueGrid}>
            <div className={styles.revenueHero}>
              <div className={styles.revenueHeroValue}>{insights.revenue.totalRevenue}</div>
              <div className={styles.revenueHeroLabel}>Recorded Revenue</div>
              <div className={styles.revenueSpark}>
                <BarChart3 size={48} />
              </div>
            </div>
            <div className={styles.revenueItems}>
              <div className={styles.revenueItem}>
                <span>Boost Purchases</span>
                <strong>{insights.revenue.boostRevenue}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Escrow Processing Fees</span>
                <strong>{insights.revenue.escrowRevenue}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Queue Skip Fees</span>
                <strong>{insights.revenue.queueSkipRevenue}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Priority App Fees</span>
                <strong>{insights.revenue.priorityAppRevenue}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Membership Revenue</span>
                <strong>{insights.revenue.membershipRevenue}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.moderationSection}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={20} />
            <h2>Moderation Queue</h2>
          </div>

          <div className={styles.moderationOverview}>
            <div className={styles.overviewCard}>
              <strong>{moderation.pendingReviewCount}</strong>
              <span>Listings waiting for review</span>
            </div>
            <div className={styles.overviewCard}>
              <strong>{moderation.removedListingsCount}</strong>
              <span>Removed listings</span>
            </div>
            <div className={styles.overviewCard}>
              <strong>{moderation.flaggedMessageCount}</strong>
              <span>Risky recent messages</span>
            </div>
          </div>

          {moderation.listingQueue.length === 0 ? (
            <div className={styles.moderationEmpty}>
              <p>No listings are waiting for review right now.</p>
            </div>
          ) : (
            <div className={styles.queueList}>
              {moderation.listingQueue.map((listing) => (
                <article key={listing.id} className={styles.queueItem}>
                  <div className={styles.queueMeta}>
                    <div>
                      <h3>{listing.petName}</h3>
                      <p>{listing.breed} • {listing.location}</p>
                      <p className={styles.metaText}>
                        Seller: {listing.user.name} ({maskEmail(listing.user.email)}) • Updated {formatDateTime(listing.updatedAt)}
                      </p>
                    </div>
                    <Link to={`/listing/${listing.id}`} className={styles.queueLink}>
                      <ExternalLink size={16} /> Open
                    </Link>
                  </div>
                  <div className={styles.queueFlags}>
                    {(listing.flags?.length ? listing.flags : ['Needs human review']).map((flag) => (
                      <span key={flag} className={styles.flag}>{flag}</span>
                    ))}
                  </div>
                  <div className={styles.queueActions}>
                    <button
                      type="button"
                      className={`${styles.moderationAction} ${styles.approveAction}`}
                      disabled={moderationAction === `${listing.id}:approve`}
                      onClick={() => handleModerationAction(listing.id, 'approve')}
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      type="button"
                      className={`${styles.moderationAction} ${styles.reviewAction}`}
                      disabled={moderationAction === `${listing.id}:review`}
                      onClick={() => handleModerationAction(listing.id, 'review')}
                    >
                      <RotateCcw size={16} /> Keep in Review
                    </button>
                    <button
                      type="button"
                      className={`${styles.moderationAction} ${styles.removeAction}`}
                      disabled={moderationAction === `${listing.id}:remove`}
                      onClick={() => handleModerationAction(listing.id, 'remove')}
                    >
                      <Ban size={16} /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className={styles.moderationGrid}>
            <div className={styles.panel}>
              <h3>Seller Watchlist</h3>
              {moderation.sellerWatchlist.length === 0 ? (
                <div className={styles.emptyPanel}>No repeat-risk sellers right now.</div>
              ) : (
                <div className={styles.panelList}>
                  {moderation.sellerWatchlist.map((entry) => (
                    <div key={entry.userId} className={styles.panelItem}>
                      <div>
                        <strong>{entry.seller.name}</strong>
                        <p className={styles.metaText}>
                          {entry.flaggedListings} flagged listing{entry.flaggedListings === 1 ? '' : 's'} • {entry.pendingReviewCount} pending • {entry.removedCount} removed
                        </p>
                        <p className={styles.metaText}>{entry.examples.join(' • ')}</p>
                      </div>
                      <span className={styles.watchPill}>Watch</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <h3>Recent Message Alerts</h3>
              {moderation.messageAlerts.length === 0 ? (
                <div className={styles.emptyPanel}>No recent off-platform or risky message patterns detected.</div>
              ) : (
                <div className={styles.panelList}>
                  {moderation.messageAlerts.map((alert) => (
                    <div key={alert.id} className={styles.panelItem}>
                      <div>
                        <strong>{alert.sender.name} to {alert.receiver.name}</strong>
                        <p className={styles.metaText}>{alert.listing?.petName || 'Listing'} • {formatDateTime(alert.createdAt)}</p>
                        <p className={styles.metaText}>{alert.flags.join(' • ')}</p>
                      </div>
                      <span className={styles.alertPill}>Alert</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
