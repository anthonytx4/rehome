const env = import.meta.env;

export const ADSENSE_CLIENT_ID = env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-7995028462770772';

const slot = (...values) => values.find((value) => Boolean(value)) || '';

export const ADSENSE_SLOTS = {
  'homepage-top-banner': slot(env.VITE_ADSENSE_SLOT_HOME_HERO, env.VITE_ADSENSE_SLOT_DISPLAY),
  'homepage-bottom-native': slot(env.VITE_ADSENSE_SLOT_HOME_BOTTOM, env.VITE_ADSENSE_SLOT_DISPLAY),
  'livestock-top-banner': slot(env.VITE_ADSENSE_SLOT_LIVESTOCK_TOP, env.VITE_ADSENSE_SLOT_DISPLAY),
  'livestock-bottom-native': slot(env.VITE_ADSENSE_SLOT_LIVESTOCK_BOTTOM, env.VITE_ADSENSE_SLOT_DISPLAY),
  'supplies-top-banner': slot(env.VITE_ADSENSE_SLOT_SUPPLIES_TOP, env.VITE_ADSENSE_SLOT_DISPLAY),
  'supplies-bottom-native': slot(env.VITE_ADSENSE_SLOT_SUPPLIES_BOTTOM, env.VITE_ADSENSE_SLOT_DISPLAY),
  'pet-gallery-native': slot(env.VITE_ADSENSE_SLOT_FEED, env.VITE_ADSENSE_SLOT_DISPLAY),
  'modal-bottom-native': slot(env.VITE_ADSENSE_SLOT_MODAL, env.VITE_ADSENSE_SLOT_DISPLAY),
  'dashboard-top-banner': slot(env.VITE_ADSENSE_SLOT_DASHBOARD_TOP, env.VITE_ADSENSE_SLOT_DISPLAY),
  homeHero: slot(env.VITE_ADSENSE_SLOT_HOME_HERO, env.VITE_ADSENSE_SLOT_DISPLAY),
  homeBottom: slot(env.VITE_ADSENSE_SLOT_HOME_BOTTOM, env.VITE_ADSENSE_SLOT_DISPLAY),
  livestockTopBanner: slot(env.VITE_ADSENSE_SLOT_LIVESTOCK_TOP, env.VITE_ADSENSE_SLOT_DISPLAY),
  livestockBottomNative: slot(env.VITE_ADSENSE_SLOT_LIVESTOCK_BOTTOM, env.VITE_ADSENSE_SLOT_DISPLAY),
  suppliesTopBanner: slot(env.VITE_ADSENSE_SLOT_SUPPLIES_TOP, env.VITE_ADSENSE_SLOT_DISPLAY),
  suppliesBottomNative: slot(env.VITE_ADSENSE_SLOT_SUPPLIES_BOTTOM, env.VITE_ADSENSE_SLOT_DISPLAY),
  petGalleryNative: slot(env.VITE_ADSENSE_SLOT_FEED, env.VITE_ADSENSE_SLOT_DISPLAY),
  modalBottomNative: slot(env.VITE_ADSENSE_SLOT_MODAL, env.VITE_ADSENSE_SLOT_DISPLAY),
  dashboardTop: slot(env.VITE_ADSENSE_SLOT_DASHBOARD_TOP, env.VITE_ADSENSE_SLOT_DISPLAY),
  footerPartners: slot(env.VITE_ADSENSE_SLOT_FOOTER, env.VITE_ADSENSE_SLOT_DISPLAY),
  postAction: slot(env.VITE_ADSENSE_SLOT_POST_ACTION, env.VITE_ADSENSE_SLOT_DISPLAY),
};

export const getAdSlot = (placement) => ADSENSE_SLOTS[placement] || '';

export const hasAdSlot = (placement) => Boolean(getAdSlot(placement));
