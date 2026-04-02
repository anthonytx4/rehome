import React, { useState, useEffect } from 'react';
import { Users, Package, Eye, MessageSquare, Heart, TrendingUp, DollarSign, BarChart3, ShieldCheck, AlertCircle, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/users/insights');
      setInsights(res.data);
    } catch (err) {
      toast.error('Failed to load admin insights');
    } finally {
      setLoading(false);
    }
  };

  if (user?.email !== 'admin@rehome.world') {
    return (
      <div className={styles.noAccess}>
        <AlertCircle size={48} />
        <h2>Access Denied</h2>
        <p>This page is restricted to platform administrators only.</p>
        <button onClick={() => window.location.href = '/'} className="btn btn-primary">Back to Home</button>
      </div>
    );
  }

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Headquarters</h1>
            <p className={styles.subtitle}>Marketplace Health & Revenue Analytics</p>
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
            <h2>Revenue Tracking (EST)</h2>
          </div>
          <div className={styles.revenueGrid}>
            <div className={styles.revenueHero}>
              <div className={styles.revenueHeroValue}>
                ${(
                  parseFloat(insights.revenue.estimatedBoostRevenue.slice(1)) + 
                  parseFloat(insights.revenue.estimatedEscrowFees.slice(1)) + 
                  parseFloat(insights.revenue.estimatedQueueSkips.slice(1)) + 
                  parseFloat(insights.revenue.estimatedPriorityApps.slice(1))
                ).toFixed(2)}
              </div>
              <div className={styles.revenueHeroLabel}>Gross Estimated Revenue</div>
              <div className={styles.revenueSpark}>
                <BarChart3 size={48} />
              </div>
            </div>
            <div className={styles.revenueItems}>
              <div className={styles.revenueItem}>
                <span>Boost Purchases ($15)</span>
                <strong>{insights.revenue.estimatedBoostRevenue}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Escrow Processing Fees (5%)</span>
                <strong>{insights.revenue.estimatedEscrowFees}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Queue Skip Fees ($9)</span>
                <strong>{insights.revenue.estimatedQueueSkips}</strong>
              </div>
              <div className={styles.revenueItem}>
                <span>Priority App Fees ($5)</span>
                <strong>{insights.revenue.estimatedPriorityApps}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for Moderation Tools */}
        <div className={styles.moderationSection}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={20} />
            <h2>Moderation Queue</h2>
          </div>
          <div className={styles.moderationEmpty}>
            <p>No listings currently pending review.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
