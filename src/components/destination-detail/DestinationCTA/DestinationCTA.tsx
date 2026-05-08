import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';

export function DestinationCTA() {
  const t = useTranslations('destinationDetail.cta');

  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <h2 className="type-headline-md text-on-surface mb-6">{t('title')}</h2>
      <Link
        href={routes.contact.path()}
        className="inline-block bg-primary text-white type-label-lg px-8 py-3 rounded-full cursor-pointer hover:bg-primary-light transition-colors"
      >
        {t('button')}
      </Link>
    </section>
  );
}
