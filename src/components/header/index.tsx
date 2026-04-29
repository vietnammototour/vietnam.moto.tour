'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import {useSession, signOut} from 'next-auth/react';
import {useScrollDirection} from '@/hooks/useScrollDirection';
import {getUrl} from '@/utils';
import {contactInfo} from '@/utils';
import {LanguageSwitcher} from '@/components/language-switcher';
import ThemeToggle from '@/components/theme-toggle';
import {LoginModal} from '@/components/admin/LoginModal';

export const Header = () => {
  const router = useRouter();
  const {scrollDirection, scrollY} = useScrollDirection();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {data: session} = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const t = useTranslations('header');

  const isSticky = scrollY > 100;
  const isHidden = scrollDirection === 'down' && scrollY > 200;

  const navLinks = [
    {href: '/', label: t('home'), active: router.pathname === '/'},
    {
      href: '/tours',
      label: t('tours'),
      active: router.pathname.startsWith('/tours'),
    },
    // TODO: unhide when rental page is ready
    // {
    //   href: '/rental',
    //   label: t('rental'),
    //   active: router.pathname.startsWith('/rental'),
    //   children: [
    //     {href: '/rental', label: t('motorbike')},
    //     {href: '/rental', label: t('car')},
    //   ],
    // },
    {
      href: '/about-us',
      label: t('aboutUs'),
      active: router.pathname === '/about-us',
    },
    {
      href: '/contact',
      label: t('contact'),
      active: router.pathname === '/contact',
    },
    ...(session
      ? [
          {
            href: '/admin',
            label: t('admin'),
            active: router.pathname.startsWith('/admin'),
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-surface-inverse text-on-surface-inverse type-body-sm hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-end py-2">
          <div className="flex items-center gap-4">
            <a
              href={contactInfo.youtubeLink}
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-light transition-colors cursor-pointer"
            >
              <i className="fab fa-youtube" aria-hidden="true" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              aria-label="TripAdvisor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-light transition-colors cursor-pointer"
            >
              <i className="fab fa-tripadvisor" aria-hidden="true" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-light transition-colors cursor-pointer"
            >
              <i className="fab fa-whatsapp" aria-hidden="true" />
            </a>
            <span className="mx-2 text-on-surface-inverse/30">|</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isSticky
            ? 'bg-surface-elevated/95 backdrop-blur-md shadow-md'
            : 'bg-surface-elevated'
        } ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex-shrink-0 cursor-pointer">
              <img
                src={getUrl('assets/images/logo/logo-amber-dark.png')}
                alt="Vietnam Motorcycle Tour"
                className="h-11 lg:h-14 block dark:hidden"
              />
              <img
                src={getUrl('assets/images/logo/logo-white.png')}
                alt="Vietnam Motorcycle Tour"
                className="h-11 lg:h-14 hidden dark:block"
              />
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={`type-label-lg uppercase transition-colors py-6 cursor-pointer ${
                    link.active
                      ? 'text-primary'
                      : 'text-on-surface hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="hidden lg:flex items-center gap-4 ml-4">
              <LanguageSwitcher />
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="type-label-sm text-on-surface-secondary">
                    {session.user.name}
                  </span>
                  <button
                    onClick={() => signOut({redirect: false})}
                    className="type-label-sm text-on-surface-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="type-label-sm uppercase text-on-surface hover:text-primary transition-colors cursor-pointer"
                >
                  {t('login')}
                </button>
              )}
            </div>
            <button
              className="lg:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span className="block w-6 h-0.5 bg-on-surface" />
              <span className="block w-6 h-0.5 bg-on-surface" />
              <span className="block w-6 h-0.5 bg-on-surface" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-overlay transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile nav panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-72 bg-surface-inverse text-on-surface-inverse transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-on-surface-inverse/10">
          <img
            src={getUrl('assets/images/logo/logo-white.png')}
            alt="Logo"
            className="h-10"
          />
          <button
            onClick={() => setMobileOpen(false)}
            className="text-on-surface-inverse text-xl hover:text-primary-light transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <i className="fa fa-times" />
          </button>
        </div>
        <nav className="p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 border-b border-on-surface-inverse/10 type-label-lg uppercase transition-colors cursor-pointer ${
                link.active
                  ? 'text-primary-light'
                  : 'text-on-surface-inverse hover:text-primary-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 mt-4">
          <div className="flex gap-4">
            <a
              href={contactInfo.youtubeLink}
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-secondary hover:text-on-surface-inverse"
            >
              <i className="fab fa-youtube" aria-hidden="true" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              aria-label="TripAdvisor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-secondary hover:text-on-surface-inverse"
            >
              <i className="fab fa-tripadvisor" aria-hidden="true" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-secondary hover:text-on-surface-inverse"
            >
              <i className="fab fa-whatsapp" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-on-surface-inverse/10">
            <LanguageSwitcher />
          </div>
          <div className="mt-4 pt-4 border-t border-on-surface-inverse/10">
            <ThemeToggle />
          </div>
          <div className="mt-4 pt-4 border-t border-on-surface-inverse/10">
            {session ? (
              <div className="space-y-2">
                <p className="type-label-sm text-on-surface-inverse/70">
                  {session.user.name}
                </p>
                <button
                  onClick={() => {
                    signOut({redirect: false});
                    setMobileOpen(false);
                  }}
                  className="type-label-sm text-on-surface-inverse hover:text-primary-light transition-colors cursor-pointer"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
                className="type-label-sm text-on-surface-inverse hover:text-primary-light transition-colors cursor-pointer"
              >
                {t('login')}
              </button>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
