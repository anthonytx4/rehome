import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Rocket, Megaphone, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { startMembershipCheckout } from '../../utils/payments';
import analytics from '../../hooks/useAnalytics';

const tiles = [
  {
    id: 'membership',
    icon: ShieldCheck,
    title: 'Recurring membership',
    copy: 'Ad-free browsing, verified breeder status, and priority placement for $25/mo.',
    accent: 'linear-gradient(135deg, #1F2937, #111827)',
  },
  {
    id: 'boost',
    icon: Rocket,
    title: 'Paid boosts',
    copy: 'Turn one listing into a featured placement for 7 days and keep it above the fold.',
    accent: 'linear-gradient(135deg, #7C2D12, #EA580C)',
  },
  {
    id: 'ads',
    icon: Megaphone,
    title: 'Native ad inventory',
    copy: 'Mix AdSense, partner placements, and sponsored feed cards across every browsing surface.',
    accent: 'linear-gradient(135deg, #312E81, #4338CA)',
  },
  {
    id: 'affiliate',
    icon: ShoppingBag,
    title: 'Affiliate offers',
    copy: 'Convert intent into partner revenue with supplies, insurance, and care recommendations.',
    accent: 'linear-gradient(135deg, #065F46, #059669)',
  },
];

const RevenueStack = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const hasStoredSession = Boolean(localStorage.getItem('rehome_token'));
  const canUseAccountActions = isAuthenticated || hasStoredSession;

  const handleMembership = async () => {
    analytics.beginCheckout(25, 'USD');
    if (!canUseAccountActions) {
      navigate('/login?redirect=%2Fdashboard%3Fpurchase%3Dmembership%26tier%3Dbreeder');
      return;
    }

    try {
      await startMembershipCheckout({
        tier: 'breeder',
        amount: 25,
        cancelPath: '/dashboard',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to start membership checkout');
    }
  };

  const handleBoost = () => {
    analytics.purchaseBoost('dashboard', 'featured', 15);
    if (!canUseAccountActions) {
      navigate('/login?redirect=%2Fdashboard%3Faction%3Dboost');
      return;
    }
    navigate('/dashboard?action=boost');
  };

  const handleAffiliate = () => {
    analytics.adClick('affiliate_stack', 'homepage', 'partner_offers', '/supplies');
    navigate('/supplies');
  };

  const handleAds = () => {
    analytics.adClick('inventory_stack', 'homepage', 'ad_inventory', '#gallery');
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  const actions = {
    membership: handleMembership,
    boost: handleBoost,
    ads: handleAds,
    affiliate: handleAffiliate,
  };

  return (
    <section
      style={{
        margin: '28px auto',
        padding: '28px',
        borderRadius: '28px',
        border: '1px solid var(--color-border)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.98))',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
            Monetization Strategy
          </p>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Build the $10k/month revenue stack</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '700px', lineHeight: 1.6 }}>
            This marketplace monetizes through recurring membership, paid boosts, native sponsorships, AdSense, and partner offers. The goal is to increase revenue per visitor without making the app feel crowded.
          </p>
        </div>
        <div style={{ padding: '10px 14px', borderRadius: '999px', background: 'rgba(15, 23, 42, 0.06)', color: 'var(--color-secondary)', fontWeight: 700 }}>
          4 revenue channels
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <article
              key={tile.id}
              style={{
                borderRadius: '24px',
                padding: '20px',
                color: 'white',
                background: tile.accent,
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                minHeight: '220px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center' }}>
                  <Icon size={22} />
                </div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800, opacity: 0.8 }}>
                  Revenue
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{tile.title}</h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>{tile.copy}</p>
              </div>
              <button
                type="button"
                onClick={actions[tile.id]}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '11px 16px',
                  fontWeight: 700,
                  color: '#111827',
                  background: 'rgba(255,255,255,0.94)',
                  cursor: 'pointer',
                }}
              >
                {tile.id === 'membership' ? 'Start membership' : tile.id === 'boost' ? 'Boost a listing' : tile.id === 'ads' ? 'Scroll to ad slots' : 'Browse partners'}
                <ArrowRight size={14} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default RevenueStack;
