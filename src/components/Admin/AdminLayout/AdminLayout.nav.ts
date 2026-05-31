import {routes} from '@/routes';

export type AdminStatKey =
  | 'tourCount'
  | 'reviewCount'
  | 'destinationCount'
  | 'vehicleCount'
  | 'perkCount'
  | 'imageCollectionCount'
  | 'userCount'
  | 'roleCount';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  countKey?: AdminStatKey;
};
export type AdminNavGroup = {label: string; items: AdminNavItem[]};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Content',
    items: [
      {href: routes.admin.dashboard.path(), label: 'Dashboard', icon: 'fa-tachometer-alt'},
      {href: routes.admin.tours.list.path(), label: 'Tours', icon: 'fa-route', countKey: 'tourCount'},
      {href: routes.admin.reviews.list.path(), label: 'Reviews', icon: 'fa-star', countKey: 'reviewCount'},
      {href: routes.admin.destinations.list.path(), label: 'Destinations', icon: 'fa-map-marker-alt', countKey: 'destinationCount'},
      {href: routes.admin.vehicles.list.path(), label: 'Rentals', icon: 'fa-motorcycle', countKey: 'vehicleCount'},
      {href: routes.admin.perks.list.path(), label: 'Perks', icon: 'fa-check-circle', countKey: 'perkCount'},
      {href: routes.admin.imageCollections.list.path(), label: 'Image collections', icon: 'fa-images', countKey: 'imageCollectionCount'},
    ],
  },
  {
    label: 'System',
    items: [
      {href: routes.admin.translations.path(), label: 'Translations', icon: 'fa-language'},
      {href: routes.admin.users.list.path(), label: 'Users', icon: 'fa-users', countKey: 'userCount'},
      {href: routes.admin.roles.list.path(), label: 'Roles', icon: 'fa-user-shield', countKey: 'roleCount'},
      {href: routes.admin.backups.path(), label: 'Backups', icon: 'fa-database'},
      {href: routes.admin.logs.list.path(), label: 'Logs', icon: 'fa-clipboard-list'},
    ],
  },
];
