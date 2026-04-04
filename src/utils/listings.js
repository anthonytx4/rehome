import { decorateListingWithArtwork } from './listingArtwork.js';
import { resolveMediaList, resolveMediaUrl } from './media.js';

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

export function formatLotSize(lotSize) {
  const numericLotSize = Number(lotSize);
  if (!Number.isFinite(numericLotSize) || numericLotSize <= 1) return null;
  return numericLotSize;
}

const normalizeListingIdentityPart = (value) => String(value ?? '').trim().toLowerCase();

export function dedupeListings(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item) return false;

    const key = [
      normalizeListingIdentityPart(item.category),
      normalizeListingIdentityPart(item.name || item.petName || item.title),
    ].join('|');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeListing(rawListing) {
  if (!rawListing) return null;

  const category = normalizeMarketplaceCategory(rawListing.category, rawListing.species || rawListing.type);
  const seller = rawListing.seller || rawListing.user || null;
  const type = rawListing.species || rawListing.type || 'Listing';
  const name = rawListing.petName || rawListing.name || rawListing.title || type;
  const price = Number(rawListing.price ?? rawListing.fee ?? 0);
  const artworkListing = decorateListingWithArtwork({
    ...rawListing,
    category,
    species: rawListing.species || rawListing.type,
    type: rawListing.type || rawListing.species,
    name: rawListing.name || name,
    petName: rawListing.petName || name,
    title: rawListing.title || name,
  });

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
    image: resolveMediaUrl(artworkListing.image),
    images: resolveMediaList(artworkListing.images),
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
