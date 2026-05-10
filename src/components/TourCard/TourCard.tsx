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
    textClass: string;
  }[] = [];
  if (groupPrice !== null) {
    priceChips.push({
      key: 'group',
      price: groupPrice,
      unit: t('priceUnitPerson'),
      textClass: 'text-primary',
    });
  }
  if (vehiclePrice !== null) {
    priceChips.push({
      key: 'vehicle',
      price: vehiclePrice,
      unit: t('priceUnitVehicle'),
      textClass: 'text-secondary',
    });
  }

  const stats = [
    {
      key: 'duration',
      value: t('daysCount', {count: duration}),
      icon: 'fa-clock',
    },
    {
      key: 'distance',
      value: t('kilometersCount', {count: distance}),
      icon: 'fa-road',
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
      className="group bg-surface-elevated rounded-lg border border-border elevation-2 hover:elevation-4 transition-shadow overflow-hidden h-full flex flex-col"
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
            <svg
              className="w-14 h-14 text-on-surface-tertiary"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 pt-8">
          <ul className="grid grid-cols-2 gap-2">
            {stats.map((s, i) => (
              <li
                key={s.key}
                className={`flex ${
                  i > 0
                    ? 'border-l border-white/20 justify-end text-right pl-2'
                    : ''
                }`}
              >
                <span
                  className={`flex items-center gap-1.5 type-body-sm font-semibold text-white truncate ${
                    i > 0 ? 'flex-row-reverse' : ''
                  }`}
                >
                  <i
                    className={`fa ${s.icon} text-on-surface-secondary text-xs shrink-0`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{s.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="p-5 flex items-end gap-4 flex-1">
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="type-title-lg font-semibold leading-tight text-on-surface group-hover:text-primary transition-colors truncate">
            {title}
          </h3>
          {tour.destinationName && (
            <p className="mt-2 flex items-center gap-1.5 type-label-sm uppercase tracking-wider text-on-surface-secondary">
              <i
                className="fa fa-map-marker-alt text-[0.7rem]"
                aria-hidden="true"
              />
              <span className="truncate">{tour.destinationName}</span>
            </p>
          )}
        </div>
        {priceChips.length > 0 && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            {priceChips.map((chip) => (
              <div
                key={chip.key}
                className={`flex items-baseline gap-1.5 ${chip.textClass}`}
              >
                <span className="type-label-sm uppercase tracking-wider text-[0.6rem] leading-none opacity-80">
                  {chip.unit}
                </span>
                <span className="type-title-sm font-semibold leading-none">
                  ${chip.price}
                </span>
              </div>
            ))}
          </div>
        )}
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
