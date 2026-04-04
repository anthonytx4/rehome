import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { resolveMediaUrl } from '../utils/media';

const RECENT_WINDOW_MS = 72 * 60 * 60 * 1000;
const STORAGE_PREFIX = 'rehome_notifications';

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const storageKeyForUser = (userId) => `${STORAGE_PREFIX}:${userId || 'anonymous'}`;

const getStoredState = (userId) => {
  if (typeof window === 'undefined') return {};
  return safeJsonParse(window.localStorage.getItem(storageKeyForUser(userId)), {});
};

const persistState = (userId, nextState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKeyForUser(userId), JSON.stringify(nextState));
};

const getMessageVersion = (conversation) => conversation.lastMessage?.id
  || conversation.lastMessage?.createdAt
  || String(conversation.unreadCount || 1);

const getListingVersion = (listing) => listing.createdAt || listing.updatedAt || listing.id;

export function useNotifications({ isAuthenticated, user, paymentsConfigured }) {
  const [messages, setMessages] = useState([]);
  const [newListings, setNewListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readState, setReadState] = useState(() => getStoredState(user?.id));

  useEffect(() => {
    setReadState(getStoredState(user?.id));
  }, [user?.id]);

  const markNotificationRead = async (notification) => {
    if (!notification || !isAuthenticated) return;

    if (notification.type === 'message' && notification.listingId && notification.otherUserId) {
      try {
        await api.post('/messages/read', {
          listingId: notification.listingId,
          userId: notification.otherUserId,
        });
      } catch {
        return;
      }
    }

    setReadState((current) => {
      const next = { ...current };
      if (notification.type === 'message') {
        next[notification.id] = {
          type: 'message',
          version: notification.version,
          readAt: new Date().toISOString(),
        };
      } else if (notification.type === 'listing') {
        next[notification.id] = {
          type: 'listing',
          version: notification.version,
          readAt: new Date().toISOString(),
        };
      } else if (notification.type === 'alert') {
        next[notification.id] = {
          type: 'alert',
          version: notification.version || '1',
          readAt: new Date().toISOString(),
        };
      }
      persistState(user?.id, next);
      return next;
    });
  };

  const markAllNotificationsRead = async () => {
    if (!isAuthenticated) return;

    try {
      if (messages.length > 0) {
        await api.post('/messages/read', { all: true });
      }
    } catch {
      return;
    }

    setReadState((current) => {
      const next = { ...current };
      [
        ...messages,
        ...newListings,
        ...alerts,
      ].forEach((notification) => {
        next[notification.id] = {
          type: notification.type,
          version: notification.version,
          readAt: new Date().toISOString(),
        };
      });
      persistState(user?.id, next);
      return next;
    });
  };

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
            type: 'message',
            id: `message-${conversation.listingId}-${conversation.otherUser.id}`,
            listingId: conversation.listingId,
            otherUserId: conversation.otherUser.id,
            title: `New message from ${conversation.otherUser.name}`,
            body: conversation.lastMessage.content || 'Sent media',
            href: `/messages/${conversation.listingId}?sellerId=${conversation.otherUser.id}`,
            meta: new Date(conversation.lastMessage.createdAt).toLocaleString(),
            count: conversation.unreadCount,
            version: getMessageVersion(conversation),
          }));

        const recentListings = (listingsRes.data?.listings || [])
          .filter((listing) => listing.userId !== user?.id)
          .filter((listing) => {
            const createdAt = new Date(listing.createdAt);
            return !Number.isNaN(createdAt.getTime()) && (Date.now() - createdAt.getTime()) <= RECENT_WINDOW_MS;
          })
          .slice(0, 4)
          .map((listing) => ({
            type: 'listing',
            id: `listing-${listing.id}`,
            title: `${listing.petName || listing.title} is new`,
            body: `${listing.breed || listing.species} in ${listing.location}`,
            href: `/listing/${listing.id}`,
            meta: new Date(listing.createdAt).toLocaleDateString(),
            image: resolveMediaUrl(listing.image || listing.images?.[0]),
            version: getListingVersion(listing),
          }));

        const visibleMessages = unreadMessages.filter((notification) => {
          const stored = readState[notification.id];
          return !stored || stored.version !== notification.version;
        });

        const visibleListings = recentListings.filter((notification) => {
          const stored = readState[notification.id];
          return !stored || stored.version !== notification.version;
        });

        setMessages(visibleMessages);
        setNewListings(visibleListings);
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
  }, [isAuthenticated, user?.id, readState]);

  const alerts = useMemo(() => {
    if (!isAuthenticated) return [];

    const items = [];

    if (!paymentsConfigured) {
      items.push({
        type: 'alert',
        id: 'alert-billing',
        title: 'Billing setup still pending',
        body: 'Boosts, memberships, and checkout stay disabled until Stripe is connected.',
        href: '/dashboard',
        meta: 'Launch alert',
        version: '1',
      });
    }

    if (user && !user.isVerifiedBreeder) {
      items.push({
        type: 'alert',
        id: 'alert-verification',
        title: 'Your seller profile is unverified',
        body: 'Buyers currently see you as unverified. Upgrade when billing is ready.',
        href: '/dashboard',
        meta: 'Trust alert',
        version: '1',
      });
    }

    return items;
  }, [isAuthenticated, paymentsConfigured, user]);

  const decoratedAlerts = alerts.filter((notification) => {
    const stored = readState[notification.id];
    return !stored || stored.version !== notification.version;
  });

  const unreadMessagesCount = messages.reduce((sum, item) => sum + (item.count || 1), 0);
  const unreadListingsCount = newListings.length;
  const unreadAlertsCount = decoratedAlerts.length;
  const totalCount = unreadMessagesCount + unreadListingsCount + unreadAlertsCount;

  return {
    loading,
    messages,
    newListings,
    alerts: decoratedAlerts,
    unreadMessagesCount,
    unreadListingsCount,
    unreadAlertsCount,
    totalCount,
    markNotificationRead,
    markAllNotificationsRead,
    readState,
  };
}

export default useNotifications;
