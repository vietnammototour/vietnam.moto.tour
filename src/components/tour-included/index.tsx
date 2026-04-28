import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourIncludedProps {
  included: LocalizedText[];
  excluded: LocalizedText[];
  locale: string;
}

export function TourIncluded({included, excluded, locale}: TourIncludedProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="type-headline-sm text-on-surface mb-4">
            {t('whatsIncluded')}
          </h2>
          <ul className="space-y-2.5">
            {included.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
              >
                <i className="fa fa-check text-secondary mt-1 shrink-0" />
                {item[localeKey]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="type-headline-sm text-on-surface mb-4">
            {t('whatsNotIncluded')}
          </h2>
          <ul className="space-y-2.5">
            {excluded.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
              >
                <i className="fa fa-times text-red-500 mt-1 shrink-0" />
                {item[localeKey]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
