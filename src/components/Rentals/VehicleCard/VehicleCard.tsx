import {useTranslations} from 'next-intl';
import type {Vehicle} from '@/domain';

type Props = {
  vehicle: Vehicle;
};

export function VehicleCard({vehicle}: Props) {
  const t = useTranslations('rentals');
  const tt = useTranslations('rentals.type');
  const typeLabel = vehicle.type === 'SCOOTER' ? tt('scooter') : tt('bike');
  const available = vehicle.quantity > 0;

  return (
    <article className="bg-surface-elevated border border-border overflow-hidden flex flex-col">
      <div className="aspect-[3/2] bg-surface-alt overflow-hidden">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
          {typeLabel}
        </span>
        <h3 className="type-title-sm text-on-surface">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="type-body-sm text-on-surface-secondary">
          {vehicle.cc} {t('cc')}
        </p>
        <p
          className={
            available
              ? 'type-label-sm text-on-surface-secondary'
              : 'type-label-sm text-on-surface-tertiary'
          }
        >
          {available ? t('available') : t('outOfStock')}
        </p>
        <p className="mt-auto type-title-sm text-on-surface-accent">
          ${vehicle.priceUsdPerDay}{' '}
          <span className="type-body-sm text-on-surface-secondary">
            {t('perDay')}
          </span>
        </p>
      </div>
    </article>
  );
}
