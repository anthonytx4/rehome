const PALETTES = [
  ['#D7F0FF', '#7DD3FC', '#0F766E'],
  ['#FFF1D6', '#FDBA74', '#9A3412'],
  ['#F3E8FF', '#C4B5FD', '#5B21B6'],
  ['#E8FFF3', '#6EE7B7', '#047857'],
  ['#FDE7EF', '#FB7185', '#9F1239'],
  ['#E8F1FF', '#93C5FD', '#1D4ED8'],
];

const COAT_COLORS = {
  dog: ['#E7C8A0', '#D6B38A', '#AE7C52', '#F2E6D8', '#8D6748'],
  cat: ['#C9B8A6', '#E9DFD2', '#8A7A6D', '#B88C5A', '#D8CFC4'],
  bird: ['#F97316', '#FACC15', '#22C55E', '#0EA5E9', '#EF4444'],
  rabbit: ['#F0E4D2', '#D9C4B0', '#BFA58E', '#9C8875', '#FFFFFF'],
  cattle: ['#FFF7ED', '#8B5E3C', '#F4F4F5', '#D6D3D1', '#1F2937'],
  goat: ['#E7E5E4', '#C4B5A5', '#8B7355', '#FAFAF9', '#57534E'],
  sheep: ['#FFFFFF', '#E7E5E4', '#D6D3D1', '#A8A29E', '#57534E'],
  swine: ['#F8D4D8', '#F2B7C1', '#E79AAA', '#CC7A8C', '#8C4A5A'],
  poultry: ['#FEF3C7', '#FCA5A5', '#FDBA74', '#FDE68A', '#F97316'],
  supplies: ['#D9F99D', '#FDE68A', '#BFDBFE', '#FBCFE8', '#FED7AA'],
};

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
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

const uniqueImages = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const pickFrom = (items, seed) => items[Math.abs(seed) % items.length];

const range = (seed, shift, min, max) => {
  const span = max - min;
  if (span <= 0) return min;
  return min + ((seed >> shift) % (span + 1));
};

const getArtworkBucket = (listing = {}) => {
  const category = safeText(listing.category).toLowerCase();
  const type = safeText(listing.species || listing.type).toLowerCase();

  if (category === 'supplies') return 'supplies';
  if (category === 'livestock') return 'livestock';
  if (type.includes('dog')) return 'dog';
  if (type.includes('cat')) return 'cat';
  if (
    type.includes('bird') ||
    type.includes('parrot') ||
    type.includes('macaw') ||
    type.includes('cockatiel') ||
    type.includes('canary')
  ) {
    return 'bird';
  }
  if (
    type.includes('rabbit') ||
    type.includes('guinea pig') ||
    type.includes('hamster') ||
    type.includes('ferret')
  ) {
    return 'rabbit';
  }

  return category === 'pets' ? 'dog' : 'livestock';
};

const getLivestockSubtype = (listing = {}) => {
  const haystack = `${safeText(listing.species)} ${safeText(listing.type)} ${safeText(listing.breed)}`.toLowerCase();
  if (haystack.includes('goat')) return 'goat';
  if (haystack.includes('sheep') || haystack.includes('lamb')) return 'sheep';
  if (haystack.includes('pig') || haystack.includes('swine') || haystack.includes('hog')) return 'swine';
  if (
    haystack.includes('duck') ||
    haystack.includes('chicken') ||
    haystack.includes('turkey') ||
    haystack.includes('hen') ||
    haystack.includes('rooster') ||
    haystack.includes('poultry')
  ) {
    return 'poultry';
  }
  return 'cattle';
};

const getSupplySubtype = (listing = {}) => {
  const haystack = `${safeText(listing.species)} ${safeText(listing.type)} ${safeText(listing.breed)} ${safeText(listing.title)}`.toLowerCase();
  if (haystack.includes('feed') || haystack.includes('supplement') || haystack.includes('nutrition')) return 'feed';
  if (haystack.includes('crate') || haystack.includes('carrier') || haystack.includes('hutch')) return 'crate';
  if (haystack.includes('fence') || haystack.includes('panel') || haystack.includes('gate')) return 'fence';
  if (haystack.includes('water') || haystack.includes('bucket') || haystack.includes('trough')) return 'water';
  return 'tool';
};

