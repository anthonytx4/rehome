import { PrismaClient } from '@prisma/client';
import { handleUpload } from '../middleware/upload.js';
import { decorateListingWithArtwork } from '../../src/utils/listingArtwork.js';
import { dedupeListings } from '../../src/utils/listings.js';

const prisma = new PrismaClient();

const normalizeCategoryValue = (value, species = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'pet' || normalized === 'pets') return 'pets';
  if (normalized === 'livestock') return 'livestock';
  if (normalized === 'supply' || normalized === 'supplies') return 'supplies';

  const normalizedSpecies = String(species || '').trim().toLowerCase();
  if (['dog', 'cat', 'bird', 'rabbit', 'reptile', 'small animal', 'guinea pig'].includes(normalizedSpecies)) {
    return 'pets';
  }
  if (['grooming', 'hygiene', 'healthcare', 'feeding'].includes(normalizedSpecies)) {
    return 'supplies';
  }
  return 'livestock';
};

const parseLotSize = (value) => {
  if (value === undefined || value === null || value === '') return 1;
  const direct = Number(value);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const matched = String(value).match(/\d+/);
  return matched ? Number(matched[0]) : 1;
};

const serializeListing = (listing, extras = {}) => {
  const decorated = decorateListingWithArtwork(listing);
  const { _count, ...rest } = decorated;
  return {
    ...rest,
    ...extras,
  };
};

export const getListings = async (req, res, next) => {
  try {
    const {
      category,
      species,
      breed,
      location,
      minPrice,
      maxPrice,
      gender,
      size,
      sort,
      page = 1,
      limit = 12,
      search,
    } = req.query;

    const where = { status: 'available' };

    if (category) {
      const normalizedCategory = normalizeCategoryValue(category, species);
      where.category = normalizedCategory === 'pets'
        ? { in: ['pet', 'pets'] }
        : normalizedCategory;
    }
    if (species && species !== 'all') where.species = species;
    if (breed) where.breed = { contains: breed, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (gender) where.gender = gender;
    if (size) where.size = size;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { petName: { contains: search, mode: 'insensitive' } },
        { breed: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { species: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, avatar: true, isVerifiedBreeder: true }
          },
          _count: { select: { favorites: true } }
        }
      }),
      prisma.listing.count({ where })
    ]);

    const parsed = listings.map(l => serializeListing(l, {
      favoritesCount: l._count.favorites,
    }));
    const uniqueListings = dedupeListings(parsed);

    res.json({
      listings: uniqueListings,
      total: uniqueListings.length,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, location: true, isVerifiedBreeder: true, createdAt: true,
            _count: { select: { reviewsReceived: true } }
          }
        },
        _count: { select: { favorites: true } }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get average rating for seller
    const avgRating = await prisma.review.aggregate({
      where: { sellerId: listing.userId },
      _avg: { rating: true }
    });

    res.json(serializeListing(listing, {
      favoritesCount: listing._count.favorites,
      seller: {
        ...listing.user,
        avgRating: avgRating._avg.rating || 0,
        reviewCount: listing.user._count.reviewsReceived
      }
    }));
  } catch (err) {
    next(err);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const {
      title,
      petName,
      species,
      breed,
      age,
      gender,
      size,
      description,
      price,
      location,
      vaccinated,
      neutered,
      category,
      listingType,
      lotSize,
      allowPartialSale,
      reservePrice,
      currentBid,
      auctionEndsAt,
    } = req.body;

    if (!petName || !species || !breed || !age || !gender || !description || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await handleUpload(file, 'listings');
        images.push(url);
      }
    }

    const listing = await prisma.listing.create({
      data: {
        title: title || `${petName} — ${breed}`,
        petName,
        species,
        breed,
        age,
        gender,
        size: size || 'Medium',
        description,
        price: parseFloat(price) || 0,
        location,
        category: normalizeCategoryValue(category, species),
        listingType: listingType || 'fixed',
        lotSize: parseLotSize(lotSize),
        allowPartialSale: allowPartialSale === 'true' || allowPartialSale === true,
        reservePrice: reservePrice ? parseFloat(reservePrice) : null,
        currentBid: currentBid ? parseFloat(currentBid) : null,
        auctionEndsAt: auctionEndsAt ? new Date(auctionEndsAt) : null,
        vaccinated: vaccinated === 'true' || vaccinated === true,
        neutered: neutered === 'true' || neutered === true,
        images: JSON.stringify(images),
        userId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } }
      }
    });

    res.status(201).json(serializeListing(listing));
  } catch (err) {
    next(err);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const data = {};
    const fields = [
      'title',
      'petName',
      'species',
      'breed',
      'age',
      'gender',
      'size',
      'description',
      'price',
      'location',
      'status',
      'vaccinated',
      'neutered',
      'listingType',
      'allowPartialSale',
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'price') data[f] = parseFloat(req.body[f]);
        else if (f === 'vaccinated' || f === 'neutered' || f === 'allowPartialSale') data[f] = req.body[f] === 'true' || req.body[f] === true;
        else data[f] = req.body[f];
      }
    });
    if (req.body.category !== undefined) {
      data.category = normalizeCategoryValue(req.body.category, req.body.species || listing.species);
    }
    if (req.body.lotSize !== undefined) {
      data.lotSize = parseLotSize(req.body.lotSize);
    }
    if (req.body.reservePrice !== undefined) {
      data.reservePrice = req.body.reservePrice ? parseFloat(req.body.reservePrice) : null;
    }
    if (req.body.currentBid !== undefined) {
      data.currentBid = req.body.currentBid ? parseFloat(req.body.currentBid) : null;
    }
    if (req.body.auctionEndsAt !== undefined) {
      data.auctionEndsAt = req.body.auctionEndsAt ? new Date(req.body.auctionEndsAt) : null;
    }

    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const url = await handleUpload(file, 'listings');
        newImages.push(url);
      }
      const existingImages = JSON.parse(listing.images);
      data.images = JSON.stringify([...existingImages, ...newImages]);
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } }
      }
    });

    res.json(serializeListing(updated));
  } catch (err) {
    next(err);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
};

export const getUserListings = async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } },
        _count: { select: { favorites: true } }
      }
    });

    const uniqueListings = dedupeListings(listings.map(l => serializeListing(l, {
      favoritesCount: l._count.favorites,
    })));

    res.json(uniqueListings);
  } catch (err) {
    next(err);
  }
};
