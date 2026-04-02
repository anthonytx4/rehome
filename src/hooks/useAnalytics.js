/**
 * useAnalytics — Custom hook for GA4 event tracking
 * Tracks all monetization-relevant user actions
 */

const GA_ID = 'G-3DZMXVBZ8B';

function gtag() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...arguments);
  }
}

export const trackEvent = (eventName, params = {}) => {
  gtag('event', eventName, params);
};

// Pre-built event helpers
export const analytics = {
  // Listing events
  viewListing: (listingId, species, breed) =>
    trackEvent('view_listing', { listing_id: listingId, species, breed }),

  createListing: (species, hasBoost) =>
    trackEvent('create_listing', { species, has_boost: hasBoost }),

  // Engagement events
  addToFavorites: (listingId, species) =>
    trackEvent('add_to_favorites', { listing_id: listingId, species }),

  removeFromFavorites: (listingId) =>
    trackEvent('remove_from_favorites', { listing_id: listingId }),

  contactSeller: (listingId) =>
    trackEvent('contact_seller', { listing_id: listingId }),

  // Monetization events
  beginCheckout: (value, currency = 'USD') =>
    trackEvent('begin_checkout', { value, currency }),

  skipQueue: (listingId, value) =>
    trackEvent('skip_queue', { listing_id: listingId, value }),

  purchaseBoost: (listingId, boostType, value) =>
    trackEvent('purchase_boost', { listing_id: listingId, boost_type: boostType, value }),

  priorityApplication: (listingId) =>
    trackEvent('priority_application', { listing_id: listingId, value: 5 }),

  escrowPayment: (listingId, value, fee) =>
    trackEvent('escrow_payment', { listing_id: listingId, value, fee }),

  // Ad tracking
  adImpression: (adType, placement, adId) =>
    trackEvent('ad_impression', { ad_type: adType, placement, ad_id: adId }),

  adClick: (adType, placement, adId, destination) =>
    trackEvent('ad_click', { ad_type: adType, placement, ad_id: adId, destination }),

  // Search & browse
  search: (query, resultsCount) =>
    trackEvent('search', { search_term: query, results_count: resultsCount }),

  filterApply: (filterType, filterValue) =>
    trackEvent('filter_apply', { filter_type: filterType, filter_value: filterValue }),

  // Auth
  signUp: (method) =>
    trackEvent('sign_up', { method }),

  login: (method) =>
    trackEvent('login', { method }),

  // Newsletter
  emailCapture: (source) =>
    trackEvent('email_capture', { source }),
};

export default analytics;