const buildBackdrop = (seed, palette) => {
  const [sky, glow, accent] = palette;
  const hillY = 430 + range(seed, 2, -20, 18);
  const hillBump = 110 + range(seed, 5, -10, 34);
  const sunX = 590 + range(seed, 9, -70, 80);
  const sunY = 120 + range(seed, 12, -18, 36);

  return `
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${sky}" />
        <stop offset="60%" stop-color="${glow}" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="#86EFAC" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="rgba(15,23,42,0.14)" />
      </filter>
    </defs>
    <rect width="800" height="600" rx="40" fill="url(#sky)" />
    <circle cx="${sunX}" cy="${sunY}" r="72" fill="rgba(255,255,255,0.56)" />
    <circle cx="${sunX}" cy="${sunY}" r="112" fill="rgba(255,255,255,0.2)" />
    <path d="M0 ${hillY} C 120 ${hillY - hillBump}, 280 ${hillY + 18}, 400 ${hillY - 26} S 670 ${hillY - 8}, 800 ${hillY - 66} V 600 H 0 Z" fill="url(#ground)" />
    <path d="M0 ${hillY + 42} C 150 ${hillY - 4}, 310 ${hillY + 62}, 480 ${hillY + 22} S 710 ${hillY + 16}, 800 ${hillY - 2} V 600 H 0 Z" fill="rgba(255,255,255,0.18)" />
    <circle cx="${120 + range(seed, 7, 0, 500)}" cy="${120 + range(seed, 11, 0, 180)}" r="${22 + range(seed, 15, 0, 26)}" fill="rgba(255,255,255,0.15)" />
    <circle cx="${200 + range(seed, 17, 0, 420)}" cy="${180 + range(seed, 21, 0, 200)}" r="${14 + range(seed, 23, 0, 24)}" fill="rgba(255,255,255,0.1)" />
  `;
};

const buildDogArtwork = (seed) => {
  const coat = pickFrom(COAT_COLORS.dog, seed);
  const patch = pickFrom(COAT_COLORS.dog, seed >> 3);
  const chest = seed % 2 === 0 ? '#FFF8EF' : '#F2E7D7';
  const earTilt = 14 + range(seed, 4, 0, 14);
  const tailLift = 330 + range(seed, 8, -25, 20);

  return `
    <g filter="url(#shadow)">
      <path d="M540 ${tailLift} C 618 ${tailLift - 36}, 674 ${tailLift + 28}, 636 ${tailLift + 82}" fill="none" stroke="${coat}" stroke-width="28" stroke-linecap="round" />
      <ellipse cx="410" cy="390" rx="170" ry="118" fill="${coat}" />
      <ellipse cx="360" cy="358" rx="88" ry="84" fill="${patch}" opacity="0.34" />
      <circle cx="308" cy="262" r="92" fill="${coat}" />
      <ellipse cx="230" cy="196" rx="42" ry="108" fill="${patch}" transform="rotate(${-earTilt} 230 196)" />
      <ellipse cx="382" cy="196" rx="42" ry="108" fill="${patch}" transform="rotate(${earTilt} 382 196)" />
      <ellipse cx="312" cy="294" rx="52" ry="38" fill="${chest}" />
      <circle cx="274" cy="248" r="10" fill="#1F2937" />
      <circle cx="334" cy="248" r="10" fill="#1F2937" />
      <ellipse cx="304" cy="278" rx="22" ry="16" fill="#6B4F3D" />
      <path d="M286 300 C 295 311, 313 311, 322 300" fill="none" stroke="#6B4F3D" stroke-width="6" stroke-linecap="round" />
      <rect x="304" y="452" width="32" height="108" rx="14" fill="${patch}" />
      <rect x="370" y="446" width="32" height="112" rx="14" fill="${patch}" />
      <rect x="458" y="446" width="32" height="112" rx="14" fill="${patch}" />
      <rect x="520" y="456" width="30" height="102" rx="14" fill="${patch}" />
      <ellipse cx="328" cy="558" rx="28" ry="10" fill="rgba(15,23,42,0.12)" />
      <ellipse cx="386" cy="558" rx="28" ry="10" fill="rgba(15,23,42,0.12)" />
      <ellipse cx="474" cy="558" rx="28" ry="10" fill="rgba(15,23,42,0.12)" />
      <ellipse cx="536" cy="558" rx="24" ry="9" fill="rgba(15,23,42,0.12)" />
    </g>
  `;
};

