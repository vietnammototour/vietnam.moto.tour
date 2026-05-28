import {useTranslations} from 'next-intl';
import Image from 'next/image';
import type {Vehicle} from '@/domain';

type Props = {
  vehicle: Vehicle;
};

export function VehicleCard({vehicle}: Props) {
  const t = useTranslations('rentals');
  const tt = useTranslations('rentals.type');
  const isScooter = vehicle.type === 'SCOOTER';
  const typeLabel = isScooter ? tt('scooter') : tt('bike');
  const transmission = isScooter
    ? t('transmissionAuto')
    : t('transmissionManual');
  const available = vehicle.quantity > 0;
  const accentBar = isScooter ? 'bg-on-surface' : 'bg-primary';

  return (
    <article
      className="group flex flex-col bg-surface-alt transition-colors hover:bg-surface-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-deep">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <span className={`h-4 w-1 ${accentBar}`} aria-hidden />
          <span className="type-mono-label text-on-surface">{typeLabel}</span>
        </div>

        <h3 className="type-headline-lg text-on-surface mb-2">
          {vehicle.brand} {vehicle.model}
        </h3>

        <dl className="type-mono-data text-primary uppercase mb-6 flex justify-between gap-2 border-y border-border py-2">
          <div>
            <dt className="sr-only">{t('cc')}</dt>
            <dd>
              {vehicle.cc} {t('cc')}
            </dd>
          </div>
          <div>
            <dt className="sr-only">{t('transmissionLabel')}</dt>
            <dd>{transmission}</dd>
          </div>
          <div>
            <dt className="sr-only">{t('availabilityLabel')}</dt>
            <dd
              className={
                available ? 'text-primary' : 'text-on-surface-tertiary'
              }
            >
              {available ? t('available') : t('outOfStock')}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="type-display-sm text-primary leading-none">
            ${vehicle.priceUsdPerDay}
          </span>
          <span className="type-mono-label text-on-surface">{t('perDay')}</span>
        </div>
      </div>
    </article>
  );
}
