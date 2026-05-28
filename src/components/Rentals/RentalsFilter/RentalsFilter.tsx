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
    <div className="w-full bg-surface-alt border-y border-border py-4 px-6 sm:px-10 lg:px-12 flex flex-wrap items-center justify-between gap-4">
      <div
        role="group"
        aria-label="Vehicle filter"
        className="flex flex-wrap gap-3"
      >
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          const base =
            'cursor-pointer px-6 py-2 type-mono-label border border-border transition-colors';
          const variant = active
            ? 'bg-primary text-on-primary border-l-4 border-l-primary'
            : 'bg-black text-white hover:bg-surface-elevated';
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

      <div className="type-mono-label text-primary">
        {tr('vehiclesCount', {count})}
      </div>
    </div>
  );
}