const buildCatArtwork = (seed) => {
  const coat = pickFrom(COAT_COLORS.cat, seed);
  const accent = pickFrom(COAT_COLORS.cat, seed >> 4);
  const eye = seed % 2 === 0 ? '#16A34A' : '#F59E0B';
  const tailCurve = 560 + range(seed, 7, -22, 18);

  return `
    <g filter="url(#shadow)">
      <path d="M520 ${tailCurve} C 642 ${tailCurve - 74}, 646 ${tailCurve - 246}, 542 ${tailCurve - 224}" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round" />
      <ellipse cx="392" cy="398" rx="142" ry="126" fill="${coat}" />
      <circle cx="394" cy="252" r="92" fill="${coat}" />
      <polygon points="318,194 274,112 348,150" fill="${accent}" />
      <polygon points="470,194 514,112 440,150" fill="${accent}" />
      <ellipse cx="356" cy="272" rx="28" ry="36" fill="#FFFFFF" opacity="0.22" />
      <ellipse cx="432" cy="272" rx="28" ry="36" fill="#FFFFFF" opacity="0.22" />
      <ellipse cx="362" cy="246" rx="12" ry="16" fill="${eye}" />
      <ellipse cx="426" cy="246" rx="12" ry="16" fill="${eye}" />
      <circle cx="362" cy="246" r="4" fill="#111827" />
      <circle cx="426" cy="246" r="4" fill="#111827" />
      <ellipse cx="394" cy="292" rx="18" ry="14" fill="#8B5E3C" />
      <path d="M382 304 C 388 312, 400 312, 406 304" fill="none" stroke="#7C4A33" stroke-width="4" stroke-linecap="round" />
      <path d="M304 292 H 218 M304 314 H 214 M484 292 H 570 M484 314 H 574" stroke="#94A3B8" stroke-width="5" stroke-linecap="round" />
      <rect x="306" y="450" width="28" height="108" rx="12" fill="${accent}" />
      <rect x="364" y="462" width="28" height="98" rx="12" fill="${accent}" />
      <rect x="422" y="462" width="28" height="98" rx="12" fill="${accent}" />
      <rect x="480" y="450" width="28" height="108" rx="12" fill="${accent}" />
    </g>
  `;
};

const buildBirdArtwork = (seed) => {
  const wing = pickFrom(COAT_COLORS.bird, seed);
  const body = pickFrom(COAT_COLORS.bird, seed >> 4);
  const tail = pickFrom(COAT_COLORS.bird, seed >> 7);
  const branchY = 430 + range(seed, 8, -30, 24);

  return `
    <g filter="url(#shadow)">
      <path d="M120 ${branchY} C 250 ${branchY - 24}, 460 ${branchY + 16}, 680 ${branchY - 20}" fill="none" stroke="#7C5A3D" stroke-width="24" stroke-linecap="round" />
      <ellipse cx="420" cy="320" rx="132" ry="108" fill="${body}" />
      <ellipse cx="352" cy="250" rx="74" ry="70" fill="${wing}" />
      <path d="M476 274 C 548 254, 612 286, 628 354 C 562 338, 522 368, 468 410 Z" fill="${tail}" />
      <path d="M298 256 l-70 -60 84 18 z" fill="#F97316" />
      <circle cx="340" cy="236" r="10" fill="#111827" />
      <circle cx="382" cy="236" r="10" fill="#111827" />
      <path d="M386 258 l40 14 -40 20 z" fill="#D97706" />
      <rect x="392" y="400" width="12" height="72" rx="6" fill="#8C6A3D" />
      <rect x="436" y="398" width="12" height="76" rx="6" fill="#8C6A3D" />
      <path d="M392 470 l-18 26 M404 470 l16 26 M436 472 l-18 26 M448 472 l16 26" stroke="#8C6A3D" stroke-width="6" stroke-linecap="round" />
    </g>
  `;
};

