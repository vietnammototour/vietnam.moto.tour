import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {motion, useTransform} from 'framer-motion';
import {routes} from '@/routes';
import {getDestinationName} from '@/data';
import {useCardTilt} from '@/hooks/use-card-tilt';
import type {TourCardProps} from '@/types';

export const TourCard = ({tour}: TourCardProps) => {
  const {title, imageUrl, price, duration, distance, destinationId, slug} =
    tour;
  const t = useTranslations('common');
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

  return (
    <Link
      href={routes.tours.detail.path({slug})}
      className="block h-full cursor-pointer"
    >
      <motion.div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="group bg-surface-elevated rounded-lg elevation-1 hover:elevation-2 transition-shadow overflow-hidden h-full flex flex-col"
        style={{rotateX, rotateY, scale, transformPerspective: 1000}}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseEnter={onMouseEnter}
      >
        <div className="relative overflow-hidden aspect-[3/2] bg-secondary/10">
          {tour.status && tour.status !== 'PUBLISHED' && (
            <span
              className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full type-label-sm uppercase tracking-wider text-white ${
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
            <>
              <motion.img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{x: imageX, y: imageY}}
              />
              <div className="absolute inset-0 bg-overlay/20" />
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <i className="fa fa-image text-5xl text-on-surface-tertiary" />
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="type-title-sm text-on-surface mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-on-surface-secondary type-body-sm mb-4">
            <span className="text-on-surface-accent type-title-sm">
              ${price}
            </span>{' '}
            {t('perPerson')}
          </p>
          <ul className="flex items-center gap-4 type-label-sm font-normal text-on-surface-secondary mt-auto pt-4 border-t border-border-subtle">
            <li className="flex items-center gap-1">
              <i className="fa fa-clock text-on-surface-secondary" /> {duration}
            </li>
            <li className="flex items-center gap-1">
              <i className="fa fa-road text-on-surface-secondary" /> {distance}
            </li>
            <li className="flex items-center gap-1">
              <i className="fa fa-map-marker-alt text-on-surface-secondary" />{' '}
              {getDestinationName(destinationId)}
            </li>
          </ul>
        </div>
      </motion.div>
    </Link>
  );
};
