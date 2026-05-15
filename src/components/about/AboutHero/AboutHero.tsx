import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {TeamMember} from '@/domain';
import {PolaroidStack} from './PolaroidStack';

type AboutHeroProps = {
  featured: TeamMember[];
  locale: 'vi' | 'en';
};

export function AboutHero({featured, locale}: AboutHeroProps) {
  const t = useTranslations('about.hero');

  return (
    <section className="bg-secondary py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="type-label-sm uppercase tracking-widest text-primary">
              {t('eyebrow')}
            </p>
            <h1 className="mt-4 type-headline-lg font-extrabold uppercase tracking-tight text-white">
              {t('headline')}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">{t('lead')}</p>
            <Link
              href="#team"
              className="mt-8 inline-flex items-center gap-2 text-primary hover:text-primary-light cursor-pointer type-label-sm uppercase tracking-widest"
            >
              {t('ctaMeetTeam')} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <PolaroidStack featured={featured} locale={locale} />
        </div>
      </div>
    </section>
  );
}
