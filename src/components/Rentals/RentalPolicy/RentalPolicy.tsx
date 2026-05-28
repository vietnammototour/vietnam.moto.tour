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

function num(i: number) {
  return String(i + 1).padStart(2, '0');
}

export function RentalPolicy() {
  const ti = useTranslations('rentals.policy.included');
  const tr = useTranslations('rentals.policy.rules');

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 py-12">
      <div>
        <h2 className="type-headline-lg text-primary mb-8">
          {'// '}
          {ti('title')}
        </h2>
        <ul className="flex flex-col">
          {INCLUDED_KEYS.map((k, i) => (
            <li
              key={k}
              className="flex justify-between items-center py-4 border-b border-border"
            >
              <div className="flex items-center gap-6">
                <span className="type-mono-data text-on-surface-tertiary">
                  {num(i)}
                </span>
                <span className="type-headline-md text-white">{ti(k)}</span>
              </div>
              <span className="bg-primary text-on-primary px-2 py-0.5 type-mono-label">
                {ti('free')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="type-headline-lg text-primary mb-8">
          {'// '}
          {tr('title')}
        </h2>
        <ul className="flex flex-col space-y-4">
          {RULE_KEYS.map((k, i) => (
            <li key={k} className="grid grid-cols-[3rem_1fr] gap-4 items-start">
              <span className="type-mono-data text-on-surface-tertiary">
                {num(i)}
              </span>
              <span className="type-body-md uppercase tracking-wider text-white">
                {tr(k)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
