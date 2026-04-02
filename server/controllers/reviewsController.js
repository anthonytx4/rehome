import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getReviewsByUser = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { sellerId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } }
      }
    });

    const avg = await prisma.review.aggregate({
      where: { sellerId: req.params.userId },
      _avg: { rating: true },
      _count: true
    });

    res.json({ reviews, avgRating: avg._avg.rating || 0, count: avg._count });
  } catch (err) {
    next(err);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { sellerId, rating, comment } = req.body;

    if (!sellerId || !rating) {
      return res.status(400).json({ error: 'sellerId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (sellerId === req.user.id) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        reviewerId: req.user.id,
        sellerId
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};
