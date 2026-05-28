import {useTranslations} from 'next-intl';

const STAT_KEYS = ['years', 'routes', 'km', 'riders'] as const;

export function StatsStrip() {
  const t = useTranslations('home.stats');

  return (
    <section
      aria-label="Headline statistics"
      className="border-y border-on-surface-tertiary bg-surface-alt"
    >
      <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 divide-x divide-border-subtle">
        {STAT_KEYS.map((key) => (
          <div key={key} className="px-6 py-8 flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary">
              {t(`${key}.label`)}
            </span>
            <span className="font-mono text-3xl lg:text-4xl text-primary tabular-nums">
              {t(`${key}.value`)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
