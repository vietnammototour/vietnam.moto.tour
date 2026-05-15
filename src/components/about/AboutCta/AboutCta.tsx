import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';

export function AboutCta() {
  const t = useTranslations('about.cta');

  return (
    <section className="bg-primary py-16 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="text-white">
          <h2 className="type-headline-md font-extrabold uppercase tracking-tight">
            {t('headline')}
          </h2>
          <p className="mt-2 text-white/80">{t('subhead')}</p>
        </div>
        <Link
          href={routes.contact.path()}
          className="bg-secondary text-white type-label-sm uppercase tracking-widest px-8 py-4 rounded-none hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          {t('button')}
        </Link>
      </div>
    </section>
  );
}
