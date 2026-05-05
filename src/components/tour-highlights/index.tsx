import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import type {Highlight} from '@/types';

interface TourHighlightsProps {
  highlights: Highlight[];
  locale: string;
}

export function TourHighlights({highlights, locale}: TourHighlightsProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  if (highlights.length === 0) return null;

  const text = (h: Highlight) => (localeKey === 'en' ? h.textEn : h.textVi);

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-4">
        {t('highlights')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight, i) => (
          <motion.span
            key={highlight.id}
            initial={{opacity: 0, scale: 0.9}}
            whileInView={{opacity: 1, scale: 1}}
            viewport={{once: true}}
            transition={{duration: 0.3, delay: i * 0.08}}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full type-label-sm"
          >
            {highlight.imageUrl && (
              <Image
                src={highlight.imageUrl}
                alt={text(highlight)}
                width={20}
                height={20}
                className="rounded-full object-cover w-5 h-5"
              />
            )}
            {text(highlight)}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
