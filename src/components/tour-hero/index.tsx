import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {motion, useMotionTemplate} from 'framer-motion';
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {clipReveal, slideFromLeft} from '@/utils/motion-variants';
import {getDestinationName} from '@/data';
import type {Tour} from '@/types';

interface TourHeroProps {
  tour: Tour;
}

export function TourHero({tour}: TourHeroProps) {
  const t = useTranslations('tourDetail');
  const spotlight = useCursorSpotlight(250, 0.12);
  const spotlightBg = useMotionTemplate`radial-gradient(250px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.12), transparent)`;

  return (
    <section className="relative">
      <div
        ref={spotlight.ref as React.RefObject<HTMLDivElement>}
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden texture-grain-warm"
      >
        {tour.destinationHeroImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage: `url(${tour.destinationHeroImage})`}}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{background: spotlightBg}}
        />
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          <motion.h1
            variants={clipReveal}
            initial="hidden"
            animate="visible"
            className="type-display-sm md:type-display-lg text-on-surface-inverse mb-3 max-w-[70%]"
          >
            {tour.title}
          </motion.h1>
          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            transition={{delay: 0.3}}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-inverse/80 type-body-sm"
          >
            <span className="flex items-center gap-1.5">
              <i className="fa fa-map-marker-alt" />{' '}
              {getDestinationName(tour.destinationId)}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-clock" /> {tour.duration} {t('days')}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-road" /> {tour.distance} km
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa fa-motorcycle" /> {tour.transportation}
            </span>
          </motion.div>
          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            transition={{delay: 0.5}}
            className="mt-4 text-on-surface-inverse"
          >
            <span className="type-headline-lg">
              {t('from')} ${tour.price}
            </span>
            <span className="type-body-sm ml-1 opacity-80">
              {t('perPerson')}
            </span>
          </motion.div>
        </div>
      </div>
      <div className="bg-surface-alt py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
            <Link
              href="/"
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {t('breadcrumbHome')}
            </Link>
            <span>/</span>
            <Link
              href="/tours"
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {t('breadcrumbTours')}
            </Link>
            <span>/</span>
            <span className="text-on-surface type-label-lg">{tour.title}</span>
          </nav>
        </div>
      </div>
    </section>
  );
}
