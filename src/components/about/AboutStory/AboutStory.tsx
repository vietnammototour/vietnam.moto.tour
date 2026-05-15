import {useTranslations} from 'next-intl';

export function AboutStory() {
  const t = useTranslations('about.story');
  const paragraphs = t('body').split('\n\n');

  return (
    <section className="bg-secondary py-20 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <blockquote className="type-headline-lg font-extrabold uppercase tracking-tight text-primary">
          {t('pullQuote')}
        </blockquote>
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-white/80">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
