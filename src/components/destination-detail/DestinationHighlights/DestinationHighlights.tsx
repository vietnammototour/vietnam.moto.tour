import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {HighlightCard} from '../HighlightCard';

type Props = {
  highlights: VMT.Highlight[];
  locale: 'en' | 'vi';
};

export function DestinationHighlights({highlights, locale}: Props) {
  const t = useTranslations('destinationDetail');

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="type-headline-md text-on-surface mb-6">
        {t('highlightsTitle')}
      </h2>
      {highlights.length === 0 ? (
        <p className="type-body-md text-on-surface-secondary">
          {t('noHighlights')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h) => (
            <HighlightCard key={h.id} highlight={h} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