const buildRabbitArtwork = (seed) => {
  const fur = pickFrom(COAT_COLORS.rabbit, seed);
  const accent = pickFrom(COAT_COLORS.rabbit, seed >> 4);
  const earHeight = 138 + range(seed, 8, -12, 16);

  return `
    <g filter="url(#shadow)">
      <ellipse cx="418" cy="404" rx="144" ry="114" fill="${fur}" />
      <circle cx="332" cy="286" r="88" fill="${fur}" />
      <ellipse cx="276" cy="148" rx="34" ry="${earHeight}" fill="${accent}" transform="rotate(-10 276 148)" />
      <ellipse cx="356" cy="138" rx="34" ry="${earHeight + 8}" fill="${accent}" transform="rotate(10 356 138)" />
      <ellipse cx="282" cy="160" rx="16" ry="${earHeight - 32}" fill="#F8D7DA" transform="rotate(-10 282 160)" />
      <ellipse cx="350" cy="150" rx="16" ry="${earHeight - 28}" fill="#F8D7DA" transform="rotate(10 350 150)" />
      <circle cx="308" cy="280" r="9" fill="#111827" />
      <circle cx="346" cy="280" r="9" fill="#111827" />
      <ellipse cx="328" cy="312" rx="18" ry="12" fill="#A16207" />
      <path d="M316 326 C 320 334, 336 334, 340 326" fill="none" stroke="#92400E" stroke-width="4" stroke-linecap="round" />
      <circle cx="540" cy="336" r="28" fill="${accent}" opacity="0.94" />
      <rect x="328" y="468" width="34" height="90" rx="14" fill="${accent}" />
      <rect x="392" y="456" width="34" height="102" rx="14" fill="${accent}" />
      <rect x="458" y="468" width="34" height="90" rx="14" fill="${accent}" />
    </g>
  `;
};

const buildCattleArtwork = (seed) => {
  const hide = pickFrom(COAT_COLORS.cattle, seed);
  const patch = pickFrom(COAT_COLORS.cattle, seed >> 5);

  return `
    <g filter="url(#shadow)">
      <ellipse cx="408" cy="384" rx="182" ry="112" fill="${hide}" />
      <ellipse cx="292" cy="282" rx="96" ry="74" fill="${hide}" />
      <ellipse cx="232" cy="256" rx="38" ry="18" fill="#D6B38A" />
      <ellipse cx="356" cy="256" rx="38" ry="18" fill="#D6B38A" />
      <path d="M226 230 l-22 -54 38 34 M358 230 l22 -54 -38 34" fill="none" stroke="#8B5E3C" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      <ellipse cx="384" cy="374" rx="72" ry="46" fill="${patch}" opacity="0.85" />
      <ellipse cx="286" cy="316" rx="42" ry="28" fill="#FCD7C7" />
      <circle cx="264" cy="268" r="9" fill="#111827" />
      <circle cx="312" cy="268" r="9" fill="#111827" />
      <rect x="298" y="452" width="28" height="108" rx="12" fill="#8B5E3C" />
      <rect x="364" y="452" width="28" height="108" rx="12" fill="#8B5E3C" />
      <rect x="474" y="452" width="28" height="108" rx="12" fill="#8B5E3C" />
      <rect x="540" y="452" width="28" height="108" rx="12" fill="#8B5E3C" />
      <path d="M586 336 C 658 312, 674 394, 626 430" fill="none" stroke="#8B5E3C" stroke-width="16" stroke-linecap="round" />
    </g>
  `;
};

