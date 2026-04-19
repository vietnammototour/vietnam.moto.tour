import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {TourCardProps} from '@/types';

export const TourCard = ({tour}: TourCardProps) => {
  const {title, imageUrl, rating, price, duration, distance, location} = tour;
  const t = useTranslations('common');

  return (
    <div className="group bg-surface-elevated rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
      <div className="relative overflow-hidden aspect-[3/2]">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-overlay/20" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="type-title-sm text-on-surface mb-2 group-hover:text-primary transition-colors">
          <Link href="/tours">{title}</Link>
        </h3>
        <p className="text-on-surface-secondary type-body-sm mb-4">
          <span className="text-on-surface-accent type-title-sm">${price}</span>{' '}
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
            {location}
          </li>
        </ul>
      </div>
    </div>
  );
};
