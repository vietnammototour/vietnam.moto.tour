import {motion} from 'framer-motion';
import {useTranslations, useLocale} from 'next-intl';
import type * as VMT from '@/domain';
import type {LocalizedText} from '@/domain/shared/localized-text';
import {TourCard} from '@/components/TourCard';

type Props = {
  tours: VMT.Tour[];
  destinationName: LocalizedText;
};

export function DestinationTours({tours, destinationName}: Props) {
  const t = useTranslations('destinationDetail');
  const locale = useLocale() as 'en' | 'vi';

  return (
    <motion.section
      id="tours"
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="bg-surface-alt py-16 lg:py-24 scroll-mt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="type-headline-lg text-on-surface">
              {t('toursTitle', {name: destinationName[locale]})}
            </h2>
          </div>
        </div>

        {tours.length === 0 ? (
          <p className="type-body-md text-on-surface-secondary border border-dashed border-border-subtle p-10 text-center bg-surface">
            {t('noTours')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
