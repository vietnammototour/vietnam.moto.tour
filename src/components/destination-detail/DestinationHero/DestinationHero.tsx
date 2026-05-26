import Link from 'next/link';
import {motion, useMotionTemplate} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {clipReveal, slideFromLeft} from '@/utils/motion-variants';
import {routes} from '@/routes';
import type * as VMT from '@/domain';

type Props = {
  destination: VMT.DestinationDetail;
  locale: 'en' | 'vi';
};

export function DestinationHero({destination, locale}: Props) {
  const t = useTranslations('destinationDetail');
  const tc = useTranslations('common');
  const spotlight = useCursorSpotlight(280, 0.14);
  const spotlightBg = useMotionTemplate`radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.18), transparent)`;

  const description = destination.description[locale];

  return (
    <section className="relative">
      <div
        ref={spotlight.ref as React.RefObject<HTMLDivElement>}
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative h-[70vh] min-h-[28rem] lg:h-[36rem] overflow-hidden texture-grain-warm"
      >
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${destination.heroImage})`,
          }}
          initial={{scale: 1.1}}
          animate={{scale: 1}}
          transition={{duration: 1.4, ease: [0.22, 1, 0.36, 1]}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{background: spotlightBg}}
        />

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-12 lg:pb-16">
          <motion.span
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.5, delay: 0.1}}
            className="type-label-sm tracking-[0.3em] uppercase text-on-surface-inverse/70 mb-4"
          >
            {t('eyebrow')}
          </motion.span>

          <motion.h1
            variants={clipReveal}
            initial="hidden"
            animate="visible"
            className="type-display-md md:type-display-lg text-on-surface-inverse mb-6 max-w-[80%] leading-[0.95]"
          >
            {destination.name[locale]}
          </motion.h1>

          {description && (
            <motion.p
              variants={slideFromLeft}
              initial="hidden"
              animate="visible"
              transition={{delay: 0.4}}
              className="type-body-lg text-on-surface-inverse/85 max-w-2xl mb-6"
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>

      <div className="bg-surface-alt py-3 border-b border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
            <Link
              href={routes.home.path()}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {tc('breadcrumbHome')}
            </Link>
            <span>/</span>
            <Link
              href={routes.tours.list.path()}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {t('breadcrumbDestinations')}
            </Link>
            <span>/</span>
            <span className="text-on-surface type-label-lg">
              {destination.name[locale]}
            </span>
          </nav>
        </div>
      </div>
    </section>
  );
}
