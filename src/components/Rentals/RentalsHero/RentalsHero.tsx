import Image from 'next/image';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {clipReveal, fadeInUp, slideFromLeft} from '@/utils/motion-variants';

type Props = {
  backgroundImage: string;
};

export function RentalsHero({backgroundImage}: Props) {
  const t = useTranslations('rentals');

  return (
    <section className="relative w-full">
      <div className="relative h-[55vh] min-h-[420px] md:h-[70vh] overflow-hidden bg-surface-deep">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-surface/75" aria-hidden />

        {/* Corner crosshair marks */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute top-6 left-6 w-6 h-6 border-t border-l border-primary" />
          <div className="absolute top-6 right-6 w-6 h-6 border-t border-r border-primary" />
          <div className="absolute bottom-6 left-6 w-6 h-6 border-b border-l border-primary" />
          <div className="absolute bottom-6 right-6 w-6 h-6 border-b border-r border-primary" />
        </div>

        <div className="relative z-20 h-full flex flex-col justify-end mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 lg:pb-14">
          <motion.p
            variants={slideFromLeft}
            initial="hidden"
            animate="visible"
            className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-accent mb-6"
          >
            {t('heroEyebrow')}
          </motion.p>
          <motion.h1
            variants={clipReveal}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.05] text-on-surface mb-5 max-w-[16ch]"
          >
            {t('title')}
          </motion.h1>
          <motion.span
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="inline-block self-start bg-primary text-on-primary px-4 py-1.5 type-mono-label"
          >
            {t('heroBadge')}
          </motion.span>
        </div>
      </div>
    </section>
  );
}
