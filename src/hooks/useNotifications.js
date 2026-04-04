import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { resolveMediaUrl } from '../utils/media';

const RECENT_WINDOW_MS = 72 * 60 * 60 * 1000;

export function useNotifications({ isAuthenticated, user, paymentsConfigured }) {
  const [messages, setMessages] = useState([]);
  const [newListings, setNewListings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      setNewListings([]);
      return;
    }

    let cancelled = false;

    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);

      try {
        const [inboxRes, listingsRes] = await Promise.all([
          api.get('/messages/inbox'),
          api.get('/listings', { params: { page: 1, limit: 8 } }),
        ]);

        if (cancelled) return;

        const unreadMessages = inboxRes.data
          .filter((conversation) => conversation.unreadCount > 0)
          .map((conversation) => ({
            id: `message-${conversation.listingId}-${conversation.otherUser.id}`,
            title: `New message from ${conversation.otherUser.name}`,
            body: conversation.lastMessage.content || 'Sent media',
            href: `/messages/${conversation.listingId}?sellerId=${conversation.otherUser.id}`,
            meta: new Date(conversation.lastMessage.createdAt).toLocaleString(),
            count: conversation.unreadCount,
          }));

        const recentListings = (listingsRes.data?.listings || [])
          .filter((listing) => listing.userId !== user?.id)
          .filter((listing) => {
            const createdAt = new Date(listing.createdAt);
            return !Number.isNaN(createdAt.getTime()) && (Date.now() - createdAt.getTime()) <= RECENT_WINDOW_MS;
          })
          .slice(0, 4)
          .map((listing) => ({
            id: `listing-${listing.id}`,
            title: `${listing.petName || listing.title} is new`,
            body: `${listing.breed || listing.species} in ${listing.location}`,
            href: `/listing/${listing.id}`,
            meta: new Date(listing.createdAt).toLocaleDateString(),
            image: resolveMediaUrl(listing.image || listing.images?.[0]),
          }));

        setMessages(unreadMessages);
        setNewListings(recentListings);
      } catch {
        if (!cancelled) {
          setMessages([]);
          setNewListings([]);
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = window.setInterval(() => load({ silent: true }), 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, user?.id]);

  const alerts = useMemo(() => {
    if (!isAuthenticated) return [];

    const items = [];

    if (!paymentsConfigured) {
      items.push({
        id: 'alert-billing',
        title: 'Billing setup still pending',
        body: 'Boosts, memberships, and checkout stay disabled until Stripe is connected.',
        href: '/dashboard',
        meta: 'Launch alert',
      });
    }

    if (user && !user.isVerifiedBreeder) {
      items.push({
        id: 'alert-verification',
        title: 'Your seller profile is unverified',
        body: 'Buyers currently see you as unverified. Upgrade when billing is ready.',
        href: '/dashboard',
        meta: 'Trust alert',
      });
    }

    return items;
  }, [isAuthenticated, paymentsConfigured, user]);

  const unreadMessagesCount = messages.reduce((sum, item) => sum + (item.count || 1), 0);
  const totalCount = unreadMessagesCount + newListings.length + alerts.length;

  return {
    loading,
    messages,
    newListings,
    alerts,
    unreadMessagesCount,
    totalCount,
  };
}

export default useNotifications;
