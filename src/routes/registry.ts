export type TabDescriptor<K extends string> = {
  key: K;
  labelKey: string;
};

const TOUR_TABS = [
  {key: 'general', labelKey: 'admin.tours.tabs.general'},
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
    perks: {
      list: {path: () => '/admin/perks'},
    },
    translations: {path: () => '/admin/translations'},
    users: {path: () => '/admin/users'},
  },

  isAdmin: (pathname: string) => pathname.startsWith('/admin'),
} as const;
