import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';

type Props = {
  destination: VMT.DestinationDetail;
  locale: 'en' | 'vi';
};

export function DestinationIntro({destination, locale}: Props) {
  const t = useTranslations('destinationDetail');
  const description = destination.description[locale];

  if (!description) return null;

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-12"
    >
      <span className="type-label-sm tracking-[0.25em] uppercase text-primary mb-3 block">
        {t('aboutEyebrow')}
      </span>
      <h2 className="type-headline-md text-on-surface mb-6">
        {t('aboutTitle', {name: destination.name[locale]})}
      </h2>
      <p className="type-body-lg text-on-surface-secondary leading-relaxed first-letter:type-display-sm first-letter:font-semibold first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:mt-1">
        {description}
      </p>
    </motion.section>
  );
}
