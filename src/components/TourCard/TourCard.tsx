import Link from 'next/link';
import {useTranslations, useLocale} from 'next-intl';
import {motion, useTransform} from 'framer-motion';
import {routes} from '@/routes';
import {useCardTilt} from '@/hooks/use-card-tilt';
import type * as VMT from '@/domain';
import {getMinPriceByType} from '@/domain';

type Props = {
  tour: VMT.Tour;
  interactive?: boolean;
};

export const TourCard = ({tour, interactive = true}: Props) => {
  const {imageUrl, duration, distance, slug} = tour;
  const groupPrice = getMinPriceByType(tour.pricingGroups, 'group-size');
  const vehiclePrice = getMinPriceByType(tour.pricingGroups, 'vehicle');
  const locale = useLocale();
  const title = tour.title[locale as 'en' | 'vi'] ?? tour.title.vi;
  const t = useTranslations('common');

  const priceChips: {
    key: string;
    price: number;
    unit: string;
    chipClass: string;
  }[] = [];
  if (groupPrice !== null) {
    priceChips.push({
      key: 'group',
      price: groupPrice,
      unit: t('priceUnitPerson'),
      chipClass: 'bg-primary/90',
    });
  }
  if (vehiclePrice !== null) {
    priceChips.push({
      key: 'vehicle',
      price: vehiclePrice,
      unit: t('priceUnitVehicle'),
      chipClass: 'bg-secondary/90',
    });
  }

  const stats = [
    {
      key: 'duration',
      label: t('durationLabel'),
      value: t('daysCount', {count: duration}),
      icon: 'fa-clock',
    },
    {
      key: 'distance',
      label: t('distanceLabel'),
      value: t('kilometersCount', {count: distance}),
      icon: 'fa-road',
    },
    {
      key: 'location',
      label: t('locationLabel'),
      value: tour.destinationName ?? '',
      icon: 'fa-map-marker-alt',
    },
  ];
  const {
    ref,
    rotateX,
    rotateY,
    scale,
    onMouseMove,
    onMouseLeave,
    onMouseEnter,
  } = useCardTilt(4);

  const imageX = useTransform(rotateY, [-4, 4], [8, -8]);
  const imageY = useTransform(rotateX, [-4, 4], [-8, 8]);

  const cardInner = (
    <motion.div
      ref={interactive ? (ref as React.RefObject<HTMLDivElement>) : undefined}
      className="group bg-surface-elevated rounded-lg elevation-1 hover:elevation-2 transition-shadow overflow-hidden h-full flex flex-col"
      style={
        interactive
          ? {rotateX, rotateY, scale, transformPerspective: 1000}
          : undefined
      }
      onMouseMove={interactive ? onMouseMove : undefined}
      onMouseLeave={interactive ? onMouseLeave : undefined}
      onMouseEnter={interactive ? onMouseEnter : undefined}
    >
      <div className="relative overflow-hidden aspect-[3/2] bg-secondary/10">
        {tour.status && tour.status !== 'PUBLISHED' && (
          <span
            className={`absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full type-label-sm uppercase tracking-wider text-white ${
              tour.status === 'DRAFT'
                ? 'bg-amber-500/90'
                : tour.status === 'FEATURED'
                  ? 'bg-blue-500/90'
                  : 'bg-gray-500/90'
            }`}
          >
            {tour.status}
          </span>
        )}
        {imageUrl ? (
          <motion.img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={interactive ? {x: imageX, y: imageY} : undefined}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <i className="fa fa-image text-5xl text-on-surface-tertiary" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        {priceChips.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
            {priceChips.map((chip) => (
              <div
                key={chip.key}
                className={`flex items-baseline gap-1.5 rounded-full backdrop-blur-sm px-2.5 py-1 text-white ${chip.chipClass}`}
              >
                <span className="type-label-sm uppercase tracking-wider opacity-90 text-[0.6rem] leading-none">
                  {chip.unit}
                </span>
                <span className="type-title-sm leading-none">
                  ${chip.price}
                </span>
              </div>
            ))}
          </div>
        )}

        <h3 className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 pt-8 text-center text-2xl font-semibold leading-tight text-white drop-shadow-sm group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <ul className="grid grid-cols-3 gap-2 mt-auto">
          {stats.map((s, i) => (
            <li
              key={s.key}
              className={`flex flex-col gap-1 px-2 ${
                i > 0 ? 'border-l border-border-subtle' : ''
              }`}
            >
              <span className="type-label-sm uppercase tracking-wider text-on-surface-tertiary text-[0.65rem] leading-none">
                {s.label}
              </span>
              <span className="flex items-center gap-1.5 type-body-sm font-semibold text-on-surface truncate">
                <i
                  className={`fa ${s.icon} text-primary/70 text-xs shrink-0`}
                  aria-hidden="true"
                />
                <span className="truncate">{s.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );

  if (!interactive) {
    return <div className="block h-full">{cardInner}</div>;
  }

  return (
    <Link
      href={routes.tours.detail.path({slug})}
      className="block h-full cursor-pointer"
    >
      {cardInner}
    </Link>
  );
};
