import {motion} from 'framer-motion';
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
    <motion.section
      id="highlights"
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-16 scroll-mt-24"
    >
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <span className="type-label-sm tracking-[0.25em] uppercase text-primary mb-2 block">
            {t('highlightsEyebrow')}
          </span>
          <h2 className="type-headline-md text-on-surface">
            {t('highlightsTitle')}
          </h2>
        </div>
        {highlights.length > 0 && (
          <span className="type-label-md text-on-surface-secondary hidden sm:block">
            {t('highlightsCount', {count: highlights.length})}
          </span>
        )}
      </div>

      {highlights.length === 0 ? (
        <p className="type-body-md text-on-surface-secondary border border-dashed border-border-subtle rounded-xl p-8 text-center">
          {t('noHighlights')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {highlights.map((h, i) => (
            <HighlightCard key={h.id} highlight={h} locale={locale} index={i} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
