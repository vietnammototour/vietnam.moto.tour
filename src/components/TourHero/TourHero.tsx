import Link from 'next/link';
import {useTranslations, useLocale} from 'next-intl';
import {motion, useMotionTemplate} from 'framer-motion';
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {clipReveal, slideFromLeft} from '@/utils/motion-variants';
import {routes} from '@/routes';
import type * as VMT from '@/domain';
import {getMinPrice} from '@/domain';
import {useEditable} from '@/components/Admin/EditableContext';

type TourHeroProps = {
  tour?: VMT.Tour;
  preview?: {
    heroImage: string;
    destinationName: string;
  };
  destinationSlot?: React.ReactNode;
};

export function TourHero({tour, preview, destinationSlot}: TourHeroProps) {
  const t = useTranslations('tourDetail');
  const tc = useTranslations('common');
  const locale = useLocale();
  const ctx = useEditable();
  const editable = !!ctx?.editable;
  const localeKey = (ctx?.locale ?? (locale as 'en' | 'vi')) as 'en' | 'vi';
  const {
    ref: spotlightRef,
    x: spotlightX,
    y: spotlightY,
    onMouseMove: onSpotlightMove,
    onMouseLeave: onSpotlightLeave,
  } = useCursorSpotlight(250, 0.12);
  const spotlightBg = useMotionTemplate`radial-gradient(250px circle at ${spotlightX}px ${spotlightY}px, rgb(var(--color-spotlight-rgb) / 0.12), transparent)`;

  const isPreview = !!preview;
  const heroImage = preview?.heroImage ?? tour?.destinationHeroImage;
  const tourTitle = tour?.title[localeKey] ?? tour?.title.vi ?? '';
  const displayName = preview?.destinationName ?? tourTitle;

  const inputBaseClasses =
    'bg-transparent text-on-surface border border-dashed border-white/40 hover:border-white focus:border-white rounded px-1 outline-none';

  return (
    <section className="relative">
      <div
        ref={spotlightRef as React.RefObject<HTMLDivElement>}
        onMouseMove={onSpotlightMove}
        onMouseLeave={onSpotlightLeave}
        className="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden texture-grain-warm"
      >
        {heroImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage: `url(${heroImage})`}}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{background: spotlightBg}}
        />

        {editable && destinationSlot && (
          <div className="absolute top-4 left-4 z-30">{destinationSlot}</div>
        )}

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          {editable && tour ? (
            <input
              aria-label="Title"
              value={tour.title[localeKey] ?? ''}
              onChange={(e) =>
                ctx!.onFieldChange(
                  localeKey === 'en' ? 'title.en' : 'title.vi',
                  e.target.value,
                )
              }
              className={`type-display-sm md:type-display-lg ${inputBaseClasses} mb-3 max-w-[70%] w-full`}
            />
          ) : (
            <motion.h1
              variants={clipReveal}
              initial="hidden"
              animate="visible"
              className="type-display-sm md:type-display-lg text-on-surface mb-3 max-w-[70%]"
            >
              {displayName}
            </motion.h1>
          )}

          {!isPreview && tour && (
            <>
              {editable ? (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface/80 type-body-sm">
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-map-marker-alt" />{' '}
                    {tour.destinationName[localeKey]}
                  </span>
                  <label className="flex items-center gap-1.5">
                    <i className="fa fa-clock" />
                    <input
                      aria-label="Duration"
                      type="number"
                      min={0}
                      value={tour.duration}
                      onChange={(e) =>
                        ctx!.onFieldChange('duration', Number(e.target.value))
                      }
                      className={`${inputBaseClasses} w-16`}
                    />
                    {t('days')}
                  </label>
                  <label className="flex items-center gap-1.5">
                    <i className="fa fa-road" />
                    <input
                      aria-label="Distance"
                      type="number"
                      min={0}
                      value={tour.distance}
                      onChange={(e) =>
                        ctx!.onFieldChange('distance', Number(e.target.value))
                      }
                      className={`${inputBaseClasses} w-20`}
                    />
                    km
                  </label>
                  <label className="flex items-center gap-1.5">
                    <i className="fa fa-motorcycle" />
                    <input
                      aria-label="Transportation"
                      type="text"
                      value={tour.transportation}
                      onChange={(e) =>
                        ctx!.onFieldChange('transportation', e.target.value)
                      }
                      className={`${inputBaseClasses} w-40`}
                    />
                  </label>
                </div>
              ) : (
                <motion.div
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{delay: 0.3}}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface/80 type-body-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-map-marker-alt" />{' '}
                    {tour.destinationName[localeKey]}
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
              )}

              {!editable && (
                <motion.div
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{delay: 0.5}}
                  className="mt-4 text-on-surface"
                >
                  <span className="type-headline-lg">
                    {t('from')} ${getMinPrice(tour.pricingGroups)}
                  </span>
                  <span className="type-body-sm ml-1 opacity-80">
                    {t('perPerson')}
                  </span>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {!editable && !isPreview && tour && (
        <div className="bg-surface-alt py-3">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
              <Link
                href={routes.home.path()}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {tc('breadcrumbHome')}
              </Link>
              <span>/</span>
              <Link
                href={routes.tours.list.path()}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {tc('breadcrumbTours')}
              </Link>
              <span>/</span>
              <span className="text-on-surface type-label-lg">{tourTitle}</span>
            </nav>
          </div>
        </div>
      )}
    </section>
  );
}
