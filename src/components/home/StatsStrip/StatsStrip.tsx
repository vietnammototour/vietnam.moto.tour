import {useTranslations} from 'next-intl';

const FOUNDED_YEAR = 2014;

type Props = {
  toursCount: number;
};

export function StatsStrip({toursCount}: Props) {
  const t = useTranslations('home.stats');
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  const stats = [
    {key: 'years', label: t('years.label'), value: `${years}+`},
    {key: 'routes', label: t('routes.label'), value: String(toursCount)},
    {key: 'km', label: t('km.label'), value: t('km.value')},
    {key: 'riders', label: t('riders.label'), value: t('riders.value')},
  ];

  return (
    <section
      aria-label={t('ariaLabel')}
      className="border-y border-on-surface-tertiary bg-surface-alt"
    >
      <dl className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 divide-x divide-border-subtle">
        {stats.map((stat) => (
          <div key={stat.key} className="px-6 py-8 flex flex-col gap-2">
            <dt className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary">
              {stat.label}
            </dt>
            <dd className="font-mono text-3xl lg:text-4xl text-primary tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
