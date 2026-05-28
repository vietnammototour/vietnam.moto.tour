import {useTranslations} from 'next-intl';

export type RentalsFilterValue = 'all' | 'scooter' | 'bike';

type Props = {
  value: RentalsFilterValue;
  onChange: (next: RentalsFilterValue) => void;
  count: number;
};

const OPTIONS: ReadonlyArray<{
  value: RentalsFilterValue;
  key: 'all' | 'scooter' | 'bike';
}> = [
  {value: 'all', key: 'all'},
  {value: 'scooter', key: 'scooter'},
  {value: 'bike', key: 'bike'},
];

export function RentalsFilter({value, onChange, count}: Props) {
  const t = useTranslations('rentals.filter');
  const tr = useTranslations('rentals');

  return (
    <div className="w-full bg-surface-alt border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label={t('filterLabel')}
          className="flex flex-wrap gap-3"
        >
          {OPTIONS.map((opt) => {
            const active = value === opt.value;
            const base =
              'cursor-pointer min-h-11 px-6 py-2 type-mono-label border border-border transition-colors';
            const variant = active
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-deep text-on-surface hover:bg-surface-elevated';
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(opt.value)}
                className={`${base} ${variant}`}
              >
                {t(opt.key)}
              </button>
            );
          })}
        </div>

        <div className="type-mono-label text-primary" aria-live="polite">
          {tr('vehiclesCount', {count})}
        </div>
      </div>
    </div>
  );
}
