import Link from 'next/link';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {fadeInUp, clipReveal} from '@/utils/motion-variants';

export function RentalContactCta() {
  const t = useTranslations('rentals.contactCta');
  return (
    <section className="bg-surface-deep py-20 lg:py-28 border-y border-on-surface-tertiary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 border-l-2 border-primary pl-4">
          <motion.span
            className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('eyebrow')}
          </motion.span>
          <motion.h2
            className="font-display text-3xl lg:text-5xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2 max-w-2xl leading-tight"
            variants={clipReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('title')}
          </motion.h2>
        </div>
        <p className="text-base lg:text-lg text-on-surface-secondary mb-10 max-w-xl leading-relaxed">
          {t('subtitle')}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-on-primary font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
        >
          {t('button')}
          <i className="fa fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
