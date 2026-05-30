'use client';

import {useState, useEffect, type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useSession, signOut} from 'next-auth/react';
import {routes} from '@/routes';
import {Avatar} from '@/components/ui';
import {ProgressBar} from '../ProgressBar';
import {adminNavGroups} from './AdminLayout.nav';
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
      <nav className="flex-1 p-3 overflow-y-auto">
        {adminNavGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 pb-1.5 type-label-sm uppercase tracking-[0.14em] text-on-surface-tertiary">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === routes.admin.dashboard.path()
                    ? router.pathname === routes.admin.dashboard.path()
                    : router.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3 py-2 rounded-lg type-body-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-primary'
                        : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
                    }`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg border border-border bg-surface">
          <Avatar
            src={session?.user.imageUrl ?? null}
            name={session?.user.name ?? 'Admin'}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="type-body-sm font-semibold text-on-surface truncate">
              {session?.user.name ?? 'Admin'}
            </p>
            <p className="type-label-sm text-on-surface-tertiary truncate">
              {session?.user.roleLabel ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({callbackUrl: '/'})}
            aria-label="Logout"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-on-surface-secondary hover:text-on-surface hover:bg-surface-alt cursor-pointer"
          >
            <i className="fa fa-power-off text-xs" />
          </button>
        </div>
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