const buildGoatArtwork = (seed) => {
  const fur = pickFrom(COAT_COLORS.goat, seed);
  const accent = pickFrom(COAT_COLORS.goat, seed >> 4);

  return `
    <g filter="url(#shadow)">
      <ellipse cx="414" cy="390" rx="168" ry="104" fill="${fur}" />
      <ellipse cx="300" cy="286" rx="94" ry="72" fill="${fur}" />
      <path d="M246 226 C 226 176, 246 150, 270 132 M354 226 C 374 176, 354 150, 330 132" fill="none" stroke="#7C5A3D" stroke-width="10" stroke-linecap="round" />
      <ellipse cx="284" cy="316" rx="34" ry="48" fill="${accent}" opacity="0.5" />
      <circle cx="278" cy="272" r="8" fill="#111827" />
      <circle cx="318" cy="272" r="8" fill="#111827" />
      <path d="M280 300 H 326" stroke="#7C5A3D" stroke-width="5" stroke-linecap="round" />
      <path d="M290 320 C 304 348, 320 350, 334 326" fill="none" stroke="#7C5A3D" stroke-width="5" stroke-linecap="round" />
      <rect x="314" y="454" width="24" height="104" rx="10" fill="#8B7355" />
      <rect x="370" y="450" width="24" height="108" rx="10" fill="#8B7355" />
      <rect x="492" y="450" width="24" height="108" rx="10" fill="#8B7355" />
      <rect x="548" y="454" width="24" height="104" rx="10" fill="#8B7355" />
      <path d="M576 344 C 626 304, 654 386, 618 430" fill="none" stroke="#8B7355" stroke-width="14" stroke-linecap="round" />
    </g>
  `;
};

const buildSheepArtwork = (seed) => {
  const wool = pickFrom(COAT_COLORS.sheep, seed);
  const face = pickFrom(COAT_COLORS.sheep, seed >> 4);

  return `
    <g filter="url(#shadow)">
      <circle cx="344" cy="312" r="58" fill="${wool}" />
      <circle cx="288" cy="326" r="52" fill="${wool}" />
      <circle cx="394" cy="330" r="60" fill="${wool}" />
      <circle cx="448" cy="314" r="56" fill="${wool}" />
      <circle cx="500" cy="334" r="50" fill="${wool}" />
      <ellipse cx="276" cy="296" rx="66" ry="54" fill="${face}" />
      <circle cx="256" cy="284" r="8" fill="#111827" />
      <circle cx="292" cy="284" r="8" fill="#111827" />
      <ellipse cx="274" cy="314" rx="18" ry="12" fill="#B45309" />
      <rect x="316" y="448" width="24" height="110" rx="10" fill="#8B7355" />
      <rect x="382" y="448" width="24" height="110" rx="10" fill="#8B7355" />
      <rect x="464" y="448" width="24" height="110" rx="10" fill="#8B7355" />
      <rect x="526" y="448" width="24" height="110" rx="10" fill="#8B7355" />
    </g>
  `;
};

const buildSwineArtwork = (seed) => {
  const skin = pickFrom(COAT_COLORS.swine, seed);
  const accent = pickFrom(COAT_COLORS.swine, seed >> 4);

  return `
    <g filter="url(#shadow)">
      <ellipse cx="414" cy="396" rx="174" ry="108" fill="${skin}" />
      <circle cx="286" cy="302" r="82" fill="${skin}" />
      <polygon points="226,248 196,190 250,220" fill="${accent}" />
      <polygon points="332,248 364,190 310,220" fill="${accent}" />
      <circle cx="258" cy="286" r="8" fill="#111827" />
      <circle cx="312" cy="286" r="8" fill="#111827" />
      <ellipse cx="286" cy="324" rx="28" ry="20" fill="#FCE7F3" />
      <circle cx="276" cy="324" r="4" fill="#9D174D" />
      <circle cx="296" cy="324" r="4" fill="#9D174D" />
      <rect x="328" y="456" width="24" height="102" rx="10" fill="${accent}" />
      <rect x="392" y="456" width="24" height="102" rx="10" fill="${accent}" />
      <rect x="496" y="456" width="24" height="102" rx="10" fill="${accent}" />
      <rect x="556" y="456" width="24" height="102" rx="10" fill="${accent}" />
      <path d="M588 360 C 632 344, 644 404, 612 426" fill="none" stroke="#BE185D" stroke-width="10" stroke-linecap="round" />
    </g>
  `;
};

