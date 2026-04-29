import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {DestinationCardProps} from '@/types';

export const DestinationCard = ({
  destination,
  className,
}: DestinationCardProps & {className?: string}) => {
  const {name, imageUrl, tourCount, id, hasCar, hasBike} = destination;
  const t = useTranslations('common');

  return (
    <Link
      href={`/tours?destination=${id}`}
      data-testid="destination-card"
      className={`group relative rounded-lg overflow-hidden block cursor-pointer ${className ?? 'aspect-[3/2]'}`}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="type-title-lg text-white mb-1 group-hover:text-primary-light transition-colors">
          {name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="inline-block bg-primary/90 text-white type-label-sm uppercase px-3 py-1 rounded-full">
            {tourCount} {t('tours', {count: tourCount})}
          </span>
          <div className="flex items-center gap-1.5">
            {hasBike && (
              <span
                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm text-white"
                title={t('motorbike')}
              >
                <i className="fa fa-motorcycle text-xs" />
              </span>
            )}
            {hasCar && (
              <span
                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm text-white"
                title={t('car')}
              >
                <i className="fa fa-car text-xs" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
