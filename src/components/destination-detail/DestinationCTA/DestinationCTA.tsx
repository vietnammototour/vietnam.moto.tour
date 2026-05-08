import Link from 'next/link';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';

type Props = {
  heroImage?: string;
};

export function DestinationCTA({heroImage}: Props) {
  const t = useTranslations('destinationDetail.cta');

  return (
    <section className="relative overflow-hidden">
      {heroImage && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center scale-110 opacity-30"
          style={{backgroundImage: `url(${heroImage})`}}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary-light)] mix-blend-multiply" />
      <div className="absolute inset-0 texture-grain-warm opacity-60" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <motion.span
          initial={{opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.5}}
          className="type-label-sm tracking-[0.3em] uppercase text-on-primary/75 mb-4 block"
        >
          {t('eyebrow')}
        </motion.span>
        <motion.h2
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.6, delay: 0.1}}
          className="type-display-sm md:type-display-md text-on-primary mb-5 leading-tight"
        >
          {t('title')}
        </motion.h2>
        <motion.p
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.6, delay: 0.2}}
          className="type-body-lg text-on-primary/85 mb-10 max-w-xl mx-auto"
        >
          {t('subtitle')}
        </motion.p>
        <motion.div
          initial={{opacity: 0, scale: 0.95}}
          whileInView={{opacity: 1, scale: 1}}
          viewport={{once: true}}
          transition={{duration: 0.5, delay: 0.3}}
        >
          <Link
            href={routes.contact.path()}
            className="inline-flex items-center gap-2 bg-on-primary text-primary type-title-md font-semibold px-9 py-4 rounded-full cursor-pointer hover:scale-105 transition-transform elevation-3"
          >
            {t('button')}
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