const buildPoultryArtwork = (seed) => {
  const body = pickFrom(COAT_COLORS.poultry, seed);
  const wing = pickFrom(COAT_COLORS.poultry, seed >> 3);

  return `
    <g filter="url(#shadow)">
      <ellipse cx="408" cy="370" rx="142" ry="108" fill="${body}" />
      <circle cx="324" cy="272" r="76" fill="${body}" />
      <path d="M286 236 l-52 -46 60 12 z" fill="#DC2626" />
      <path d="M326 214 l-18 -46 36 24 z" fill="#DC2626" />
      <ellipse cx="418" cy="382" rx="68" ry="48" fill="${wing}" />
      <circle cx="306" cy="264" r="8" fill="#111827" />
      <path d="M344 282 l34 12 -34 16 z" fill="#D97706" />
      <rect x="388" y="442" width="12" height="98" rx="6" fill="#8C6A3D" />
      <rect x="444" y="442" width="12" height="98" rx="6" fill="#8C6A3D" />
      <path d="M388 540 l-18 22 M400 540 l16 22 M444 540 l-18 22 M456 540 l16 22" stroke="#8C6A3D" stroke-width="6" stroke-linecap="round" />
      <path d="M518 282 C 572 256, 620 292, 614 344" fill="none" stroke="${wing}" stroke-width="18" stroke-linecap="round" />
    </g>
  `;
};

const buildLivestockArtwork = (listing, seed) => {
  const subtype = getLivestockSubtype(listing);
  if (subtype === 'goat') return buildGoatArtwork(seed);
  if (subtype === 'sheep') return buildSheepArtwork(seed);
  if (subtype === 'swine') return buildSwineArtwork(seed);
  if (subtype === 'poultry') return buildPoultryArtwork(seed);
  return buildCattleArtwork(seed);
};

const buildFeedArtwork = (seed) => {
  const bag = pickFrom(COAT_COLORS.supplies, seed);
  const accent = pickFrom(COAT_COLORS.supplies, seed >> 4);

  return `
    <g filter="url(#shadow)">
      <path d="M286 210 H 520 L 560 520 H 246 Z" fill="${bag}" />
      <path d="M320 170 H 486 L 520 220 H 286 Z" fill="${accent}" />
      <rect x="314" y="272" width="178" height="110" rx="24" fill="rgba(255,255,255,0.55)" />
      <path d="M352 330 C 378 286, 432 286, 454 330 C 432 364, 380 370, 352 330" fill="rgba(15,23,42,0.18)" />
      <ellipse cx="404" cy="544" rx="160" ry="16" fill="rgba(15,23,42,0.14)" />
    </g>
  `;
};

const buildCrateArtwork = (seed) => {
  const shell = pickFrom(COAT_COLORS.supplies, seed);

  return `
    <g filter="url(#shadow)">
      <rect x="208" y="236" width="384" height="254" rx="34" fill="${shell}" />
      <rect x="238" y="272" width="190" height="188" rx="24" fill="rgba(255,255,255,0.34)" />
      <rect x="446" y="272" width="112" height="188" rx="24" fill="rgba(15,23,42,0.08)" />
      <path d="M286 210 H 514" stroke="#64748B" stroke-width="20" stroke-linecap="round" />
      <path d="M470 326 H 534 M470 358 H 534 M470 390 H 534" stroke="#475569" stroke-width="10" stroke-linecap="round" />
      <circle cx="400" cy="544" r="18" fill="#64748B" />
    </g>
  `;
};

