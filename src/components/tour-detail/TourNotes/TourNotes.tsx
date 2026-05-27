import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {riseWithOvershoot} from '@/utils/motion-variants';

type TourNotesProps = {
  notes: VMT.LocalizedText[];
  mealsInfo: VMT.LocalizedText;
  locale: string;
};

export function TourNotes({notes, mealsInfo, locale}: TourNotesProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <>
      <motion.div
        variants={riseWithOvershoot}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
        className="relative p-5 mb-5 texture-grain-warm rotate-[0.3deg] hover:rotate-0 transition-transform duration-300"
      >
        <div className="absolute -top-1.5 left-6 w-10 h-4 bg-primary/20 rotate-[-2deg]" />
        <div className="absolute -top-1.5 right-8 w-8 h-4 bg-secondary/20 rotate-[3deg]" />
        <div className="relative z-10">
          <h3 className="type-title-lg text-on-surface mb-3">
            {t('importantNotes')}
          </h3>
          <ul className="space-y-2">
            {notes.map((note, i) => (
              <li
                key={i}
                className="type-label-sm text-on-surface-secondary leading-relaxed flex items-start gap-2"
              >
                <span className="text-primary mt-0.5 shrink-0">•</span>
                {note[localeKey]}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
      <motion.div
        variants={riseWithOvershoot}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true}}
        className="relative p-5 texture-grain-warm rotate-[0.3deg] hover:rotate-0 transition-transform duration-300"
      >
        <div className="absolute -top-1.5 left-6 w-10 h-4 bg-primary/20 rotate-[-2deg]" />
        <div className="absolute -top-1.5 right-8 w-8 h-4 bg-secondary/20 rotate-[3deg]" />
        <div className="relative z-10">
          <h3 className="type-title-lg text-on-surface mb-3">{t('meals')}</h3>
          <p className="type-label-sm text-on-surface-secondary leading-relaxed">
            {mealsInfo[localeKey]}
          </p>
        </div>
      </motion.div>
    </>
  );
}
