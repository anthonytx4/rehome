const LISTING_AUTO_REVIEW_PATTERNS = [
  { label: 'Off-platform payment language', regex: /\b(zelle|cash ?app|cashapp|venmo|gift card|western union|crypto|bitcoin|wire transfer)\b/i },
  { label: 'Off-platform contact request', regex: /\b(whatsapp|telegram|signal|dm me|text me|call me|instagram|facebook messenger|snapchat)\b/i },
  { label: 'Risky remote-handoff promise', regex: /\b(ship anywhere|nationwide shipping|worldwide shipping|no questions asked)\b/i },
];

const MESSAGE_RESTRICTED_PATTERNS = [
  { label: 'email address', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: 'phone number', regex: /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/ },
  { label: 'off-platform contact request', regex: /\b(whatsapp|telegram|signal|text me|call me|instagram|facebook|snapchat)\b/i },
  { label: 'off-platform payment language', regex: /\b(zelle|cash ?app|cashapp|venmo|gift card|western union|crypto|bitcoin|wire transfer)\b/i },
  { label: 'external link', regex: /https?:\/\/|www\./i },
];

export const sanitizeText = (value, { maxLength = 2000 } = {}) => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

export const normalizeEmailAddress = (value) => sanitizeText(value, { maxLength: 320 }).toLowerCase();

export const sanitizeFilename = (value) => {
  const sanitized = sanitizeText(value, { maxLength: 120 })
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  return sanitized || 'upload';
};

export const parseImageCollection = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getListingQualityIssues = ({ description, location, images, price }) => {
  const issues = [];
  const imageCount = Array.isArray(images) ? images.filter(Boolean).length : 0;
  const normalizedDescription = sanitizeText(description, { maxLength: 4000 });
  const normalizedLocation = sanitizeText(location, { maxLength: 160 });

  if (normalizedDescription.length < 40) issues.push('Description is too short for a trustworthy marketplace listing.');
  if (!normalizedLocation) issues.push('Location is required.');
  if (imageCount < 1) issues.push('At least one photo is required.');
  if (price !== undefined && price !== null && Number(price) < 0) issues.push('Price cannot be negative.');

  return issues;
};

export const getListingModerationFlags = ({ title, petName, breed, description, location }) => {
  const haystack = [
    sanitizeText(title, { maxLength: 160 }),
    sanitizeText(petName, { maxLength: 160 }),
    sanitizeText(breed, { maxLength: 160 }),
    sanitizeText(description, { maxLength: 4000 }),
    sanitizeText(location, { maxLength: 160 }),
  ].join(' ');

  return LISTING_AUTO_REVIEW_PATTERNS
    .filter((pattern) => pattern.regex.test(haystack))
    .map((pattern) => pattern.label);
};

export const getMessageRiskFlags = (content) => {
  const normalizedContent = sanitizeText(content, { maxLength: 2000 });
  if (!normalizedContent) return [];

  return MESSAGE_RESTRICTED_PATTERNS
    .filter((pattern) => pattern.regex.test(normalizedContent))
    .map((pattern) => pattern.label);
};
