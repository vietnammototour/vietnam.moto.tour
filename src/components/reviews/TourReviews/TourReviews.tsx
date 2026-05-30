import {useTranslations} from 'next-intl';
import type {Review} from '@/domain';
import {ReviewCard} from '../ReviewCard';

type TourReviewsProps = {
  reviews: Review[];
  tripAdvisorUrl: string | null;
};

export function TourReviews({reviews, tripAdvisorUrl}: TourReviewsProps) {
  const t = useTranslations('reviews');
  const tc = useTranslations('common');
  if (reviews.length === 0) return null;

  return (
    <section className="bg-surface-deep border-t border-border-subtle py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl lg:text-3xl font-bold uppercase tracking-[0.05em] text-on-surface mb-8">
          {t('tourHeading')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="-ml-px -mt-px border border-border-subtle"
            >
              <ReviewCard
                review={review}
                verifyLabel={t('verifiedOn')}
                photoLabel={(n) => t('photoNth', {n})}
                readMoreLabel={tc('readMore')}
                showLessLabel={tc('showLess')}
              />
            </div>
          ))}
        </div>

        {tripAdvisorUrl && (
          <div className="mt-8">
            <a
              href={tripAdvisorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-on-surface-tertiary hover:border-primary text-on-surface hover:text-primary font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
            >
              {t('viewAllOnTripAdvisor')}
              <i className="fa fa-arrow-right" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
