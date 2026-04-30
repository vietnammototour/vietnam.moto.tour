'use client';

import {type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useSession, signOut} from 'next-auth/react';
import {ProgressBar} from './ProgressBar';
import {
  AdminLoadingProvider,
  useAdminLoading,
} from '@/contexts/AdminLoadingContext';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutInner({children}: AdminLayoutProps) {
  const router = useRouter();
  const {data: session} = useSession();
  const {loading} = useAdminLoading();

  const navItems = [
    {href: '/admin', label: 'Dashboard', icon: 'fa-tachometer-alt'},
    {href: '/admin/tours', label: 'Tours', icon: 'fa-route'},
    {
      href: '/admin/destinations',
      label: 'Destinations',
      icon: 'fa-map-marker-alt',
    },
    {href: '/admin/translations', label: 'Translations', icon: 'fa-language'},
    {href: '/admin/users', label: 'Users', icon: 'fa-users'},
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      <ProgressBar loading={loading} />

      {/* Sidebar */}
      <aside className="w-64 bg-surface-elevated border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="type-title-sm text-primary cursor-pointer">
            VMT Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? router.pathname === '/admin'
                : router.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg type-label-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="type-label-sm text-on-surface-secondary truncate">
            {session?.user.name}
          </p>
          <button
            onClick={() => signOut({callbackUrl: '/'})}
            className="type-label-sm text-on-surface-secondary hover:text-primary transition-colors mt-1 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
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
