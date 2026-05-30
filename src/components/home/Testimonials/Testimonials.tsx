import {motion} from 'framer-motion';
import {useTranslations, useLocale} from 'next-intl';
import {TripAdvisorWidget} from '@/components/ui';
import {contactInfo} from '@/utils';
import {fadeInUp} from '@/utils/motion-variants';

export function Testimonials() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = (useLocale() as 'en' | 'vi') ?? 'vi';

  return (
    <section className="bg-surface-deep py-20 lg:py-28 border-y border-on-surface-tertiary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-2 border-primary pl-4">
          <motion.span
            className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('testimonialsEyebrow')}
          </motion.span>
          <motion.h2
            className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('testimonialsTitle')}
          </motion.h2>
        </div>

        <div className="flex flex-col gap-4">
          <TripAdvisorWidget
            variant="rating"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
          />
          <TripAdvisorWidget
            variant="travelersChoice"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
          />
          <TripAdvisorWidget
            variant="reviews"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
            eyebrow={t('reviewsAttribution')}
          />
          <TripAdvisorWidget
            variant="cta"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
            href={contactInfo.tripadvisorLink}
            ctaLabel={tCommon('readReviews')}
          />
        </div>
      </div>
    </section>
  );
}
