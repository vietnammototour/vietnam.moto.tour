import {routes} from '@/routes';

export type AdminNavItem = {href: string; label: string; icon: string};
export type AdminNavGroup = {label: string; items: AdminNavItem[]};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Content',
    items: [
      {href: routes.admin.dashboard.path(), label: 'Dashboard', icon: 'fa-tachometer-alt'},
      {href: routes.admin.tours.list.path(), label: 'Tours', icon: 'fa-route'},
      {href: routes.admin.reviews.list.path(), label: 'Reviews', icon: 'fa-star'},
      {href: routes.admin.destinations.list.path(), label: 'Destinations', icon: 'fa-map-marker-alt'},
      {href: routes.admin.vehicles.list.path(), label: 'Rentals', icon: 'fa-motorcycle'},
      {href: routes.admin.perks.list.path(), label: 'Perks', icon: 'fa-check-circle'},
      {href: routes.admin.imageCollections.list.path(), label: 'Image collections', icon: 'fa-images'},
    ],
  },
  {
    label: 'System',
    items: [
      {href: routes.admin.translations.path(), label: 'Translations', icon: 'fa-language'},
      {href: routes.admin.users.list.path(), label: 'Users', icon: 'fa-users'},
      {href: routes.admin.roles.list.path(), label: 'Roles', icon: 'fa-user-shield'},
      {href: routes.admin.backups.path(), label: 'Backups', icon: 'fa-database'},
    ],
  },
];
