const getAssetOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  if (typeof globalThis !== 'undefined' && globalThis.process?.env?.CLIENT_URL) {
    return globalThis.process.env.CLIENT_URL;
  }

  if (typeof globalThis !== 'undefined' && globalThis.process?.env?.FRONTEND_URL) {
    return globalThis.process.env.FRONTEND_URL;
  }

  return 'http://localhost:5173';
};

const assetUrl = (path) => `${getAssetOrigin().replace(/\/$/, '')}${path}`;

const ASSET_POOLS = {
  dog: [assetUrl('/images/mock_dog_1775037305181.png'), assetUrl('/images/mock_dog_alt.svg')],
  cat: [assetUrl('/images/mock_cat_1775037291038.png'), assetUrl('/images/mock_cat_alt.svg')],
  bird: [assetUrl('/images/mock_bird_1775037276059.png'), assetUrl('/images/mock_bird_alt.svg')],
  rabbit: [assetUrl('/images/mock_rabbit.svg'), assetUrl('/images/mock_rabbit_alt.svg')],
  livestock: [assetUrl('/images/mock_livestock.svg'), assetUrl('/images/mock_livestock_alt.svg')],
  supplies: [assetUrl('/images/mock_supplies.svg'), assetUrl('/images/mock_supplies_alt.svg')],
};

const PALETTE = [
  ['#0F766E', '#22C55E'],
  ['#F59E0B', '#FB7185'],
  ['#0EA5E9', '#38BDF8'],
  ['#10B981', '#34D399'],
  ['#8B5CF6', '#A78BFA'],
  ['#E11D48', '#F97316'],
  ['#1D4ED8', '#38BDF8'],
  ['#7C3AED', '#EC4899'],
];

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

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

const getArtworkBucket = (listing = {}) => {
  const category = safeText(listing.category).toLowerCase();
  const type = safeText(listing.species || listing.type).toLowerCase();

  if (category === 'livestock') return 'livestock';
  if (category === 'supplies') return 'supplies';
  if (type.includes('dog')) return 'dog';
  if (type.includes('cat')) return 'cat';
  if (
    type.includes('bird') ||
    type.includes('poultry') ||
    type.includes('duck') ||
    type.includes('chicken') ||
    type.includes('turkey')
  ) {
    return 'bird';
  }
  if (type.includes('rabbit') || type.includes('guinea pig') || type.includes('ferret') || type.includes('hamster')) {
    return 'rabbit';
  }
  return category === 'pets' ? 'dog' : 'livestock';
};

const buildPattern = (seedHash) => {
  const patternIndex = seedHash % 5;
  const x1 = 40 + (seedHash % 180);
  const y1 = 40 + ((seedHash >> 3) % 140);
  const x2 = 500 + ((seedHash >> 6) % 220);
  const y2 = 300 + ((seedHash >> 9) % 180);
  const x3 = 120 + ((seedHash >> 12) % 260);
  const y3 = 180 + ((seedHash >> 15) % 220);

  switch (patternIndex) {
    case 0:
      return `
        <circle cx="${x1}" cy="${y1}" r="${70 + (seedHash % 48)}" fill="rgba(255,255,255,0.16)" />
        <circle cx="${x2}" cy="${y2}" r="${86 + ((seedHash >> 4) % 56)}" fill="rgba(255,255,255,0.08)" />
        <circle cx="${x3}" cy="${y3}" r="${44 + ((seedHash >> 7) % 28)}" fill="rgba(255,255,255,0.22)" />
      `;
    case 1:
      return `
        <rect x="${x1}" y="${y1}" width="${220 + (seedHash % 80)}" height="24" rx="12" transform="rotate(${seedHash % 28} 400 300)" fill="rgba(255,255,255,0.18)" />
        <rect x="${x3}" y="${y2}" width="${170 + ((seedHash >> 5) % 90)}" height="18" rx="9" transform="rotate(${12 + (seedHash % 18)} 400 300)" fill="rgba(255,255,255,0.12)" />
        <rect x="${x2 - 80}" y="${y3}" width="120" height="120" rx="32" fill="rgba(255,255,255,0.08)" />
      `;
    case 2:
      return `
        <circle cx="${x1}" cy="${y1}" r="${96 + (seedHash % 44)}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="16" />
        <circle cx="${x2}" cy="${y2}" r="${56 + ((seedHash >> 5) % 34)}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="12" />
        <circle cx="${x3}" cy="${y3}" r="${28 + ((seedHash >> 9) % 20)}" fill="rgba(255,255,255,0.2)" />
      `;
    case 3:
      return `
        <rect x="${x1}" y="${y1}" width="${120 + (seedHash % 100)}" height="${120 + ((seedHash >> 4) % 80)}" rx="28" fill="rgba(255,255,255,0.14)" />
        <rect x="${x2}" y="${y3}" width="${96 + ((seedHash >> 8) % 72)}" height="${96 + ((seedHash >> 11) % 72)}" rx="24" fill="rgba(255,255,255,0.1)" />
        <circle cx="${x3}" cy="${y2}" r="${42 + ((seedHash >> 6) % 24)}" fill="rgba(255,255,255,0.24)" />
      `;
    default:
      return `
        <path d="M 80 ${360 + (seedHash % 60)} C ${220 + (seedHash % 40)} ${240 + ((seedHash >> 4) % 50)}, ${360 + ((seedHash >> 7) % 40)} ${440 + ((seedHash >> 10) % 40)}, ${520 + ((seedHash >> 13) % 40)} ${300 + ((seedHash >> 16) % 40)}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="22" stroke-linecap="round" />
        <path d="M 120 ${160 + ((seedHash >> 5) % 90)} C ${260 + ((seedHash >> 8) % 50)} ${80 + ((seedHash >> 11) % 60)}, ${460 + ((seedHash >> 14) % 50)} ${260 + ((seedHash >> 17) % 50)}, ${700 - ((seedHash >> 3) % 80)} ${120 + ((seedHash >> 6) % 50)}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="16" stroke-linecap="round" />
        <circle cx="${x1}" cy="${y3}" r="${36 + ((seedHash >> 2) % 28)}" fill="rgba(255,255,255,0.22)" />
      `;
  }
};

