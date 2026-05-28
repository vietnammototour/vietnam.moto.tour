import Link from 'next/link';
import Image from 'next/image';
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
  }[] = [
    {
      key: 'car',
      icon: <i className="fa fa-car text-xs" aria-hidden="true" />,
      count: carOnlyCount,
      ariaLabel: `${carOnlyCount} ${t('car')} ${t('tours', {count: carOnlyCount})}`,
    },
    {
      key: 'bike',
      icon: <i className="fa fa-motorcycle text-xs" aria-hidden="true" />,
      count: bikeOnlyCount,
      ariaLabel: `${bikeOnlyCount} ${t('motorbike')} ${t('tours', {count: bikeOnlyCount})}`,
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
    },
  ].filter((c) => c.count > 0);

  return (
    <motion.div
      whileHover={{scale: 1.01}}
      transition={{duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94]}}
      className={className ?? 'aspect-[3/2]'}
    >
      <Link
        href={routes.destinations.detail.path({slug})}
        data-testid="destination-card"
        className="group relative overflow-hidden block cursor-pointer w-full h-full"
      >
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/90 via-surface-deep/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-on-surface-accent bg-surface-deep/80 px-2 py-1 border border-on-surface-tertiary">
            {displayName.slice(0, 3).toUpperCase()}-
            {String(carOnlyCount + bikeOnlyCount + bikeAndCarCount).padStart(
              2,
              '0',
            )}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-border-subtle/50">
          <h2 className="font-display text-lg lg:text-xl font-bold uppercase tracking-[0.05em] text-on-surface mb-2 group-hover:text-on-surface-accent transition-colors">
            {displayName}
          </h2>
          <div className="flex items-center flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 h-6 px-2 font-mono text-[10px] uppercase tracking-[0.05em] bg-surface-deep/80 border border-border-subtle text-on-surface-secondary"
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
