import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {waveStagger} from '@/utils/motion-variants';

type TourIncludedProps = {
  included: VMT.Perk[];
  excluded: VMT.Perk[];
  locale: string;
};

function perkLabel(perk: VMT.Perk, locale: string): string {
  if (locale === 'vi' && perk.labelVi) return perk.labelVi;
  return perk.labelEn;
}

export function TourIncluded({included, excluded, locale}: TourIncludedProps) {
  const t = useTranslations('tourDetail');

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative p-6 texture-grain-warm rotate-[-0.2deg] hover:rotate-0 transition-transform duration-300">
          <div className="absolute -top-1.5 left-8 w-12 h-4 bg-secondary/20 rotate-[1deg]" />
          <div className="relative z-10">
            <h2 className="type-headline-sm text-on-surface mb-4">
              {t('whatsIncluded')}
            </h2>
            <ul className="space-y-2.5">
              {included.map((perk, i) => (
                <motion.li
                  key={perk.id}
                  custom={i}
                  variants={waveStagger(0.06)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
                >
                  <i className={`${perk.icon} text-secondary mt-1 shrink-0`} />
                  {perkLabel(perk, locale)}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative p-6 texture-grain-warm rotate-[-0.2deg] hover:rotate-0 transition-transform duration-300">
          <div className="absolute -top-1.5 left-8 w-12 h-4 bg-secondary/20 rotate-[1deg]" />
          <div className="relative z-10">
            <h2 className="type-headline-sm text-on-surface mb-4">
              {t('whatsNotIncluded')}
            </h2>
            <ul className="space-y-2.5">
              {excluded.map((perk, i) => (
                <motion.li
                  key={perk.id}
                  custom={i}
                  variants={waveStagger(0.06)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  className="flex items-start gap-2 type-body-sm text-on-surface-secondary"
                >
                  <i className={`${perk.icon} text-red-500 mt-1 shrink-0`} />
                  {perkLabel(perk, locale)}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
