import {useTranslations} from 'next-intl';

export type RentalsFilterValue = 'all' | 'scooter' | 'bike';

type Props = {
  value: RentalsFilterValue;
  onChange: (next: RentalsFilterValue) => void;
};

const OPTIONS: ReadonlyArray<{
  value: RentalsFilterValue;
  key: 'all' | 'scooter' | 'bike';
}> = [
  {value: 'all', key: 'all'},
  {value: 'scooter', key: 'scooter'},
  {value: 'bike', key: 'bike'},
];

export function RentalsFilter({value, onChange}: Props) {
  const t = useTranslations('rentals.filter');
  return (
    <div
      role="group"
      aria-label="Vehicle filter"
      className="inline-flex rounded-full border border-border bg-surface-elevated p-1"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={
              active
                ? 'cursor-pointer px-4 py-1.5 rounded-full type-label-sm bg-primary text-on-primary'
                : 'cursor-pointer px-4 py-1.5 rounded-full type-label-sm text-on-surface-secondary'
            }
          >
            {t(opt.key)}
          </button>
        );
      })}
    </div>
  );
}
