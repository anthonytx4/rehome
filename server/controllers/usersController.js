import { PrismaClient } from '@prisma/client';
import { getListingModerationFlags, getMessageRiskFlags } from '../utils/marketplaceSafety.js';

const prisma = new PrismaClient();
const COMPLETED_PAYMENT_STATUSES = ['completed', 'finalized'];

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const buildRevenueBreakdown = (groupedPayments = []) => {
  const totals = groupedPayments.reduce((accumulator, payment) => {
    accumulator[payment.type] = Number(payment._sum.amount || 0);
    return accumulator;
  }, {});

  const boostRevenue = totals.boost || 0;
  const escrowRevenue = totals.escrow || 0;
  const queueSkipRevenue = totals.skip_queue || 0;
  const priorityAppRevenue = totals.priority_app || 0;
  const membershipRevenue = totals.membership || 0;
  const totalRevenue = boostRevenue + escrowRevenue + queueSkipRevenue + priorityAppRevenue + membershipRevenue;

  return {
    boostRevenue: formatCurrency(boostRevenue),
    escrowRevenue: formatCurrency(escrowRevenue),
    queueSkipRevenue: formatCurrency(queueSkipRevenue),
    priorityAppRevenue: formatCurrency(priorityAppRevenue),
    membershipRevenue: formatCurrency(membershipRevenue),
    totalRevenue: formatCurrency(totalRevenue),
  };
};

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, avatar: true, location: true, bio: true,
        isVerifiedBreeder: true, createdAt: true,
        _count: { select: { listings: true, reviewsReceived: true } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const avgRating = await prisma.review.aggregate({
      where: { sellerId: req.params.id },
      _avg: { rating: true }
    });

    // Response rate and time (mock for now, would be calculated from messages)
    res.json({
      ...user,
      listingsCount: user._count.listings,
      reviewsCount: user._count.reviewsReceived,
      avgRating: avgRating._avg.rating || 0,
      responseRate: '95%',
      responseTime: 'Under 1 hour'
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, location, phone, bio } = req.body;
    const data = {};
    if (name) data.name = name;
    if (location !== undefined) data.location = location;
    if (phone !== undefined) data.phone = phone;
    if (bio !== undefined) data.bio = bio;

    if (req.file) {
      data.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, email: true, avatar: true, location: true,
        phone: true, bio: true, isVerifiedBreeder: true, createdAt: true
      }
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const getAdminInsights = async (req, res, next) => {
  try {
    const isAdmin = req.user.email === 'admin@rehome.world';
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    if (isAdmin) {
      const [
        totalUsers,
        totalListings,
        listingsToday,
        listingsWeek,
        totalMessages,
        messagesToday,
        totalFavorites,
        activeListings,
        adoptedListings,
        revenueByType,
        pendingReviewCount,
        removedListingsCount,
        moderationListings,
        recentMessages,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.listing.count(),
        prisma.listing.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.listing.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.message.count(),
        prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.favorite.count(),
        prisma.listing.count({ where: { status: 'available' } }),
        prisma.listing.count({ where: { status: 'adopted' } }),
        prisma.payment.groupBy({
          by: ['type'],
          where: { status: { in: COMPLETED_PAYMENT_STATUSES } },
          _sum: { amount: true },
        }),
        prisma.listing.count({ where: { status: 'pending_review' } }),
        prisma.listing.count({ where: { status: 'removed' } }),
        prisma.listing.findMany({
          where: {
            status: { in: ['pending_review', 'removed'] },
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            petName: true,
            breed: true,
            status: true,
            location: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                isVerifiedBreeder: true,
              },
            },
          },
        }),
        prisma.message.findMany({
          where: {
            createdAt: { gte: weekAgo },
          },
          orderBy: { createdAt: 'desc' },
          take: 80,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } },
            listing: { select: { id: true, petName: true, breed: true } },
          },
        }),
      ]);

      const listingQueue = moderationListings
        .filter((listing) => listing.status === 'pending_review')
        .map((listing) => ({
          ...listing,
          flags: getListingModerationFlags({
            title: listing.petName,
            petName: listing.petName,
            breed: listing.breed,
            description: listing.description,
            location: listing.location,
          }),
        }))
        .slice(0, 8);

      const sellerWatchlist = Array.from(
        moderationListings.reduce((map, listing) => {
          const existing = map.get(listing.userId) || {
            userId: listing.userId,
            seller: listing.user,
            flaggedListings: 0,
            pendingReviewCount: 0,
            removedCount: 0,
            mostRecentFlaggedAt: listing.updatedAt,
            examples: [],
          };

          existing.flaggedListings += 1;
          if (listing.status === 'pending_review') existing.pendingReviewCount += 1;
          if (listing.status === 'removed') existing.removedCount += 1;
          if (new Date(listing.updatedAt).getTime() > new Date(existing.mostRecentFlaggedAt).getTime()) {
            existing.mostRecentFlaggedAt = listing.updatedAt;
          }
          if (existing.examples.length < 2) {
            existing.examples.push(`${listing.petName} (${listing.status.replace('_', ' ')})`);
          }

          map.set(listing.userId, existing);
          return map;
        }, new Map()).values()
      )
        .sort((a, b) => {
          if (b.flaggedListings !== a.flaggedListings) return b.flaggedListings - a.flaggedListings;
          return new Date(b.mostRecentFlaggedAt).getTime() - new Date(a.mostRecentFlaggedAt).getTime();
        })
        .slice(0, 6);

      const flaggedMessages = recentMessages
        .map((message) => {
          const flags = getMessageRiskFlags(message.content);
          return flags.length > 0 ? { ...message, flags } : null;
        })
        .filter(Boolean);
      const messageAlerts = flaggedMessages.slice(0, 8);

      return res.json({
        scope: 'admin',
        labels: {
          users: 'Total Users',
          listingsTotal: 'Total Listings',
          listingsActive: 'Active Listings',
          messages: 'Messages Sent',
          favorites: 'Total Favorites',
          listingsThisWeek: 'Listings This Week',
        },
        users: { total: totalUsers },
        listings: {
          total: totalListings,
          active: activeListings,
          adopted: adoptedListings,
          today: listingsToday,
          thisWeek: listingsWeek,
        },
        messages: { total: totalMessages, today: messagesToday },
        favorites: { total: totalFavorites },
        revenue: buildRevenueBreakdown(revenueByType),
        moderation: {
          pendingReviewCount,
          removedListingsCount,
          flaggedMessageCount: flaggedMessages.length,
          listingQueue,
          sellerWatchlist,
          messageAlerts,
        },
      });
    }

    const [
      interestedBuyers,
      totalListings,
      activeListings,
      listingsWeek,
      totalMessages,
      totalFavorites,
      revenueByType,
    ] = await Promise.all([
      prisma.message.findMany({
        where: {
          listing: { userId: req.user.id },
          senderId: { not: req.user.id },
        },
        distinct: ['senderId'],
        select: { senderId: true },
      }),
      prisma.listing.count({ where: { userId: req.user.id } }),
      prisma.listing.count({ where: { userId: req.user.id, status: 'available' } }),
      prisma.listing.count({ where: { userId: req.user.id, createdAt: { gte: weekAgo } } }),
      prisma.message.count({ where: { listing: { userId: req.user.id } } }),
      prisma.favorite.count({ where: { listing: { userId: req.user.id } } }),
      prisma.payment.groupBy({
        by: ['type'],
        where: {
          userId: req.user.id,
          status: { in: COMPLETED_PAYMENT_STATUSES },
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      scope: 'seller',
      labels: {
        users: 'Interested Buyers',
        listingsTotal: 'Your Listings',
        listingsActive: 'Active Listings',
        messages: 'Messages on Your Listings',
        favorites: 'Saves on Your Listings',
        listingsThisWeek: 'Listings This Week',
      },
      users: { total: interestedBuyers.length },
      listings: {
        total: totalListings,
        active: activeListings,
        adopted: Math.max(totalListings - activeListings, 0),
        today: 0,
        thisWeek: listingsWeek,
      },
      messages: { total: totalMessages, today: 0 },
      favorites: { total: totalFavorites },
      revenue: buildRevenueBreakdown(revenueByType),
    });
  } catch (err) {
    next(err);
  }
};
