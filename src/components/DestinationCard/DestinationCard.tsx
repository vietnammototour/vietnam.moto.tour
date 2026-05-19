import Link from 'next/link';
import {motion} from 'framer-motion';
import {useTranslations, useLocale} from 'next-intl';
import type * as VMT from '@/domain';
import {routes} from '@/routes';

type Props = {
  destination: VMT.DestinationWithStats;
};

export const DestinationCard = ({
  destination,
  className,
}: Props & {className?: string}) => {
  const {name, imageUrl, slug, carOnlyCount, bikeOnlyCount, bikeAndCarCount} =
    destination;
  const t = useTranslations('common');
  const locale = useLocale() as 'en' | 'vi';
  const displayName = name[locale];

  const chips: {
    key: string;
    icon: React.ReactNode;
    count: number;
    ariaLabel: string;
    colorClass: string;
  }[] = [
    {
      key: 'car',
      icon: <i className="fa fa-car text-xs" aria-hidden="true" />,
      count: carOnlyCount,
      ariaLabel: `${carOnlyCount} ${t('car')} ${t('tours', {count: carOnlyCount})}`,
      colorClass: 'bg-sky-500/95 text-white',
    },
    {
      key: 'bike',
      icon: <i className="fa fa-motorcycle text-xs" aria-hidden="true" />,
      count: bikeOnlyCount,
      ariaLabel: `${bikeOnlyCount} ${t('motorbike')} ${t('tours', {count: bikeOnlyCount})}`,
      colorClass: 'bg-emerald-500/95 text-white',
    },
    {
      key: 'bike-car',
      icon: (
        <span className="inline-flex items-center gap-0.5">
          <i className="fa fa-motorcycle text-xs" aria-hidden="true" />
          <span aria-hidden="true">/</span>
          <i className="fa fa-car text-xs" aria-hidden="true" />
        </span>
      ),
      count: bikeAndCarCount,
      ariaLabel: `${bikeAndCarCount} ${t('motorbike')}/${t('car')} ${t('tours', {count: bikeAndCarCount})}`,
      colorClass: 'bg-fuchsia-500/95 text-white',
    },
  ].filter((c) => c.count > 0);

  return (
    <motion.div
      whileHover={{scale: 1.02}}
      transition={{duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94]}}
      className={className ?? 'aspect-[3/2]'}
    >
      <Link
        href={routes.destinations.detail.path({slug})}
        data-testid="destination-card"
        className="group relative rounded-lg overflow-hidden block cursor-pointer elevation-1 hover:elevation-2 transition-all duration-300 w-full h-full"
      >
        <img
          src={imageUrl}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="type-title-lg text-white mb-1 group-hover:text-primary-light transition-colors">
            {displayName}
          </h2>
          <div className="flex items-center flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full type-label-sm uppercase ${chip.colorClass}`}
                aria-label={chip.ariaLabel}
              >
                {chip.icon}
                <span className="leading-none tabular-nums">
                  {chip.count} {t('tours', {count: chip.count})}
                </span>
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
