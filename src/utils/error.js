/**
 * Extracts a human-readable string from an API or runtime error.
 * Prevents "Minified React error #31" by ensuring we never render a raw object.
 */
export const getErrorMessage = (err, fallback = 'An unexpected error occurred.') => {
  if (!err) return fallback;
  
  if (typeof err === 'string') return err;
  
  // Axios response error
  if (err.response?.data?.error) {
    const errorData = err.response.data.error;
    if (typeof errorData === 'string') return errorData;
    if (typeof errorData === 'object') {
      return errorData.message || errorData.code || JSON.stringify(errorData);
    }
  }

  // Axios network error
  if (err.message && typeof err.message === 'string') {
    return err.message;
  }
  
  // Generic object with message/code
  if (err.message) return String(err.message);
  if (err.code) return String(err.code);

  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
};
