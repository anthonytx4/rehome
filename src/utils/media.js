const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : '';

export const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return `${apiBaseUrl}${value}`;
  return value;
};

export const resolveMediaList = (items = []) => items.map(resolveMediaUrl).filter(Boolean);
