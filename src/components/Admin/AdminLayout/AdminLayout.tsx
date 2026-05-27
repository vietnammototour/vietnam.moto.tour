'use client';

import {type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useSession, signOut} from 'next-auth/react';
import {routes} from '@/routes';
import {Button} from '@/components/ui';
import {ProgressBar} from '../ProgressBar';
import {
  AdminLoadingProvider,
  useAdminLoading,
} from '@/contexts/AdminLoadingContext';

type AdminLayoutProps = {
  children: ReactNode;
};

function AdminLayoutInner({children}: AdminLayoutProps) {
  const router = useRouter();
  const {data: session} = useSession();
  const {loading} = useAdminLoading();

  const navItems = [
    {
      href: routes.admin.dashboard.path(),
      label: 'Dashboard',
      icon: 'fa-tachometer-alt',
    },
    {href: routes.admin.tours.list.path(), label: 'Tours', icon: 'fa-route'},
    {
      href: routes.admin.destinations.list.path(),
      label: 'Destinations',
      icon: 'fa-map-marker-alt',
    },
    {
      href: routes.admin.vehicles.list.path(),
      label: 'Rentals',
      icon: 'fa-motorcycle',
    },
    {
      href: routes.admin.perks.list.path(),
      label: 'Perks',
      icon: 'fa-check-circle',
    },
    {
      href: routes.admin.imageCollections.list.path(),
      label: 'Image collections',
      icon: 'fa-images',
    },
    {
      href: routes.admin.translations.path(),
      label: 'Translations',
      icon: 'fa-language',
    },
    {
      href: routes.admin.users.list.path(),
      label: 'Users',
      icon: 'fa-users',
    },
    {
      href: routes.admin.roles.list.path(),
      label: 'Roles',
      icon: 'fa-user-shield',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <ProgressBar loading={loading} />

      {/* Sidebar */}
      <aside className="w-64 bg-surface-elevated border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link
            href={routes.home.path()}
            className="type-title-sm text-primary cursor-pointer"
          >
            VMT Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === routes.admin.dashboard.path()
                ? router.pathname === routes.admin.dashboard.path()
                : router.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[0.9375rem] transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
                }`}
              >
                <i
                  className={`fas ${item.icon} w-6 text-center text-[0.9375rem]`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="type-label-sm text-on-surface-secondary truncate">
            {session?.user.name}
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => signOut({callbackUrl: '/'})}
            className="mt-1"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content — own no scroll; AdminPageShell or AdminPageLegacy own it */}
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}

export function AdminLayout({children}: AdminLayoutProps) {
  return (
    <AdminLoadingProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminLoadingProvider>
  );
}
