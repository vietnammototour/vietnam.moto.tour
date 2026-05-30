import {useTranslations} from 'next-intl';
import type {Review} from '@/domain';
import {ReviewCard} from '../ReviewCard';
import {TRIPADVISOR_REVIEWS_URL} from '@/utils';

type ReviewsSectionProps = {
  reviews: Review[];
};

export function ReviewsSection({reviews}: ReviewsSectionProps) {
  const t = useTranslations('reviews');
  const tc = useTranslations('common');
  if (reviews.length === 0) return null;

  return (
    <section className="bg-surface-deep py-20 lg:py-28 border-y border-on-surface-tertiary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-2 border-primary pl-4">
          <span className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block">
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2">
            {t('heading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              verifyLabel={t('verifiedOn')}
              photoLabel={(n) => t('photoNth', {n})}
              readMoreLabel={tc('readMore')}
              showLessLabel={tc('showLess')}
            />
          ))}
        </div>

        <div className="mt-8">
          <a
            href={TRIPADVISOR_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-on-surface-tertiary hover:border-primary text-on-surface hover:text-primary font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
          >
            {t('viewAllOnTripAdvisor')}
            <i className="fa fa-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
