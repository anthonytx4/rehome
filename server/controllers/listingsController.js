import { PrismaClient } from '@prisma/client';
import { handleUpload } from '../middleware/upload.js';
import { decorateListingWithArtwork } from '../../src/utils/listingArtwork.js';
import {
  getListingModerationFlags,
  getListingQualityIssues,
  parseImageCollection,
  sanitizeText,
} from '../utils/marketplaceSafety.js';

const prisma = new PrismaClient();
const BOOST_PRIORITY = {
  featured: 1,
  urgent: 2,
};
const INTERNAL_REVIEW_STATUSES = new Set(['pending_review', 'removed']);
const USER_MANAGED_STATUSES = new Set(['available', 'adopted']);

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

const normalizeBoostType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return BOOST_PRIORITY[normalized] ? normalized : null;
};

const normalizeMoney = (value, { allowNull = false } = {}) => {
  if (value === undefined || value === null || value === '') return allowNull ? null : 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : (allowNull ? null : 0);
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true';
};

const normalizeSellerStatus = (value) => {
  const normalized = sanitizeText(value, { maxLength: 40 }).toLowerCase();
  return USER_MANAGED_STATUSES.has(normalized) ? normalized : null;
};

const buildListingModeration = ({ title, petName, breed, description, location, images, price }) => {
  const qualityIssues = getListingQualityIssues({ description, location, images, price });
  const moderationFlags = getListingModerationFlags({ title, petName, breed, description, location });
  return {
    qualityIssues,
    moderationFlags,
    requiresReview: moderationFlags.length > 0,
  };
};

const getBoostState = (listing, now = Date.now()) => {
  const boostType = normalizeBoostType(listing?.boostType);
  const boostExpiresAt = listing?.boostExpiresAt ? new Date(listing.boostExpiresAt) : null;
  const hasValidExpiry = boostExpiresAt && !Number.isNaN(boostExpiresAt.getTime());
  const isExpired = Boolean(boostType && (!hasValidExpiry || boostExpiresAt.getTime() <= now));
  const isActive = Boolean(boostType && hasValidExpiry && boostExpiresAt.getTime() > now);

  return {
    boostType: isActive ? boostType : null,
    boostExpiresAt: isActive ? boostExpiresAt : null,
    boostPriority: isActive ? BOOST_PRIORITY[boostType] : 0,
    isExpired,
  };
};

const cleanupExpiredBoosts = async (listings = []) => {
  const expiredIds = [...new Set(
    listings
      .filter((listing) => getBoostState(listing).isExpired)
      .map((listing) => listing.id)
      .filter(Boolean)
  )];

  if (expiredIds.length === 0) return;

  await prisma.listing.updateMany({
    where: { id: { in: expiredIds } },
    data: {
      boostType: null,
      boostExpiresAt: null,
    },
  });
};

const serializeListing = (listing, extras = {}) => {
  const boostState = getBoostState(listing);
  const decorated = decorateListingWithArtwork({
    ...listing,
    boostType: boostState.boostType,
    boostExpiresAt: boostState.boostExpiresAt,
  });
  const { _count, ...rest } = decorated;
  return {
    ...rest,
    boostType: boostState.boostType,
    boostExpiresAt: boostState.boostExpiresAt,
    ...extras,
  };
};

