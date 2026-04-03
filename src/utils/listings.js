const DOG_IMAGE = '/images/mock_dog_1775037305181.png';
const CAT_IMAGE = '/images/mock_cat_1775037291038.png';
const BIRD_IMAGE = '/images/mock_bird_1775037276059.png';

const PET_SPECIES = new Set([
  'dog',
  'cat',
  'bird',
  'rabbit',
  'guinea pig',
  'guinea pigs',
  'reptile',
  'small animal',
  'small animals',
  'hamster',
  'ferret',
]);

const SUPPLY_SPECIES = new Set([
  'grooming',
  'hygiene',
  'healthcare',
  'feeding',
  'bedding',
  'crate',
  'crates',
  'coop',
  'coops',
  'fencing',
  'waterer',
  'waterers',
  'supplement',
  'supplements',
  'tool',
  'tools',
]);

const parseListingImages = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
  } catch {
    return [value];
  }

  return [];
};

export function normalizeMarketplaceCategory(category, species = '') {
  const normalizedCategory = String(category || '').trim().toLowerCase();
  if (normalizedCategory === 'pet' || normalizedCategory === 'pets') return 'pets';
  if (normalizedCategory === 'livestock') return 'livestock';
  if (normalizedCategory === 'supply' || normalizedCategory === 'supplies') return 'supplies';

  const normalizedSpecies = String(species || '').trim().toLowerCase();
  if (PET_SPECIES.has(normalizedSpecies)) return 'pets';
  if (SUPPLY_SPECIES.has(normalizedSpecies)) return 'supplies';
  return 'livestock';
}

export function getFallbackImage(species = '', category = 'pets') {
  const normalizedSpecies = String(species || '').trim().toLowerCase();
  if (normalizedSpecies.includes('cat')) return CAT_IMAGE;
  if (
    normalizedSpecies.includes('bird') ||
    normalizedSpecies.includes('poultry') ||
    normalizedSpecies.includes('duck') ||
    normalizedSpecies.includes('chicken')
  ) {
    return BIRD_IMAGE;
  }
  if (category === 'supplies') return DOG_IMAGE;
  return DOG_IMAGE;
}

export function formatLotSize(lotSize) {
  const numericLotSize = Number(lotSize);
  if (!Number.isFinite(numericLotSize) || numericLotSize <= 1) return null;
  return `Lot of ${numericLotSize}`;
}

export function normalizeListing(rawListing) {
  if (!rawListing) return null;

  const images = parseListingImages(rawListing.images);
  const category = normalizeMarketplaceCategory(rawListing.category, rawListing.species || rawListing.type);
  const seller = rawListing.seller || rawListing.user || null;
  const type = rawListing.species || rawListing.type || 'Listing';
  const name = rawListing.petName || rawListing.name || rawListing.title || type;
  const price = Number(rawListing.price ?? rawListing.fee ?? 0);
  const fallbackImage = rawListing.image || getFallbackImage(type, category);

  return {
    id: rawListing.id,
    name,
    title: rawListing.title || name,
    type,
    breed: rawListing.breed || type,
    age: rawListing.age || 'Unknown age',
    gender: rawListing.gender || 'Unknown',
    location: rawListing.location || 'Location unavailable',
    description: rawListing.description || `${name} is available on Rehome.`,
    fee: Number.isFinite(price) ? price : 0,
    verified: seller?.isVerifiedBreeder ?? rawListing.verified ?? false,
    isPremium: Boolean(rawListing.boostType || rawListing.isPremium),
    image: images[0] || fallbackImage,
    images: images.length ? images : [fallbackImage],
    category,
    listingType: rawListing.listingType || 'fixed',
    lotSize: formatLotSize(rawListing.lotSize),
    currentBid: rawListing.currentBid ?? null,
    bidCount: rawListing.bidCount ?? 0,
    auctionEndsAt: rawListing.auctionEndsAt || rawListing.auctionEndAt || null,
    status: rawListing.status || 'available',
    sellerId: rawListing.userId || seller?.id || null,
    sellerName: seller?.name || null,
    seller,
    raw: rawListing,
  };
}
