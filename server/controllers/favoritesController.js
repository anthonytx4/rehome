import { PrismaClient } from '@prisma/client';
import { decorateListingWithArtwork } from '../../src/utils/listingArtwork.js';

const prisma = new PrismaClient();

export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } },
            _count: { select: { favorites: true } }
          }
        }
      }
    });

    res.json(favorites.map(f => ({
      ...f,
      listing: {
        ...decorateListingWithArtwork(f.listing),
        favoritesCount: f.listing._count.favorites,
      }
    })));
  } catch (err) {
    next(err);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, listingId }
    });

    res.status(201).json(favorite);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Already favorited' });
    }
    next(err);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, listingId: req.params.listingId }
    });

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
};
