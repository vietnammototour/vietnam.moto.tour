import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {DestinationCardProps} from '@/types';

export const DestinationCard = ({
  destination,
  className,
}: DestinationCardProps & {className?: string}) => {
  const {name, imageUrl, tours} = destination;
  const t = useTranslations('common');

  return (
    <div
      className={`group relative rounded-lg overflow-hidden ${className ?? 'aspect-[3/2]'}`}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="type-title-lg text-white mb-1">
          <Link
            href="/tours"
            className="hover:text-primary-light transition-colors"
          >
            {name}
          </Link>
        </h2>
        <span className="inline-block bg-primary/90 text-white type-label-sm uppercase px-3 py-1 rounded-full">
          {tours} {t('tours')}
        </span>
      </div>
    </div>
  );
};