const rankListings = (listings = []) => listings
  .map((listing, index) => ({
    listing,
    index,
    boostState: getBoostState(listing),
  }))
  .sort((a, b) => {
    if (a.boostState.boostPriority !== b.boostState.boostPriority) {
      return b.boostState.boostPriority - a.boostState.boostPriority;
    }

    if (a.boostState.boostType && b.boostState.boostType) {
      const aExpires = a.boostState.boostExpiresAt?.getTime() ?? 0;
      const bExpires = b.boostState.boostExpiresAt?.getTime() ?? 0;
      if (aExpires !== bExpires) {
        return bExpires - aExpires;
      }
    }

    return a.index - b.index;
  })
  .map(({ listing }) => listing);

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

    await cleanupExpiredBoosts(listings);
    const rankedListings = rankListings(listings).map((listing) => serializeListing(listing, {
      favoritesCount: listing._count?.favorites ?? 0,
    }));

    res.json({
      listings: rankedListings,
      total,
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

    const isOwner = req.user?.id === listing.userId;
    const isAdmin = req.user?.email === 'admin@rehome.world';

    if (listing.status !== 'available' && !isOwner && !isAdmin) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await cleanupExpiredBoosts([listing]);

    // Get average rating for seller
    const avgRating = await prisma.review.aggregate({
      where: { sellerId: listing.userId },
      _avg: { rating: true }
    });

    const moderation = buildListingModeration({
      title: listing.title,
      petName: listing.petName,
      breed: listing.breed,
      description: listing.description,
      location: listing.location,
      images: parseImageCollection(listing.images),
      price: listing.price,
    });

    res.json(serializeListing(listing, {
      favoritesCount: listing._count.favorites,
      seller: {
        ...listing.user,
        avgRating: avgRating._avg.rating || 0,
        reviewCount: listing.user._count.reviewsReceived
      },
      moderation: (isOwner || isAdmin) ? moderation : undefined,
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

    const normalizedPetName = sanitizeText(petName || title, { maxLength: 160 });
    const normalizedSpecies = sanitizeText(species, { maxLength: 80 });
    const normalizedTitle = sanitizeText(title || normalizedPetName, { maxLength: 160 });
    const normalizedBreed = sanitizeText(breed || normalizedSpecies || 'General', { maxLength: 160 });
    const normalizedAge = sanitizeText(age || 'Unknown', { maxLength: 80 });
    const normalizedGender = sanitizeText(gender || 'Unknown', { maxLength: 40 });
    const normalizedSize = sanitizeText(size || 'Medium', { maxLength: 40 });
    const normalizedDescription = sanitizeText(description, { maxLength: 4000 });
    const normalizedLocation = sanitizeText(location, { maxLength: 160 });
    const normalizedListingType = sanitizeText(listingType || 'fixed', { maxLength: 40 }).toLowerCase();
    const normalizedCategory = normalizeCategoryValue(category, normalizedSpecies);
    const finalListingType = normalizedCategory === 'livestock'
      ? (normalizedListingType || 'fixed')
      : 'fixed';
    const parsedPrice = normalizeMoney(price);
    const parsedReservePrice = normalizeMoney(reservePrice, { allowNull: true });
    const parsedCurrentBid = normalizeMoney(currentBid, { allowNull: true });

    if (!normalizedPetName || !normalizedSpecies || !normalizedDescription || !normalizedLocation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await handleUpload(file, 'listings');
        images.push(url);
      }
    }

    const moderation = buildListingModeration({
      title: normalizedTitle,
      petName: normalizedPetName,
      breed: normalizedBreed,
      description: normalizedDescription,
      location: normalizedLocation,
      images,
      price: parsedPrice,
    });

    if (moderation.qualityIssues.length > 0) {
      return res.status(400).json({
        error: moderation.qualityIssues[0],
        issues: moderation.qualityIssues,
      });
    }

    if (finalListingType === 'auction') {
      const parsedAuctionEndsAt = auctionEndsAt ? new Date(auctionEndsAt) : null;
      if (!parsedAuctionEndsAt || Number.isNaN(parsedAuctionEndsAt.getTime()) || parsedAuctionEndsAt.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Auction listings need a valid future close date.' });
      }
    }

    const listing = await prisma.listing.create({
      data: {
        title: normalizedTitle || `${normalizedPetName} — ${normalizedBreed}`,
        petName: normalizedPetName,
        species: normalizedSpecies,
        breed: normalizedBreed,
        age: normalizedAge,
        gender: normalizedGender,
        size: normalizedSize,
        description: normalizedDescription,
        price: parsedPrice,
        location: normalizedLocation,
        category: normalizedCategory,
        listingType: finalListingType,
        lotSize: parseLotSize(lotSize),
        allowPartialSale: normalizeBoolean(allowPartialSale, true),
        reservePrice: finalListingType === 'auction' ? parsedReservePrice : null,
        currentBid: finalListingType === 'auction' ? parsedCurrentBid : null,
        auctionEndsAt: finalListingType === 'auction' && auctionEndsAt ? new Date(auctionEndsAt) : null,
        vaccinated: normalizeBoolean(vaccinated),
        neutered: normalizeBoolean(neutered),
        images: JSON.stringify(images),
        status: moderation.requiresReview ? 'pending_review' : 'available',
        userId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } }
      }
    });

    res.status(201).json(serializeListing(listing, {
      moderation,
    }));
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
    const hasBodyField = (field) => req.body[field] !== undefined;
    const nextTextValue = (field, fallback, maxLength) => (
      hasBodyField(field) ? sanitizeText(req.body[field], { maxLength }) : fallback
    );

    data.title = nextTextValue('title', listing.title, 160);
    data.petName = nextTextValue('petName', listing.petName, 160);
    data.species = nextTextValue('species', listing.species, 80);
    data.breed = nextTextValue('breed', listing.breed, 160);
    data.age = nextTextValue('age', listing.age, 80);
    data.gender = nextTextValue('gender', listing.gender, 40);
    data.size = nextTextValue('size', listing.size, 40);
    data.description = nextTextValue('description', listing.description, 4000);
    data.location = nextTextValue('location', listing.location, 160);

    if (hasBodyField('price')) data.price = normalizeMoney(req.body.price);
    if (hasBodyField('vaccinated')) data.vaccinated = normalizeBoolean(req.body.vaccinated, listing.vaccinated);
    if (hasBodyField('neutered')) data.neutered = normalizeBoolean(req.body.neutered, listing.neutered);
    if (hasBodyField('listingType')) data.listingType = sanitizeText(req.body.listingType, { maxLength: 40 }).toLowerCase() || listing.listingType;
    if (hasBodyField('allowPartialSale')) data.allowPartialSale = normalizeBoolean(req.body.allowPartialSale, listing.allowPartialSale);

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

    const requestedStatus = hasBodyField('status') ? normalizeSellerStatus(req.body.status) : null;
    if (hasBodyField('status') && !requestedStatus) {
      return res.status(400).json({ error: 'Invalid listing status' });
    }
    if (requestedStatus) {
      if (INTERNAL_REVIEW_STATUSES.has(listing.status)) {
        return res.status(409).json({ error: 'This listing is locked while moderation is in progress.' });
      }
      data.status = requestedStatus;
    }

    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const url = await handleUpload(file, 'listings');
        newImages.push(url);
      }
      const existingImages = parseImageCollection(listing.images);
      data.images = JSON.stringify([...existingImages, ...newImages]);
    }

    const nextImages = parseImageCollection(data.images ?? listing.images);
    const moderation = buildListingModeration({
      title: data.title ?? listing.title,
      petName: data.petName ?? listing.petName,
      breed: data.breed ?? listing.breed,
      description: data.description ?? listing.description,
      location: data.location ?? listing.location,
      images: nextImages,
      price: data.price ?? listing.price,
    });

    if (moderation.qualityIssues.length > 0) {
      return res.status(400).json({
        error: moderation.qualityIssues[0],
        issues: moderation.qualityIssues,
      });
    }

    const nextCategory = data.category ?? listing.category;
    const finalListingType = nextCategory === 'livestock'
      ? (data.listingType ?? listing.listingType)
      : 'fixed';

    data.listingType = finalListingType;

    if (finalListingType !== 'auction') {
      data.reservePrice = null;
      data.currentBid = null;
      data.auctionEndsAt = null;
    }

    if (
      finalListingType === 'auction'
      && (
        hasBodyField('auctionEndsAt')
        || hasBodyField('listingType')
        || !listing.auctionEndsAt
      )
    ) {
      const nextAuctionEndsAt = data.auctionEndsAt ?? listing.auctionEndsAt;
      const parsedAuctionEndsAt = nextAuctionEndsAt ? new Date(nextAuctionEndsAt) : null;
      if (!parsedAuctionEndsAt || Number.isNaN(parsedAuctionEndsAt.getTime()) || parsedAuctionEndsAt.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Auction listings need a valid future close date.' });
      }
    }

    if (listing.status === 'removed') {
      data.status = 'removed';
    } else if (listing.status === 'pending_review' || moderation.requiresReview) {
      data.status = 'pending_review';
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data,
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } }
      }
    });

    res.json(serializeListing(updated, {
      moderation,
    }));
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
    const canViewAllStatuses = req.user?.id === req.params.userId || req.user?.email === 'admin@rehome.world';
    const listings = await prisma.listing.findMany({
      where: {
        userId: req.params.userId,
        ...(canViewAllStatuses ? {} : { status: 'available' }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } },
        _count: { select: { favorites: true } }
      }
    });

    await cleanupExpiredBoosts(listings);
    const rankedListings = rankListings(listings).map((listing) => serializeListing(listing, {
      favoritesCount: listing._count?.favorites ?? 0,
    }));

    res.json(rankedListings);
  } catch (err) {
    next(err);
  }
};

export const moderateListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } },
        _count: { select: { favorites: true } },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const action = sanitizeText(req.body?.action, { maxLength: 40 }).toLowerCase();
    const nextStatus = action === 'approve'
      ? 'available'
      : action === 'review'
        ? 'pending_review'
        : action === 'remove'
          ? 'removed'
          : null;

    if (!nextStatus) {
      return res.status(400).json({ error: 'Invalid moderation action' });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listing.id },
      data: { status: nextStatus },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } },
        _count: { select: { favorites: true } },
      },
    });

    const moderation = buildListingModeration({
      title: updatedListing.title,
      petName: updatedListing.petName,
      breed: updatedListing.breed,
      description: updatedListing.description,
      location: updatedListing.location,
      images: parseImageCollection(updatedListing.images),
      price: updatedListing.price,
    });

    res.json({
      listing: serializeListing(updatedListing, {
        favoritesCount: updatedListing._count?.favorites ?? 0,
        moderation,
      }),
      action,
    });
  } catch (err) {
    next(err);
  }
};
