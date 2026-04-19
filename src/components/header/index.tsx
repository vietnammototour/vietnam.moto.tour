'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import {useScrollDirection} from '@/hooks/useScrollDirection';
import {getUrl} from '@/utils';
import {contactInfo} from '@/utils';
import destinationsData from '@/data/destinations.json';
import {LanguageSwitcher} from '@/components/language-switcher';
import ThemeToggle from '@/components/theme-toggle';

export const Header = () => {
  const router = useRouter();
  const {scrollDirection, scrollY} = useScrollDirection();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations('header');

  const isSticky = scrollY > 100;
  const isHidden = scrollDirection === 'down' && scrollY > 200;

  const navLinks = [
    {href: '/', label: t('home'), active: router.pathname === '/'},
    {
      href: '/tours',
      label: t('tours'),
      active: router.pathname.startsWith('/tours'),
      children: destinationsData.map((d) => ({
        href: '/tours',
        label: d.name,
      })),
    },
    {
      href: '/rental',
      label: t('rental'),
      active: router.pathname.startsWith('/rental'),
      children: [
        {href: '/rental', label: t('motorbike')},
        {href: '/rental', label: t('car')},
      ],
    },
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
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-surface-inverse text-on-surface-inverse text-sm hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          <div className="flex items-center gap-6">
            <a
              href={`tel:${contactInfo.phone}`}
              className="flex items-center gap-2 hover:text-primary-light transition-colors"
            >
              <span className="icon-phone-call" />
              {contactInfo.phone}
            </a>
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-center gap-2 hover:text-primary-light transition-colors"
            >
              <span className="icon-at" />
              {contactInfo.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={contactInfo.youtubeLink}
              className="hover:text-primary-light transition-colors"
            >
              <i className="fab fa-youtube" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              className="hover:text-primary-light transition-colors"
            >
              <i className="fab fa-tripadvisor" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
              className="hover:text-primary-light transition-colors"
            >
              <i className="fab fa-whatsapp" />
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
            <Link href="/" className="flex-shrink-0">
              <img
                src={getUrl('assets/images/logo/logo.jpeg')}
                alt="Vietnam Motorcycle Tour"
                className="h-11 lg:h-14"
              />
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <div key={link.href + link.label} className="relative group">
                  <Link
                    href={link.href}
                    className={`text-sm font-semibold uppercase tracking-wide transition-colors py-6 ${
                      link.active
                        ? 'text-primary'
                        : 'text-on-surface hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-surface-elevated rounded-lg shadow-lg py-2 min-w-[180px] border border-border">
                        {link.children.map((child, i) => (
                          <Link
                            key={i}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-alt hover:text-primary transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="hidden lg:flex items-center ml-4">
              <LanguageSwitcher />
            </div>
            <button
              className="lg:hidden flex flex-col gap-1.5 p-2"
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
            className="text-on-surface-inverse text-xl hover:text-primary-light transition-colors"
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
              className={`block py-3 border-b border-on-surface-inverse/10 text-sm font-medium uppercase tracking-wide transition-colors ${
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
          <a
            href={`mailto:${contactInfo.email}`}
            className="flex items-center gap-2 text-sm text-on-surface-secondary hover:text-on-surface-inverse mb-3"
          >
            <i className="fa fa-envelope" /> {contactInfo.email}
          </a>
          <a
            href={`tel:${contactInfo.phone}`}
            className="flex items-center gap-2 text-sm text-on-surface-secondary hover:text-on-surface-inverse mb-4"
          >
            <i className="fa fa-phone-alt" /> {contactInfo.phone}
          </a>
          <div className="flex gap-4">
            <a
              href={contactInfo.youtubeLink}
              className="text-on-surface-secondary hover:text-on-surface-inverse"
            >
              <i className="fab fa-youtube" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              className="text-on-surface-secondary hover:text-on-surface-inverse"
            >
              <i className="fab fa-tripadvisor" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
              className="text-on-surface-secondary hover:text-on-surface-inverse"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>
          <div className="mt-4 pt-4 border-t border-on-surface-inverse/10">
            <LanguageSwitcher />
          </div>
          <div className="mt-4 pt-4 border-t border-on-surface-inverse/10">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
};
