import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, MessageSquare, Plus, Edit2, Trash2, Eye, TrendingUp, Users, BarChart3, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'listings') {
        const res = await api.get(`/listings/user/${user.id}`);
        setListings(res.data);
      } else if (tab === 'favorites') {
        const res = await api.get('/favorites');
        setFavorites(res.data);
      } else if (tab === 'insights') {
        const res = await api.get('/users/insights');
        setInsights(res.data);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Welcome back, {user?.name}!</p>
          </div>
          <Link to="/create-listing" className="btn btn-primary">
            <Plus size={18} /> New Listing
          </Link>
        </div>

        <div className={styles.tabs}>
          {[
            { key: 'listings', label: 'My Listings', icon: <Package size={18} /> },
            { key: 'favorites', label: 'Saved', icon: <Heart size={18} /> },
            { key: 'insights', label: 'Insights', icon: <BarChart3 size={18} /> },
          ].map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
              onClick={() => setTab(t.key)}
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
                    <p>Create your first pet listing to get started.</p>
                    <Link to="/create-listing" className="btn btn-primary">Create Listing</Link>
                  </div>
                ) : listings.map(listing => (
                  <div key={listing.id} className={styles.listingCard}>
                    <div className={styles.listingImage}>
                      <img src={listing.images?.[0] || '/images/mock_dog_1775037305181.png'} alt={listing.petName} />
                      <span className={`${styles.statusBadge} ${styles[`status_${listing.status}`]}`}>
                        {listing.status}
                      </span>
                    </div>
                    <div className={styles.listingInfo}>
                      <h3>{listing.petName}</h3>
                      <p>{listing.breed} • {listing.age}</p>
                      <span className={styles.price}>${listing.price}</span>
                    </div>
                    <div className={styles.listingActions}>
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
                ))}
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
                      <img src={fav.listing.images?.[0] || '/images/mock_dog_1775037305181.png'} alt={fav.listing.petName} />
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
                  <div className={styles.insightLabel}>Total Users</div>
                </div>
                <div className={styles.insightCard}>
                  <Package size={24} />
                  <div className={styles.insightValue}>{insights.listings.total}</div>
                  <div className={styles.insightLabel}>Total Listings</div>
                </div>
                <div className={styles.insightCard}>
                  <Eye size={24} />
                  <div className={styles.insightValue}>{insights.listings.active}</div>
                  <div className={styles.insightLabel}>Active Listings</div>
                </div>
                <div className={styles.insightCard}>
                  <MessageSquare size={24} />
                  <div className={styles.insightValue}>{insights.messages.total}</div>
                  <div className={styles.insightLabel}>Messages Sent</div>
                </div>
                <div className={styles.insightCard}>
                  <Heart size={24} />
                  <div className={styles.insightValue}>{insights.favorites.total}</div>
                  <div className={styles.insightLabel}>Total Favorites</div>
                </div>
                <div className={styles.insightCard}>
                  <TrendingUp size={24} />
                  <div className={styles.insightValue}>{insights.listings.thisWeek}</div>
                  <div className={styles.insightLabel}>Listings This Week</div>
                </div>
                <div className={`${styles.insightCard} ${styles.revenueCard}`}>
                  <DollarSign size={24} />
                  <div className={styles.insightLabel}>Est. Revenue</div>
                  <div className={styles.revenueBreakdown}>
                    <div><span>Boosts:</span> <strong>{insights.revenue.estimatedBoostRevenue}</strong></div>
                    <div><span>Escrow Fees:</span> <strong>{insights.revenue.estimatedEscrowFees}</strong></div>
                    <div><span>Queue Skips:</span> <strong>{insights.revenue.estimatedQueueSkips}</strong></div>
                    <div><span>Priority Apps:</span> <strong>{insights.revenue.estimatedPriorityApps}</strong></div>
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
