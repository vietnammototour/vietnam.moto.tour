import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useId} from 'react';
import type * as VMT from '@/domain';
import {useEditable} from '@/components/Admin/EditableContext';

type TourDescriptionProps = {
  description: VMT.LocalizedText;
  locale: string;
  imageUrl?: string;
  imageAlt?: string;
};

export function TourDescription({
  description,
  locale,
  imageUrl,
  imageAlt,
}: TourDescriptionProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const localeKey = (ctx?.locale ?? (locale as 'en' | 'vi')) as 'en' | 'vi';
  const editable = !!ctx?.editable;
  const headingId = useId();

  const textBlock = (
    <>
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
    </>
  );

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
      aria-labelledby={headingId}
    >
      {imageUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <figure className="md:col-span-5 md:order-2">
            <div className="relative aspect-[3/2] overflow-hidden border border-border bg-secondary/10">
              <img
                src={imageUrl}
                alt={imageAlt ?? ''}
                className="w-full h-full object-cover"
              />
            </div>
          </figure>
          <div className="md:col-span-7 md:order-1">{textBlock}</div>
        </div>
      ) : (
        textBlock
      )}
    </motion.section>
  );
}
