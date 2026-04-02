import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getListings = async (req, res, next) => {
  try {
    const { species, breed, location, minPrice, maxPrice, gender, size, age, sort, page = 1, limit = 12, search } = req.query;

    const where = { status: 'available' };

    if (species && species !== 'all') where.species = species;
    if (breed) where.breed = { contains: breed };
    if (location) where.location = { contains: location };
    if (gender) where.gender = gender;
    if (size) where.size = size;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
      where.OR = [
        { petName: { contains: search } },
        { breed: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
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

    const parsed = listings.map(l => ({
      ...l,
      images: JSON.parse(l.images),
      favoritesCount: l._count.favorites,
      _count: undefined
    }));

    res.json({
      listings: parsed,
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

    // Get average rating for seller
    const avgRating = await prisma.review.aggregate({
      where: { sellerId: listing.userId },
      _avg: { rating: true }
    });

    res.json({
      ...listing,
      images: JSON.parse(listing.images),
      favoritesCount: listing._count.favorites,
      seller: {
        ...listing.user,
        avgRating: avgRating._avg.rating || 0,
        reviewCount: listing.user._count.reviewsReceived
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const { title, petName, species, breed, age, gender, size, description, price, location, vaccinated, neutered } = req.body;

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
        vaccinated: vaccinated === 'true' || vaccinated === true,
        neutered: neutered === 'true' || neutered === true,
        images: JSON.stringify(images),
        userId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, isVerifiedBreeder: true } }
      }
    });

    res.status(201).json({ ...listing, images: JSON.parse(listing.images) });
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
    const fields = ['title', 'petName', 'species', 'breed', 'age', 'gender', 'size', 'description', 'price', 'location', 'status', 'vaccinated', 'neutered'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'price') data[f] = parseFloat(req.body[f]);
        else if (f === 'vaccinated' || f === 'neutered') data[f] = req.body[f] === 'true' || req.body[f] === true;
        else data[f] = req.body[f];
      }
    });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
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

    res.json({ ...updated, images: JSON.parse(updated.images) });
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

    res.json(listings.map(l => ({
      ...l,
      images: JSON.parse(l.images),
      favoritesCount: l._count.favorites
    })));
  } catch (err) {
    next(err);
  }
};
