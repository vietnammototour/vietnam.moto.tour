import {useState} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {HIGHLIGHTS_PAGE_SIZE} from '@/domain';
import {api} from '@/routes';
import {Button} from '@/components/ui';
import {HighlightCard} from '../HighlightCard';

type Props = {
  slug: string;
  initialHighlights: VMT.Highlight[];
  total: number;
  locale: 'en' | 'vi';
};

export function DestinationHighlights({
  slug,
  initialHighlights,
  total,
  locale,
}: Props) {
  const t = useTranslations('destinationDetail');
  const [highlights, setHighlights] = useState(initialHighlights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, total - highlights.length);
  const nextBatch = Math.min(HIGHLIGHTS_PAGE_SIZE, remaining);

  async function handleShowMore() {
    setLoading(true);
    setError(null);
    const res = await api.destinations.highlights(slug, {
      skip: highlights.length,
      take: HIGHLIGHTS_PAGE_SIZE,
    });
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error ?? 'Failed to load');
      return;
    }
    setHighlights((prev) => [...prev, ...res.data.items]);
  }

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
          <h2 className="type-headline-lg text-on-surface">
            {t('highlightsTitle')}
          </h2>
        </div>
        {total > 0 && (
          <span className="type-label-md text-on-surface-secondary hidden sm:block">
            {t('highlightsCount', {count: total})}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="type-body-md text-on-surface-secondary border border-dashed border-border-subtle rounded-xl p-8 text-center">
          {t('noHighlights')}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <HighlightCard
                key={h.id}
                highlight={h}
                locale={locale}
                index={i}
              />
            ))}
          </div>
          {nextBatch > 0 && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleShowMore}
                disabled={loading}
              >
                {loading
                  ? t('highlightsLoading')
                  : t('showMoreHighlights', {count: nextBatch})}
              </Button>
              {error && (
                <p className="type-body-sm text-error">
                  {t('highlightsLoadError')}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}
