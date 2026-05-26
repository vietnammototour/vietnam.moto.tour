import {useTranslations} from 'next-intl';

const INCLUDED_KEYS = [
  'helmet',
  'passengerHelmet',
  'phoneHolder',
  'rainGear',
] as const;

const RULE_KEYS = [
  'deposit',
  'cancellation',
  'license',
  'age',
  'securityDeposit',
  'mileage',
  'noBorderCrossing',
  'availability',
  'confirmationRequired',
] as const;

export function RentalPolicy() {
  const ti = useTranslations('rentals.policy.included');
  const tr = useTranslations('rentals.policy.rules');

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 border-t border-border">
      <div>
        <h2 className="type-title-sm uppercase tracking-wide text-on-surface mb-6">
          {ti('title')}
        </h2>
        <ul className="space-y-3">
          {INCLUDED_KEYS.map((k) => (
            <li
              key={k}
              className="flex items-center justify-between type-body-md text-on-surface"
            >
              <span>{ti(k)}</span>
              <span className="type-label-sm uppercase text-on-surface-tertiary">
                {ti('free')}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="type-title-sm uppercase tracking-wide text-on-surface mb-6">
          {tr('title')}
        </h2>
        <ol className="space-y-3 list-decimal pl-5">
          {RULE_KEYS.map((k) => (
            <li key={k} className="type-body-md text-on-surface-secondary">
              {tr(k)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
