'use client';

import {useState, useEffect, type ReactNode} from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    const handler = () => setMobileOpen(false);
    router.events.on('routeChangeComplete', handler);
    return () => router.events.off('routeChangeComplete', handler);
  }, [router.events]);

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

  const sidebarBody = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link
          href={routes.home.path()}
          className="type-title-sm text-primary cursor-pointer"
        >
          VMT Admin
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center text-on-surface-secondary hover:bg-surface-alt cursor-pointer"
        >
          <i className="fa fa-times" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === routes.admin.dashboard.path()
              ? router.pathname === routes.admin.dashboard.path()
              : router.pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 type-body-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
              }`}
            >
              <i className={`fas ${item.icon} w-6 text-center`} />
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
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <ProgressBar loading={loading} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface-elevated border-r border-border flex-col">
        {sidebarBody}
      </aside>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 bg-overlay transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-elevated border-r border-border flex flex-col transition-transform duration-200 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin navigation"
      >
        {sidebarBody}
      </aside>

      {/* Main content — owns no scroll; AdminPageShell or AdminPageLegacy own it */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3 bg-surface-elevated border-b border-border">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-alt cursor-pointer"
          >
            <i className="fa fa-bars text-lg" />
          </button>
          <span className="type-title-sm text-primary">VMT Admin</span>
        </div>
        {children}
      </main>
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
