export const MARKETPLACES = {
  pets: {
    id: 'pets',
    label: 'Pets',
    path: '/',
    listLabel: 'List a Pet',
    itemLabel: 'Pet',
    searchPlaceholder: 'Search for pets, breeds, or shelters...',
  },
  livestock: {
    id: 'livestock',
    label: 'Livestock',
    path: '/livestock',
    listLabel: 'List Livestock',
    itemLabel: 'Livestock Lot',
    searchPlaceholder: 'Search cattle lots, bred females, equine consignments...',
  },
  supplies: {
    id: 'supplies',
    label: 'Supplies',
    path: '/supplies',
    listLabel: 'List Supplies',
    itemLabel: 'Supply Item',
    searchPlaceholder: 'Search soaps, brushes, bulk lots...',
  },
};

export const getMarketplaceByPath = (path) => {
  if (path === '/livestock') return MARKETPLACES.livestock;
  if (path === '/supplies') return MARKETPLACES.supplies;
  return MARKETPLACES.pets;
};
