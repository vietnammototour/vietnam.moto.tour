import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';
import {getUrl, contactInfo} from '@/utils';
import {TripAdvisorIcon} from '@/components/ui';

export const Footer = () => {
  const t = useTranslations('footer');
  const tNav = useTranslations('header');

  return (
    <footer className="bg-surface-inverse text-on-surface-secondary">
      {/* Top tier: Logo | Nav links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href={routes.home.path()} className="shrink-0 cursor-pointer">
            <img
              src={getUrl('assets/images/logo/logo-white.png')}
              alt="Logo"
              className="h-11 opacity-90"
            />
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-2 type-body-sm">
            <Link
              href={routes.tours.list.path()}
              className="hover:text-on-surface-inverse transition-colors cursor-pointer"
            >
              {tNav('tours')}
            </Link>
            {/* TODO: unhide when rental page is ready
            <Link
              href="/rental"
              className="hover:text-on-surface-inverse transition-colors cursor-pointer"
            >
              {tNav('rental')}
            </Link>
            */}
            <Link
              href={routes.aboutUs.path()}
              className="hover:text-on-surface-inverse transition-colors cursor-pointer"
            >
              {tNav('aboutUs')}
            </Link>
            <Link
              href={routes.contact.path()}
              className="hover:text-on-surface-inverse transition-colors cursor-pointer"
            >
              {tNav('contact')}
            </Link>
          </nav>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-on-surface-inverse/10">
        {/* Bottom tier: Contact info | Copyright + Social icons */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Contact info — stacks on mobile */}
          <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 text-[0.9rem]">
            <a
              href={`tel:${contactInfo.phone}`}
              className="flex items-center gap-1.5 hover:text-on-surface-inverse transition-colors cursor-pointer"
            >
              <i className="fa fa-phone-alt" aria-hidden="true" />
              {contactInfo.phone}
            </a>
            <span className="hidden md:inline mx-3">·</span>
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-center gap-1.5 hover:text-on-surface-inverse transition-colors cursor-pointer"
            >
              <i className="fa fa-envelope" aria-hidden="true" />
              {contactInfo.email}
            </a>
          </div>

          {/* Mobile separator between contact and copyright rows */}
          <div className="w-full border-t border-on-surface-inverse/10 md:hidden" />

          {/* Copyright + Social icons — mirrors header top bar */}
          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-4">
            <p className="type-body-sm leading-none">
              {t('copyright', {year: new Date().getFullYear()})}
            </p>
            <div className="flex items-center gap-4 text-xl">
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
                <TripAdvisorIcon className="h-[0.8em] w-auto" />
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
