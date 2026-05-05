import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

type TourDescriptionProps = {
  description: LocalizedText;
  locale: string;
};

export function TourDescription({description, locale}: TourDescriptionProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-4">
        {t('aboutThisTour')}
      </h2>
      <p className="type-body-sm text-on-surface-secondary leading-relaxed">
        {description[localeKey]}
      </p>
    </motion.section>
  );
}
