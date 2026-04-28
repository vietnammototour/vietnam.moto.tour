import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {ItineraryDay} from '@/types';

interface TourItineraryProps {
  itinerary: ItineraryDay[];
  locale: string;
}

export function TourItinerary({itinerary, locale}: TourItineraryProps) {
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
      <h2 className="type-headline-sm text-on-surface mb-6">
        {t('itinerary')}
      </h2>
      {itinerary.map((day, dayIndex) => (
        <div key={dayIndex} className="mb-8 last:mb-0">
          {itinerary.length > 1 && (
            <h3 className="type-title-lg text-on-surface mb-4">
              {day.dayLabel[localeKey]}
            </h3>
          )}
          <div className="relative border-l-2 border-primary/30 ml-3 pl-6">
            {day.items.map((item, itemIndex) => (
              <motion.div
                key={itemIndex}
                initial={{opacity: 0, x: -10}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                transition={{duration: 0.4, delay: itemIndex * 0.1}}
                className="relative mb-6 last:mb-0"
              >
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
                <div className="type-label-lg text-primary font-semibold mb-1">
                  {item.time}
                </div>
                <p className="type-body-sm text-on-surface-secondary leading-relaxed">
                  {item.description[localeKey]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </motion.section>
  );
}
