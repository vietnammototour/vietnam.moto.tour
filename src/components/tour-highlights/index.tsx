import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourHighlightsProps {
  highlights: LocalizedText[];
  locale: string;
}

export function TourHighlights({highlights, locale}: TourHighlightsProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  if (highlights.length === 0) return null;

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-4">{t('highlights')}</h2>
      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight, i) => (
          <motion.span
            key={i}
            initial={{opacity: 0, scale: 0.9}}
            whileInView={{opacity: 1, scale: 1}}
            viewport={{once: true}}
            transition={{duration: 0.3, delay: i * 0.08}}
            className="bg-primary/10 text-primary px-4 py-1.5 rounded-full type-label-sm"
          >
            {highlight[localeKey]}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
