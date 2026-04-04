const apiBaseUrl = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001');

export const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return `${apiBaseUrl}${value}`;
  return value;
};

export const resolveMediaList = (items = []) => items.map(resolveMediaUrl).filter(Boolean);
