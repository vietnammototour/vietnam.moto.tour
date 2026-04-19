import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {getUrl, contactInfo} from '@/utils';

export const Footer = () => {
  const t = useTranslations('footer');
  const tNav = useTranslations('header');

  return (
    <footer className="bg-surface-inverse text-on-surface-secondary">
      {/* Top tier: Logo | Nav links | Social icons */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src={getUrl('assets/images/logo/logo-white.png')}
              alt="Logo"
              className="h-11 opacity-90"
            />
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 type-body-sm">
            <Link
              href="/tours"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {tNav('tours')}
            </Link>
            {/* TODO: unhide when rental page is ready
            <Link
              href="/rental"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {tNav('rental')}
            </Link>
            */}
            <Link
              href="/about-us"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {tNav('aboutUs')}
            </Link>
            <Link
              href="/contact"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {tNav('contact')}
            </Link>
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a
              href={contactInfo.youtubeLink}
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-on-surface-inverse transition-colors"
            >
              <i className="fab fa-youtube" aria-hidden="true" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              aria-label="TripAdvisor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-on-surface-inverse transition-colors"
            >
              <i className="fab fa-tripadvisor" aria-hidden="true" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-on-surface-inverse transition-colors"
            >
              <i className="fab fa-whatsapp" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-on-surface-inverse/10">
        {/* Bottom tier: Copyright | Contact info */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="type-body-sm">
            {t('copyright', {year: new Date().getFullYear()})}
          </p>
          <div className="flex items-center gap-2 type-body-sm">
            <a
              href={`tel:${contactInfo.phone}`}
              className="flex items-center gap-1.5 hover:text-on-surface-inverse transition-colors"
            >
              <i className="fa fa-phone-alt" aria-hidden="true" />
              {contactInfo.phone}
            </a>
            <span>·</span>
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-center gap-1.5 hover:text-on-surface-inverse transition-colors"
            >
              <i className="fa fa-envelope" aria-hidden="true" />
              {contactInfo.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
