export type TabDescriptor<K extends string> = {
  key: K;
  labelKey: string;
};

const TOUR_TABS = [
  {key: 'general', labelKey: 'admin.tours.tabs.general'},
  {key: 'card', labelKey: 'admin.tours.tabs.card'},
  {key: 'itinerary', labelKey: 'admin.tours.tabs.itinerary'},
  {key: 'pricing', labelKey: 'admin.tours.tabs.pricing'},
  {key: 'highlights', labelKey: 'admin.tours.tabs.highlights'},
  {key: 'perks', labelKey: 'admin.tours.tabs.perks'},
] as const satisfies readonly TabDescriptor<string>[];

export type TourTab = (typeof TOUR_TABS)[number]['key'];
export const isTourTab = (s: unknown): s is TourTab =>
  typeof s === 'string' && TOUR_TABS.some((t) => t.key === s);

const DESTINATION_TABS = [
  {key: 'general', labelKey: 'admin.destinations.tabs.general'},
  {key: 'heroImage', labelKey: 'admin.destinations.tabs.heroImage'},
  {key: 'cardImage', labelKey: 'admin.destinations.tabs.cardImage'},
  {key: 'highlights', labelKey: 'admin.destinations.tabs.highlights'},
] as const satisfies readonly TabDescriptor<string>[];

export type DestinationTab = (typeof DESTINATION_TABS)[number]['key'];
export const isDestinationTab = (s: unknown): s is DestinationTab =>
  typeof s === 'string' && DESTINATION_TABS.some((t) => t.key === s);

export type VehicleTab = 'general' | 'description' | 'images';

export function isVehicleTab(v: string): v is VehicleTab {
  return v === 'general' || v === 'description' || v === 'images';
}

// ─── Route Registry ───────────────────────────────────────

export const routes = {
  home: {path: () => '/'},
  tours: {
    list: {path: () => '/tours'},
    detail: {path: (p: {slug: string}) => `/tours/${p.slug}`},
    byDestination: {
      path: (p: {destinationId: string | number}) =>
        `/tours?destination=${p.destinationId}`,
    },
  },
  destinations: {
    detail: {path: (p: {slug: string}) => `/destinations/${p.slug}`},
  },
  rentals: {
    list: {path: () => '/rentals'},
  },
  aboutUs: {path: () => '/about-us'},
  contact: {path: () => '/contact'},

  admin: {
    dashboard: {path: () => '/admin'},
    tours: {
      list: {path: () => '/admin/tours'},
      archive: {path: () => '/admin/tours/archive'},
      new: {
        path: (p?: {tab?: TourTab}) =>
          `/admin/tours/new/${p?.tab ?? 'general'}`,
        tabs: TOUR_TABS,
      },
      edit: {
        path: (p: {id: string | number; tab?: TourTab}) =>
          `/admin/tours/${p.id}/edit/${p.tab ?? 'general'}`,
        tabs: TOUR_TABS,
      },
    },
    destinations: {
      list: {path: () => '/admin/destinations'},
      archive: {path: () => '/admin/destinations/archive'},
      new: {
        path: (p?: {tab?: DestinationTab}) =>
          `/admin/destinations/new/${p?.tab ?? 'general'}`,
        tabs: DESTINATION_TABS,
      },
      edit: {
        path: (p: {id: string | number; tab?: DestinationTab}) =>
          `/admin/destinations/${p.id}/edit/${p.tab ?? 'general'}`,
        tabs: DESTINATION_TABS,
      },
    },
    vehicles: {
      list: {path: () => '/admin/rentals'},
      archive: {path: () => '/admin/rentals/archive'},
      new: {
        path: (p?: {tab?: VehicleTab}) =>
          `/admin/rentals/new/${p?.tab ?? 'general'}`,
      },
      edit: {
        path: (p: {id: string; tab?: VehicleTab}) =>
          `/admin/rentals/${p.id}/edit/${p.tab ?? 'general'}`,
      },
    },
    perks: {
      list: {path: () => '/admin/perks'},
    },
    imageCollections: {
      list: {path: () => '/admin/image-collections'},
      new: {path: () => '/admin/image-collections/new'},
      edit: {path: (p: {id: string}) => `/admin/image-collections/${p.id}`},
    },
    translations: {path: () => '/admin/translations'},
    users: {
      list: {path: () => '/admin/users'},
      new: {path: () => '/admin/users/new'},
      edit: {path: (p: {id: string}) => `/admin/users/${p.id}`},
    },
    roles: {
      list: {path: () => '/admin/roles'},
      new: {path: () => '/admin/roles/new'},
      edit: {path: (p: {id: string}) => `/admin/roles/${p.id}`},
    },
    reviews: {
      list: {path: () => '/admin/reviews'},
      new: {path: () => '/admin/reviews/new'},
      edit: {path: (p: {id: string}) => `/admin/reviews/${p.id}`},
    },
  },

  isAdmin: (pathname: string) => pathname.startsWith('/admin'),
} as const;
