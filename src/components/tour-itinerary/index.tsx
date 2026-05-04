import {motion, useScroll, useTransform} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useRef} from 'react';
import type {ItineraryDay} from '@/types';
import {slideFromLeft, slideFromRight} from '@/utils/motion-variants';

interface TourItineraryProps {
  itinerary: ItineraryDay[];
  locale: string;
}

export function TourItinerary({itinerary, locale}: TourItineraryProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';
  const containerRef = useRef<HTMLDivElement>(null);

  const {scrollYProgress} = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const endpointOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  const roadPath =
    'M20 0 C20 50,35 80,25 130 C15 180,30 210,20 260 C10 310,35 340,25 390 C15 440,30 470,20 520 C10 570,35 600,25 650 C15 700,20 750,20 800';

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
      <div ref={containerRef} className="relative">
        {/* Road path SVG */}
        <div className="absolute left-5 top-0 bottom-0 w-10 hidden md:block">
          <svg
            viewBox="0 0 40 800"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <motion.path
              d={roadPath}
              className="text-primary/20 stroke-current"
              strokeDasharray="8 4"
            />
            <motion.path
              d={roadPath}
              className="text-primary stroke-current"
              style={{pathLength: scrollYProgress}}
            />
          </svg>
          {/* Endpoint marker */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary"
            style={{opacity: endpointOpacity}}
          />
        </div>

        {/* Day cards */}
        <div className="space-y-8 md:pl-20">
          {itinerary.map((day, dayIndex) => (
            <div key={dayIndex}>
              {itinerary.length > 1 && (
                <h3 className="type-title-lg text-on-surface mb-4">
                  {day.dayLabel[localeKey]}
                </h3>
              )}
              {day.items.map((item, itemIndex) => (
                <motion.div
                  key={itemIndex}
                  variants={
                    itemIndex % 2 === 0 ? slideFromLeft : slideFromRight
                  }
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  className="relative p-4 rounded-lg elevation-1 bg-surface-elevated texture-grain-warm mb-4 last:mb-0"
                >
                  <div className="relative z-10">
                    <div className="type-label-lg text-primary font-semibold mb-1">
                      {item.time}
                    </div>
                    <p className="type-body-sm text-on-surface-secondary leading-relaxed">
                      {item.description[localeKey]}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
