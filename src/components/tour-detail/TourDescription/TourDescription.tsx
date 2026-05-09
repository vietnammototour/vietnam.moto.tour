import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useId} from 'react';
import type * as VMT from '@/domain';
import {useEditable} from '@/components/Admin/EditableContext';

type TourDescriptionProps = {
  description: VMT.LocalizedText;
  locale: string;
};

export function TourDescription({description, locale}: TourDescriptionProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const localeKey = (ctx?.locale ?? (locale as 'en' | 'vi')) as 'en' | 'vi';
  const editable = !!ctx?.editable;
  const headingId = useId();

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="type-headline-sm text-on-surface mb-4">
        {t('aboutThisTour')}
      </h2>
      {editable ? (
        <textarea
          aria-labelledby={headingId}
          value={description[localeKey] ?? ''}
          onChange={(e) =>
            ctx!.onFieldChange(`description.${localeKey}`, e.target.value)
          }
          rows={8}
          className="w-full type-body-sm leading-relaxed bg-surface-elevated/50 border border-dashed border-primary/40 hover:border-primary focus:border-primary rounded p-3 cursor-text outline-none"
        />
      ) : (
        <p className="type-body-sm text-on-surface-secondary leading-relaxed">
          {description[localeKey]}
        </p>
      )}
    </motion.section>
  );
}
