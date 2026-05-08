import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {TourCard} from '@/components/TourCard';

type Props = {
  tours: VMT.Tour[];
};

export function DestinationTours({tours}: Props) {
  const t = useTranslations('destinationDetail');

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="type-headline-md text-on-surface mb-6">
        {t('toursTitle')}
      </h2>
      {tours.length === 0 ? (
        <p className="type-body-md text-on-surface-secondary">{t('noTours')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </section>
  );
}