export const buildListingArtwork = (listing = {}, variantSeed = 0) => {
  const bucket = getArtworkBucket(listing);
  const pool = ASSET_POOLS[bucket] || ASSET_POOLS.livestock;
  const seedSource = [
    safeText(listing.id),
    safeText(variantSeed),
    safeText(listing.petName || listing.name || listing.title),
    safeText(listing.species || listing.type),
    safeText(listing.breed),
    safeText(listing.category),
    safeText(listing.location),
    safeText(listing.price ?? listing.fee),
  ].join('|');
  const seedHash = hashString(seedSource);
  const [accent, accent2] = PALETTE[seedHash % PALETTE.length];
  const base = pool[hashString(`${seedSource}|base`) % pool.length];
  const categoryMark = escapeXml(safeText(listing.category || bucket, 'listing').toUpperCase());
  const title = escapeXml(safeText(listing.petName || listing.name || listing.title || listing.species || 'Listing'));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${accent2}" />
        </linearGradient>
        <clipPath id="clip">
          <rect x="26" y="26" width="748" height="548" rx="36" />
        </clipPath>
      </defs>
      <rect width="800" height="600" rx="40" fill="url(#bg)" />
      <g clip-path="url(#clip)">
        <image href="${base}" x="24" y="24" width="752" height="552" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
        <rect x="40" y="40" width="720" height="520" rx="28" fill="rgba(8,16,28,0.08)" />
        <rect x="46" y="46" width="708" height="508" rx="24" fill="rgba(255,255,255,0.04)" />
        ${buildPattern(seedHash)}
        <circle cx="${120 + (seedHash % 560)}" cy="${120 + ((seedHash >> 5) % 320)}" r="${28 + ((seedHash >> 9) % 42)}" fill="rgba(255,255,255,0.08)" />
        <circle cx="${80 + ((seedHash >> 7) % 640)}" cy="${80 + ((seedHash >> 11) % 380)}" r="${18 + ((seedHash >> 14) % 24)}" fill="rgba(255,255,255,0.16)" />
        <rect x="56" y="508" width="164" height="34" rx="17" fill="rgba(8,16,28,0.74)" />
        <text x="138" y="530" text-anchor="middle" font-size="14" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#FFFFFF">${categoryMark}</text>
      </g>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const decorateListingWithArtwork = (listing = {}) => {
  const imageCount = Math.min(3, Math.max(1, parseListingImages(listing.images).length || 1));
  const images = Array.from({ length: imageCount }, (_, index) => buildListingArtwork(listing, index));

  return {
    ...listing,
    image: images[0],
    images,
  };
};