const buildFenceArtwork = (seed) => {
  const panel = pickFrom(COAT_COLORS.supplies, seed);

  return `
    <g filter="url(#shadow)">
      <rect x="186" y="240" width="18" height="280" rx="9" fill="#7C5A3D" />
      <rect x="596" y="240" width="18" height="280" rx="9" fill="#7C5A3D" />
      <rect x="224" y="270" width="338" height="20" rx="10" fill="${panel}" />
      <rect x="224" y="334" width="338" height="20" rx="10" fill="${panel}" />
      <rect x="224" y="398" width="338" height="20" rx="10" fill="${panel}" />
      <rect x="224" y="462" width="338" height="20" rx="10" fill="${panel}" />
      <rect x="286" y="250" width="16" height="252" rx="8" fill="#A16207" />
      <rect x="392" y="250" width="16" height="252" rx="8" fill="#A16207" />
      <rect x="488" y="250" width="16" height="252" rx="8" fill="#A16207" />
    </g>
  `;
};

const buildWaterArtwork = (seed) => {
  const body = pickFrom(COAT_COLORS.supplies, seed);

  return `
    <g filter="url(#shadow)">
      <ellipse cx="402" cy="238" rx="144" ry="42" fill="#CBD5E1" />
      <rect x="258" y="238" width="288" height="226" rx="38" fill="${body}" />
      <ellipse cx="402" cy="462" rx="144" ry="42" fill="#94A3B8" />
      <ellipse cx="402" cy="252" rx="124" ry="24" fill="#7DD3FC" opacity="0.82" />
      <rect x="590" y="194" width="30" height="94" rx="15" fill="#64748B" />
      <circle cx="606" cy="188" r="20" fill="#94A3B8" />
    </g>
  `;
};

const buildToolArtwork = (seed) => {
  const handle = seed % 2 === 0 ? '#92400E' : '#6B7280';
  const head = pickFrom(COAT_COLORS.supplies, seed);

  return `
    <g filter="url(#shadow)">
      <rect x="384" y="162" width="26" height="320" rx="13" fill="${handle}" transform="rotate(${range(seed, 3, -18, 18)} 397 322)" />
      <path d="M276 228 H 520 L 556 286 H 240 Z" fill="${head}" />
      <path d="M268 372 C 330 334, 478 334, 538 372 C 480 418, 328 418, 268 372" fill="rgba(255,255,255,0.48)" />
      <ellipse cx="404" cy="526" rx="150" ry="18" fill="rgba(15,23,42,0.12)" />
    </g>
  `;
};

const buildSuppliesArtwork = (listing, seed) => {
  const subtype = getSupplySubtype(listing);
  if (subtype === 'feed') return buildFeedArtwork(seed);
  if (subtype === 'crate') return buildCrateArtwork(seed);
  if (subtype === 'fence') return buildFenceArtwork(seed);
  if (subtype === 'water') return buildWaterArtwork(seed);
  return buildToolArtwork(seed);
};

const buildSubject = (listing, bucket, seed) => {
  if (bucket === 'dog') return buildDogArtwork(seed);
  if (bucket === 'cat') return buildCatArtwork(seed);
  if (bucket === 'bird') return buildBirdArtwork(seed);
  if (bucket === 'rabbit') return buildRabbitArtwork(seed);
  if (bucket === 'supplies') return buildSuppliesArtwork(listing, seed);
  return buildLivestockArtwork(listing, seed);
};

export const buildListingArtwork = (listing = {}, variantSeed = 0) => {
  const bucket = getArtworkBucket(listing);
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
  const seed = hashString(seedSource);
  const palette = PALETTES[seed % PALETTES.length];
  const title = escapeXml(safeText(listing.petName || listing.name || listing.title || listing.species || 'Listing'));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${title}">
      ${buildBackdrop(seed, palette)}
      ${buildSubject(listing, bucket, seed)}
      <rect x="34" y="34" width="732" height="532" rx="34" fill="none" stroke="rgba(255,255,255,0.44)" stroke-width="6" />
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const decorateListingWithArtwork = (listing = {}) => {
  const existingImages = uniqueImages([
    safeText(listing.image),
    ...parseListingImages(listing.images),
  ]);

  const images = existingImages.length > 0
    ? existingImages
    : Array.from({ length: 3 }, (_, index) => buildListingArtwork(listing, index));

  return {
    ...listing,
    image: images[0],
    images,
  };
};
