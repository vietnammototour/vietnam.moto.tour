import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@/types';

interface TourNotesProps {
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
  locale: string;
}

export function TourNotes({notes, mealsInfo, locale}: TourNotesProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  return (
    <>
      <div className="border border-border-subtle rounded-xl p-5 mb-5">
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
      <div className="border border-border-subtle rounded-xl p-5">
        <h3 className="type-title-lg text-on-surface mb-3">{t('meals')}</h3>
        <p className="type-label-sm text-on-surface-secondary leading-relaxed">
          {mealsInfo[localeKey]}
        </p>
      </div>
    </>
  );
}
