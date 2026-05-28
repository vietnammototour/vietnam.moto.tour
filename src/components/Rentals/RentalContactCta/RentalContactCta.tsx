import Link from 'next/link';
import {useTranslations} from 'next-intl';

export function RentalContactCta() {
  const t = useTranslations('rentals.contactCta');
  return (
    <section className="relative py-20 text-center overflow-hidden">
      <div
        className="absolute top-0 left-0 h-px bg-primary w-[110%] -ml-[5%] -rotate-[1.5deg]"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="type-display-lg text-on-surface mb-4">{t('title')}</h2>
        <p className="type-headline-md text-primary mb-12">{t('subtitle')}</p>
        <Link
          href="/contact"
          className="cursor-pointer inline-flex items-center justify-center bg-primary text-on-primary px-12 py-5 type-headline-md hover:bg-primary-light transition-all hover:-translate-y-1 active:translate-y-0"
        >
          {t('button')}
        </Link>
      </div>
    </section>
  );
}
