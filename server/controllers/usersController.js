import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalListings, listingsToday, listingsWeek, listingsMonth,
           totalMessages, messagesToday, totalFavorites] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.listing.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.listing.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.favorite.count(),
    ]);

    // Revenue estimates (based on current volume)
    const activeListings = await prisma.listing.count({ where: { status: 'available' } });
    const adoptedListings = await prisma.listing.count({ where: { status: 'adopted' } });
    const avgPrice = await prisma.listing.aggregate({ _avg: { price: true } });

    res.json({
      users: { total: totalUsers },
      listings: {
        total: totalListings,
        active: activeListings,
        adopted: adoptedListings,
        today: listingsToday,
        thisWeek: listingsWeek,
        thisMonth: listingsMonth,
      },
      messages: { total: totalMessages, today: messagesToday },
      favorites: { total: totalFavorites },
      revenue: {
        estimatedBoostRevenue: `$${(totalListings * 0.15 * 15).toFixed(2)}`,
        estimatedEscrowFees: `$${(adoptedListings * (avgPrice._avg.price || 0) * 0.05).toFixed(2)}`,
        estimatedQueueSkips: `$${(totalMessages * 0.1 * 9).toFixed(2)}`,
        estimatedPriorityApps: `$${(totalMessages * 0.05 * 5).toFixed(2)}`,
      }
    });
  } catch (err) {
    next(err);
  }
};
