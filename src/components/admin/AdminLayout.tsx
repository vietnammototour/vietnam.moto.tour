'use client';

import {type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useSession, signOut} from 'next-auth/react';
import {useTranslations} from 'next-intl';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({children}: AdminLayoutProps) {
  const router = useRouter();
  const {data: session} = useSession();
  const t = useTranslations('admin');

  const navItems = [
    {href: '/admin', label: t('dashboard'), icon: 'fa-tachometer-alt'},
    {href: '/admin/tours', label: t('tours'), icon: 'fa-route'},
    {
      href: '/admin/destinations',
      label: t('destinations'),
      icon: 'fa-map-marker-alt',
    },
    {
      href: '/admin/translations',
      label: t('translations'),
      icon: 'fa-language',
    },
    {href: '/admin/users', label: t('users'), icon: 'fa-users'},
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-elevated border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="type-title-sm text-primary">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg type-label-sm transition-colors ${
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
            className="type-label-sm text-on-surface-secondary hover:text-primary transition-colors mt-1"
          >
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
