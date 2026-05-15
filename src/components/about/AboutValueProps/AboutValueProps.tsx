import {useTranslations} from 'next-intl';

const KEYS = ['01', '02', '03', '04'] as const;

export function AboutValueProps() {
  const t = useTranslations('about.valueProps');

  return (
    <section className="bg-secondary py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {KEYS.map((k) => (
            <li key={k} className="border-l border-primary/60 pl-6">
              <p className="type-headline-md font-extrabold text-primary">
                {k}
              </p>
              <h3 className="mt-4 type-label-lg font-bold uppercase tracking-widest text-white">
                {t(`${k}.title`)}
              </h3>
              <p className="mt-3 text-sm text-white/70">{t(`${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
