import React, { useDeferredValue, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import PetCard from './PetCard';
import PetDetailModal from './PetDetailModal';
import AdSenseUnit from './ads/AdSenseUnit';
import styles from './PetGallery.module.css';
import { dedupeListings, normalizeListing } from '../utils/listings';

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

// Stable local demo artwork for marketplace fallbacks.

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const artworkPools = {
  dog: ['/images/mock_dog_1775037305181.png', '/images/mock_dog_alt.svg'],
  cat: ['/images/mock_cat_1775037291038.png', '/images/mock_cat_alt.svg'],
  bird: ['/images/mock_bird_1775037276059.png', '/images/mock_bird_alt.svg'],
  rabbit: ['/images/mock_rabbit.svg', '/images/mock_rabbit_alt.svg'],
  livestock: ['/images/mock_livestock.svg', '/images/mock_livestock_alt.svg'],
  supplies: ['/images/mock_supplies.svg', '/images/mock_supplies_alt.svg'],
};

const getArtworkPoolKey = (pet) => {
  const category = safeText(pet.category).toLowerCase();
  const type = safeText(pet.type).toLowerCase();

  if (category === 'livestock') return 'livestock';
  if (category === 'supplies') return 'supplies';
  if (type.includes('dog')) return 'dog';
  if (type.includes('cat')) return 'cat';
  if (type.includes('bird') || type.includes('poultry') || type.includes('duck') || type.includes('chicken')) return 'bird';
  if (type.includes('rabbit')) return 'rabbit';
  return category === 'pets' ? 'dog' : 'livestock';
};

const makeMockArtwork = (pet, index) => {
  const palette = [
    ['#F59E0B', '#FB7185'],
    ['#0EA5E9', '#38BDF8'],
    ['#10B981', '#34D399'],
    ['#8B5CF6', '#A78BFA'],
    ['#E11D48', '#F97316'],
    ['#0F766E', '#22C55E'],
  ];
  const artworkKey = getArtworkPoolKey(pet);
  const pool = artworkPools[artworkKey] || artworkPools.livestock;
  const [accent, accent2] = palette[hashString(`${safeText(pet.name)}|${safeText(pet.type)}|${index}`) % palette.length];
  const base = pool[hashString(`${safeText(pet.name)}|${safeText(pet.type)}|${index}|base`) % pool.length];
  const title = escapeXml(safeText(pet.name, 'Listing'));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${accent2}" />
        </linearGradient>
        <clipPath id="cardClip">
          <rect x="26" y="26" width="748" height="548" rx="36" />
        </clipPath>
      </defs>
      <rect width="800" height="600" rx="40" fill="url(#bg)" />
      <g clip-path="url(#cardClip)">
        <image href="${base}" x="28" y="28" width="744" height="392" preserveAspectRatio="xMidYMid slice" opacity="0.95" />
        <circle cx="650" cy="142" r="72" fill="rgba(255,255,255,0.18)" />
        <circle cx="150" cy="132" r="50" fill="rgba(255,255,255,0.12)" />
        <circle cx="640" cy="470" r="128" fill="rgba(255,255,255,0.08)" />
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const mockPetBlueprints = [
  { name: 'Cooper', type: 'Dog', breed: 'Golden Retriever', age: '3 Months', gender: 'Male', location: 'Austin, TX', fee: 450, verified: true, isPremium: true },
  { name: 'Luna', type: 'Cat', breed: 'Calico', age: '2 Years', gender: 'Female', location: 'Seattle, WA', fee: 100, verified: true, isPremium: true },
  { name: 'Rio', type: 'Bird', breed: 'Macaw', age: '5 Years', gender: 'Male', location: 'Miami, FL', fee: 800, verified: false, isPremium: false },
  { name: 'Milo', type: 'Dog', breed: 'Cocker Spaniel', age: '1 Year', gender: 'Male', location: 'Nashville, TN', fee: 620, verified: true, isPremium: false },
  { name: 'Pearl', type: 'Cat', breed: 'Russian Blue', age: '18 Months', gender: 'Female', location: 'Portland, OR', fee: 945, verified: true, isPremium: true },
  { name: 'Bluebell', type: 'Bird', breed: 'Cockatiel', age: '2 Years', gender: 'Male', location: 'Phoenix, AZ', fee: 320, verified: true, isPremium: false },
  { name: 'Biscuit', type: 'Dog', breed: 'Beagle', age: '9 Months', gender: 'Female', location: 'Dallas, TX', fee: 740, verified: true, isPremium: false },
  { name: 'Sable', type: 'Cat', breed: 'Tuxedo', age: '4 Years', gender: 'Female', location: 'Milwaukee, WI', fee: 280, verified: false, isPremium: false },
  { name: 'Comet', type: 'Rabbit', breed: 'Holland Lop', age: '10 Months', gender: 'Male', location: 'Madison, WI', fee: 215, verified: true, isPremium: false },
  { name: 'Juniper', type: 'Dog', breed: 'Australian Shepherd', age: '14 Months', gender: 'Female', location: 'Boise, ID', fee: 1320, verified: true, isPremium: true },
  { name: 'Taffy', type: 'Cat', breed: 'Maine Coon', age: '7 Months', gender: 'Female', location: 'Charleston, SC', fee: 1485, verified: true, isPremium: true },
  { name: 'Mosaic', type: 'Bird', breed: 'Sun Conure', age: '15 Months', gender: 'Female', location: 'Orlando, FL', fee: 890, verified: false, isPremium: true },
  { name: 'Ember', type: 'Dog', breed: 'Miniature Poodle', age: '2 Years', gender: 'Male', location: 'San Antonio, TX', fee: 1250, verified: true, isPremium: false },
  { name: 'Velvet', type: 'Cat', breed: 'Ragdoll', age: '16 Months', gender: 'Female', location: 'Minneapolis, MN', fee: 975, verified: true, isPremium: false },
  { name: 'Tilly', type: 'Rabbit', breed: 'Mini Rex', age: '1 Year', gender: 'Female', location: 'Reno, NV', fee: 180, verified: false, isPremium: false },
  { name: 'Cedar', type: 'Bird', breed: 'Parakeet Pair', age: '8 Months', gender: 'Pair', location: 'Tampa, FL', fee: 190, verified: true, isPremium: false },
  { name: 'Nectar', type: 'Dog', breed: 'Labrador Retriever', age: '10 Months', gender: 'Female', location: 'Baton Rouge, LA', fee: 1100, verified: true, isPremium: true },
  { name: 'Orbit', type: 'Cat', breed: 'British Shorthair', age: '2 Years', gender: 'Male', location: 'Salt Lake City, UT', fee: 1125, verified: true, isPremium: false },
  { name: 'Poppy', type: 'Rabbit', breed: 'Angora', age: '10 Months', gender: 'Female', location: 'Bozeman, MT', fee: 235, verified: false, isPremium: false },
  { name: 'Sky', type: 'Bird', breed: 'Quaker Pair', age: '2 Years', gender: 'Pair', location: 'Charlotte, NC', fee: 620, verified: true, isPremium: false },
];

const extraMockPetBlueprints = [
  { name: 'Fern', type: 'Dog', breed: 'Pembroke Welsh Corgi', age: '11 Months', gender: 'Female', location: 'Bend, OR', fee: 980, verified: true, isPremium: false },
  { name: 'Rocco', type: 'Dog', breed: 'Border Collie', age: '2 Years', gender: 'Male', location: 'Columbia, SC', fee: 760, verified: true, isPremium: false },
  { name: 'Saffron', type: 'Cat', breed: 'Sphynx', age: '1 Year', gender: 'Female', location: 'Phoenix, AZ', fee: 1320, verified: true, isPremium: true },
  { name: 'Juno', type: 'Cat', breed: 'Persian', age: '3 Years', gender: 'Female', location: 'Providence, RI', fee: 640, verified: true, isPremium: false },
  { name: 'Mango', type: 'Rabbit', breed: 'Lionhead', age: '8 Months', gender: 'Male', location: 'Boulder, CO', fee: 225, verified: true, isPremium: false },
  { name: 'Bramble', type: 'Rabbit', breed: 'Netherland Dwarf', age: '10 Months', gender: 'Female', location: 'Eugene, OR', fee: 190, verified: true, isPremium: false },
  { name: 'Tala', type: 'Bird', breed: 'Lovebird Pair', age: '9 Months', gender: 'Pair', location: 'Tampa, FL', fee: 280, verified: true, isPremium: false },
  { name: 'Pip', type: 'Bird', breed: 'Canary Trio', age: '7 Months', gender: 'Trio', location: 'Raleigh, NC', fee: 165, verified: false, isPremium: false },
  { name: 'Dot', type: 'Guinea Pig', breed: 'Peruvian Pair', age: '5 Months', gender: 'Pair', location: 'Madison, WI', fee: 130, verified: true, isPremium: false },
  { name: 'Nova', type: 'Ferret', breed: 'Sable Ferret', age: '1 Year', gender: 'Female', location: 'Denver, CO', fee: 310, verified: true, isPremium: false },
];

const mockPets = [...mockPetBlueprints, ...extraMockPetBlueprints].map((pet, index) => {
  const image = makeMockArtwork(pet, index);
  return {
    id: index + 1,
    ...pet,
    category: 'pets',
    image,
    images: [image],
  };
});

const buildMockCatalog = (families, variants, category, idBase) => families.flatMap((family, familyIndex) => variants.map((variant, variantIndex) => {
  const index = familyIndex * variants.length + variantIndex;
  const price = family.fee + (variant.feeDelta || 0);
  const item = {
    id: idBase + index,
    title: `${family.name} - ${family.breed}`,
    name: `${family.name} - ${family.breed}`,
    type: family.type,
    breed: family.breed,
    age: variant.age || family.age,
    gender: variant.gender || family.gender,
    location: variant.location || family.location,
    fee: price,
    verified: family.verified,
    isPremium: family.isPremium,
    category,
    lotLabel: variant.suffix || null,
    listingType: family.listingType || 'fixed',
    lotSize: variant.lotSize || family.lotSize || null,
    currentBid: variant.currentBid || null,
    bidCount: variant.bidCount || 0,
    description: `${variant.lead} ${family.care} ${variant.fit}`.trim(),
  };
  const image = makeMockArtwork(item, index + idBase);
  return {
    ...item,
    image,
    images: [image],
  };
}));

const livestockFamilies = [
  {
    name: 'Maribel',
    type: 'Cattle',
    breed: 'Jersey Milk Cow',
    age: '3 Years',
    gender: 'Female',
    location: 'Fresno, CA',
    fee: 6850,
    verified: true,
    isPremium: true,
    listingType: 'auction',
    lotSize: 1,
    care: 'She is used to a twice-daily milking rhythm, calm handling, and easy trailer loading.',
    fit: 'A practical fit for a small dairy that wants a dependable cow with a gentle barn-side manner.',
  },
  {
    name: 'Bramble',
    type: 'Cattle',
    breed: 'Black Angus Heifer',
    age: '16 Months',
    gender: 'Female',
    location: 'Omaha, NE',
    fee: 5200,
    verified: true,
    isPremium: true,
    listingType: 'auction',
    lotSize: 1,
    care: 'She moves cleanly through gates, settles quickly in a lot, and keeps a steady feed routine.',
    fit: 'A solid ranch pick for buyers who want a calm beef animal with room to finish out well.',
  },
  {
    name: 'Nora',
    type: 'Cattle',
    breed: 'Highland Heifer',
    age: '2 Years',
    gender: 'Female',
    location: 'Asheville, NC',
    fee: 9100,
    verified: true,
    isPremium: true,
    listingType: 'auction',
    lotSize: 1,
    care: 'Her thick coat and easy walk make her comfortable in wet weather, brush, and regular herd movement.',
    fit: 'Best for a farm that wants a hardy, showy heifer with a very steady pasture temperament.',
  },
  {
    name: 'Pine',
    type: 'Goat',
    breed: 'Nubian Doe',
    age: '2 Years',
    gender: 'Female',
    location: 'Raleigh, NC',
    fee: 430,
    verified: true,
    isPremium: false,
    listingType: 'auction',
    lotSize: 1,
    care: 'She is herd-socialized, comfortable at the stanchion, and used to browse, grain, and daily checks.',
    fit: 'A good choice for a small dairy setup that wants a personable doe with long ears and a bright voice.',
  },
  {
    name: 'Sage',
    type: 'Goat',
    breed: 'Boer Wether',
    age: '10 Months',
    gender: 'Male',
    location: 'Tulsa, OK',
    fee: 280,
    verified: true,
    isPremium: false,
    listingType: 'auction',
    lotSize: 1,
    care: 'He is vaccinated, easy to lead, and accustomed to brush lines, gates, and a simple feed bucket.',
    fit: 'A practical fit for brush control, 4-H practice, or a low-key companion goat project.',
  },
  {
    name: 'Pearl',
    type: 'Poultry',
    breed: 'Pekin Duck Pair',
    age: '4 Months',
    gender: 'Pair',
    location: 'Baton Rouge, LA',
    fee: 120,
    verified: true,
    isPremium: false,
    listingType: 'auction',
    lotSize: 2,
    care: 'They are healthy, used to water dishes, and comfortable with a backyard trough or small pond.',
    fit: 'A friendly pair for someone who wants ducks that settle fast and still feel practical.',
  },
  {
    name: 'Willow',
    type: 'Poultry',
    breed: 'Rhode Island Red Trio',
    age: '6 Months',
    gender: 'Female',
    location: 'Austin, TX',
    fee: 145,
    verified: false,
    isPremium: false,
    listingType: 'auction',
    lotSize: 3,
    care: 'They are coop trained, easy to feed, and already comfortable with roosts and daily opening checks.',
    fit: 'A dependable starter trio for a backyard flock that wants strong layers and low fuss.',
  },
  {
    name: 'Meadow',
    type: 'Sheep',
    breed: 'Katahdin Lamb Pair',
    age: '5 Months',
    gender: 'Pair',
    location: 'Lincoln, NE',
    fee: 260,
    verified: true,
    isPremium: false,
    listingType: 'auction',
    lotSize: 2,
    care: 'They are low-maintenance lambs that handle hay, mineral blocks, and light sorting without stress.',
    fit: 'A good fit for a small acreage buyer who wants practical sheep without a wool-heavy routine.',
  },
  {
    name: 'Juniper',
    type: 'Alpaca',
    breed: 'Huacaya Pair',
    age: '2 Years',
    gender: 'Pair',
    location: 'Durango, CO',
    fee: 2400,
    verified: true,
    isPremium: false,
    listingType: 'auction',
    lotSize: 2,
    care: 'They are halter trained, used to pasture rotation, and calm around routine shearing days.',
    fit: 'A good fit for a fiber farm or a homestead that wants a quiet, watchful herd presence.',
  },
  {
    name: 'Ash',
    type: 'Donkey',
    breed: 'Miniature Donkey Jenny',
    age: '4 Years',
    gender: 'Female',
    location: 'Murray, KY',
    fee: 1350,
    verified: true,
    isPremium: false,
    listingType: 'auction',
    lotSize: 1,
    care: 'She is halter trained, vaccinated, and comfortable around goats, chickens, and daily farm traffic.',
    fit: 'A personable guardian-style companion for a small farm that wants something alert and steady.',
  },
];

const livestockVariants = [
  {
    suffix: 'Morning Lot',
    lead: 'This listing is set up for buyers who want a smooth start to the day and a calm animal at first handling.',
    feeDelta: 0,
  },
  {
    suffix: 'Pasture Lot',
    lead: 'This version leans toward pasture use, with an animal that settles into open-air work and regular movement.',
    feeDelta: 220,
  },
  {
    suffix: 'Evening Lot',
    lead: 'This listing favors quieter barn routines and a steadier pace during end-of-day checks.',
    feeDelta: 420,
  },
];

const suppliesFamilies = [
  {
    name: 'CleanSweep',
    type: 'Hygiene',
    breed: 'Sanitizer Spray',
    age: 'New',
    gender: 'Case',
    location: 'Phoenix, AZ',
    fee: 64,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    lotSize: 12,
    care: 'It is easy to spray, quick to wipe, and built for repeat cleanup between pens and carriers.',
    fit: 'A clean foundation for any kennel, coop, or barn that needs a dependable sanitation routine.',
  },
  {
    name: 'RidgeCut',
    type: 'Grooming',
    breed: 'Hoof Trimmer Kit',
    age: 'New',
    gender: 'Kit',
    location: 'Bozeman, MT',
    fee: 96,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'The kit keeps hoof care tools together so trims feel less rushed and a lot more organized.',
    fit: 'Best for keepers who want to stay ahead of maintenance instead of waiting for a problem.',
  },
  {
    name: 'VetVest',
    type: 'Healthcare',
    breed: 'First Aid Rollout',
    age: 'New',
    gender: 'Kit',
    location: 'Kansas City, MO',
    fee: 58,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'It keeps wrap, gauze, and small tools together so you are not hunting around during an injury scare.',
    fit: 'A sensible safety purchase for breeders and homesteads that like to be prepared.',
  },
  {
    name: 'MilkMate',
    type: 'Feeding',
    breed: 'Stainless Pail Set',
    age: 'New',
    gender: 'Set',
    location: 'Fresno, CA',
    fee: 88,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'The pails rinse clean, stack neatly, and hold up to daily milking or feeding work.',
    fit: 'A practical fit for goat and cow owners who want durable, washable gear.',
  },
  {
    name: 'FeatherFlow',
    type: 'Housing',
    breed: 'Auto Coop Door',
    age: 'New',
    gender: 'Unit',
    location: 'Athens, GA',
    fee: 189,
    verified: true,
    isPremium: true,
    listingType: 'fixed',
    care: 'It opens on schedule and closes when the light drops, which saves a lot of early-morning and evening steps.',
    fit: 'A smart upgrade for poultry keepers who want safer nights and fewer manual chores.',
  },
  {
    name: 'MossLine',
    type: 'Hardware',
    breed: 'Fence Energizer',
    age: 'New',
    gender: 'Unit',
    location: 'Billings, MT',
    fee: 240,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'It keeps the perimeter honest and is built for steady output on a working fence line.',
    fit: 'A useful core tool for anyone managing goats, cattle, or rotating pasture animals.',
  },
  {
    name: 'FeedVault',
    type: 'Storage',
    breed: 'Seal Bin',
    age: 'New',
    gender: 'Unit',
    location: 'Madison, WI',
    fee: 146,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'It keeps grain dry, clean, and away from curious pests while making bulk feed easier to manage.',
    fit: 'A solid storage piece for barns and feed rooms that need less mess and better order.',
  },
  {
    name: 'CoopCart',
    type: 'Transport',
    breed: 'Rolling Feed Tote',
    age: 'New',
    gender: 'Unit',
    location: 'Charlotte, NC',
    fee: 129,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'The cart rolls smoothly and holds enough to reduce back-and-forth trips between storage and pens.',
    fit: 'A good choice for anyone who moves supplies constantly and wants fewer repeated hauls.',
  },
  {
    name: 'ColostrumVault',
    type: 'Nutrition',
    breed: 'Starter Kit',
    age: 'New',
    gender: 'Kit',
    location: 'Murray, KY',
    fee: 62,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    care: 'It is designed for newborn calves, kids, or lambs that need a stronger first week on the ground.',
    fit: 'A smart backup for farms that like to keep the essentials ready before a rough delivery day arrives.',
  },
  {
    name: 'PawTrace',
    type: 'Tracking',
    breed: 'GPS Collar Bundle',
    age: 'New',
    gender: 'Pack',
    location: 'Seattle, WA',
    fee: 149,
    verified: true,
    isPremium: false,
    listingType: 'fixed',
    lotSize: 2,
    care: 'The collars are light, rechargeable, and meant to keep curious animals a little easier to follow.',
    fit: 'Best for homes with clever pets or pasture helpers that like to wander farther than they should.',
  },
];

const supplyVariants = [
  {
    suffix: 'Starter Run',
    lead: 'This version is set up for an easy first install and a straightforward daily workflow.',
    feeDelta: 0,
  },
  {
    suffix: 'Field Pack',
    lead: 'This version is tuned for heavier use and a little more wear and tear around the barn.',
    feeDelta: 18,
  },
];

const mockLivestock = buildMockCatalog(livestockFamilies, livestockVariants, 'livestock', 100);
const mockSupplies = buildMockCatalog(suppliesFamilies, supplyVariants, 'supplies', 200);

const mockMarketplaceListings = {
  pets: mockPets,
  livestock: mockLivestock,
  supplies: mockSupplies,
};

const marketplaceMinimums = {
  pets: 30,
  livestock: 30,
  supplies: 20,
};

const categoryMaps = {
  'pets': ['All Pets', 'Dogs', 'Cats', 'Birds', 'Reptiles', 'Other'],
  'livestock': ['All Livestock', 'Cattle', 'Horses', 'Poultry', 'Sheep', 'Other'],
  'supplies': ['All Supplies', 'Hygiene', 'Grooming', 'Healthcare', 'Feeding', 'Other']
};

const matchesActiveCategory = (item, activeCategory, marketplaceContext) => {
  if (activeCategory.startsWith('All')) return true;

  const type = safeText(item.type).toLowerCase();
  switch (marketplaceContext) {
    case 'pets':
      if (activeCategory === 'Dogs') return type === 'dog';
      if (activeCategory === 'Cats') return type === 'cat';
      if (activeCategory === 'Birds') return type === 'bird';
      if (activeCategory === 'Reptiles') return type.includes('reptile');
      if (activeCategory === 'Other') return !['dog', 'cat', 'bird'].includes(type) && !type.includes('reptile');
      return false;
    case 'livestock':
      if (activeCategory === 'Cattle') return type.includes('cattle') || type.includes('cow');
      if (activeCategory === 'Horses') return type.includes('horse');
      if (activeCategory === 'Poultry') return ['poultry', 'chicken', 'duck', 'turkey'].some((value) => type.includes(value));
      if (activeCategory === 'Sheep') return ['sheep', 'goat'].some((value) => type.includes(value));
      if (activeCategory === 'Other') {
        return !['cattle', 'cow', 'horse', 'poultry', 'chicken', 'duck', 'turkey', 'sheep', 'goat'].some((value) => type.includes(value));
      }
      return false;
    case 'supplies':
      if (activeCategory === 'Hygiene') return type.includes('hygiene');
      if (activeCategory === 'Grooming') return type.includes('grooming');
      if (activeCategory === 'Healthcare') return type.includes('healthcare');
      if (activeCategory === 'Feeding') return type.includes('feeding') || type.includes('feed');
      if (activeCategory === 'Other') {
        return !['hygiene', 'grooming', 'healthcare', 'feeding', 'feed'].some((value) => type.includes(value));
      }
      return false;
    default:
      return true;
  }
};

const PetGallery = ({ searchQuery = '', onPostAction, overrideType = '' }) => {
  const location = useLocation();
  const path = location.pathname;
  const urlMarketplace = path === '/livestock' ? 'livestock' : path === '/supplies' ? 'supplies' : 'pets';
  const marketplaceContext = (overrideType || urlMarketplace).toLowerCase();
  const categories = categoryMaps[marketplaceContext] || categoryMaps['pets'];
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setActiveCat(categories[0]);
    setSelectedPet(null);
  }, [categories, marketplaceContext]);

  useEffect(() => {
    let cancelled = false;

    const loadListings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/listings', {
          params: {
            category: marketplaceContext,
            limit: 100,
          },
        });
        if (cancelled) return;
        const liveListings = (res.data.listings || []).map(normalizeListing).filter(Boolean);
        setListings(liveListings);
        setError(null);
      } catch {
        if (cancelled) return;
        setError('Live listings are temporarily unavailable. Showing curated demo content instead.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [marketplaceContext, reloadToken]);

  const liveMarketplaceListings = dedupeListings(listings.filter((item) => item && item.category === marketplaceContext));
  const fallbackMarketplaceListings = mockMarketplaceListings[marketplaceContext] || mockMarketplaceListings.pets;
  const sourcePets = liveMarketplaceListings.length >= (marketplaceMinimums[marketplaceContext] || 0)
    ? liveMarketplaceListings
    : dedupeListings([...liveMarketplaceListings, ...fallbackMarketplaceListings]).slice(
      0,
      marketplaceMinimums[marketplaceContext] || fallbackMarketplaceListings.length,
    );

  const filteredPets = sourcePets.filter(item => {
    if (!item) return false;
    // Stage 1: Market Isolation
    if (item.category !== marketplaceContext) return false;

    // Stage 2: Category Filter
    const matchesCat = matchesActiveCategory(item, activeCat, marketplaceContext);
    
    // Stage 3: Search Filter
    const searchLower = (deferredSearchQuery || '').toLowerCase();
    const itemName = safeText(item.name).toLowerCase();
    const itemBreed = safeText(item.breed).toLowerCase();
    const itemType = safeText(item.type).toLowerCase();
    const matchesSearch = 
      itemName.includes(searchLower) ||
      itemBreed.includes(searchLower) ||
      itemType.includes(searchLower);
    
    return matchesCat && matchesSearch;
  });

  // Build mixed items: pets + native sponsored cards every 6th position
  const buildFeedItems = () => {
    const items = [];
    let adIndex = 0;
    
    filteredPets.forEach((pet, i) => {
      items.push({ type: 'pet', data: pet });
      
      // Insert a native sponsored card after every 6th pet
      if ((i + 1) % 12 === 0 && deferredSearchQuery === '') {
        items.push({ type: 'sponsored', index: adIndex++ });
      }
    });

    return items;
  };

  const feedItems = buildFeedItems();
  const title = marketplaceContext === 'livestock'
    ? 'Elite Livestock'
    : marketplaceContext === 'supplies'
      ? "Today's Premium Market"
      : 'Pets closest to you';

  if (loading && listings.length === 0) {
    return (
      <section className={`container ${styles.gallerySection}`}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p style={{ marginTop: '8px', color: 'var(--color-text-muted)' }}>Loading the latest listings...</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                minHeight: '320px',
                borderRadius: '24px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(243,244,246,0.95))',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}
            >
              <div style={{ aspectRatio: '4 / 3', background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ padding: '18px' }}>
                <div style={{ height: '16px', width: '65%', borderRadius: '999px', background: '#e5e7eb', marginBottom: '12px' }} />
                <div style={{ height: '14px', width: '45%', borderRadius: '999px', background: '#e5e7eb', marginBottom: '8px' }} />
                <div style={{ height: '14px', width: '30%', borderRadius: '999px', background: '#e5e7eb' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`container ${styles.gallerySection}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {error && (
            <p style={{ marginTop: '8px', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              {error}{' '}
              <button
                type="button"
                onClick={() => setReloadToken((value) => value + 1)}
                className="btn btn-secondary"
                style={{ marginLeft: '8px', padding: '8px 14px' }}
              >
                Retry
              </button>
            </p>
          )}
        </div>
        <div className={styles.categoryFilters}>
          {categories.map((cat) => (
            <button 
              key={cat}
              className={`${styles.filterBtn} ${activeCat === cat ? styles.activeFilter : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {feedItems.map((item) => {
          if (item.type === 'sponsored') {
            return <AdSenseUnit key={`ad-${item.index}`} slot="pet-gallery-native" />;
          }
          return (
            <PetCard key={item.data.id} pet={item.data} onClick={setSelectedPet} />
          );
        })}
      </div>
      
      {filteredPets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }}>No matches found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Try adjusting your filters or search query.</p>
        </div>
      )}
      {!loading && filteredPets.length > 0 && (
        <div className={styles.loadMore}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Showing {filteredPets.length} listing{filteredPets.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      <PetDetailModal 
        pet={selectedPet} 
        onClose={() => setSelectedPet(null)}
        onPostAction={onPostAction}
      />
    </section>
  );
};

export default PetGallery;
