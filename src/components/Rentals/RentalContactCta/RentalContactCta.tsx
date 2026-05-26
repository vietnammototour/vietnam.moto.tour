import Link from 'next/link';
import {useTranslations} from 'next-intl';

export function RentalContactCta() {
  const t = useTranslations('rentals.contactCta');
  return (
    <section className="py-12 border-t border-border text-center">
      <h2 className="type-title-md text-on-surface mb-2">{t('title')}</h2>
      <p className="type-body-md text-on-surface-secondary mb-6">
        {t('subtitle')}
      </p>
      <Link
        href="/contact"
        className="cursor-pointer inline-block bg-primary text-on-primary px-6 py-3 rounded-full type-label-sm uppercase tracking-wide"
      >
        {t('button')}
      </Link>
    </section>
  );
}
