import {useTranslations} from 'next-intl';
import type {Tour} from '@/types';

interface TourHeroProps {
  tour: Tour;
}

export function TourHero({tour}: TourHeroProps) {
  const t = useTranslations('tourDetail');

  return (
    <section className="relative">
      <div className="relative h-72 md:h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{backgroundImage: `url(${tour.heroImage})`}}
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          <h1 className="type-display-sm md:type-display-lg text-on-surface-inverse mb-3">
            {tour.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-inverse/80 type-body-sm">
            <span className="flex items-center gap-1.5">
              <i className="fa fa-map-marker-alt" /> {tour.location}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-clock" /> {tour.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-road" /> {tour.distance}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-motorcycle" /> {tour.transportation}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-star" /> {tour.rating}
            </span>
          </div>
          <div className="mt-4 text-on-surface-inverse">
            <span className="type-headline-lg">{t('from')} ${tour.price}</span>
            <span className="type-body-sm ml-1 opacity-80">{t('perPerson')}</span>
          </div>
        </div>
      </div>
      <div className="bg-surface-alt py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
            <a href="/" className="hover:text-primary transition-colors">{t('breadcrumbHome')}</a>
            <span>/</span>
            <a href="/tours" className="hover:text-primary transition-colors">{t('breadcrumbTours')}</a>
            <span>/</span>
            <span className="text-on-surface type-label-lg">{tour.title}</span>
          </nav>
        </div>
      </div>
    </section>
  );
}
