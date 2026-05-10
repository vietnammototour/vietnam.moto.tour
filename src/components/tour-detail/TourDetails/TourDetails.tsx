import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';

type TourDetailsProps = {
  tour: VMT.Tour;
};

export function TourDetails({tour}: TourDetailsProps) {
  const t = useTranslations('tourDetail');

  const details = [
    {label: t('hotel'), value: tour.hotel},
    {label: t('guided'), value: tour.guided},
  ];

  return (
    <div className="border border-border-subtle rounded-xl p-5 mb-5">
      <h3 className="type-title-lg text-on-surface mb-4">{t('tourDetails')}</h3>
      <div className="flex flex-col gap-1">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex justify-between items-center py-2 border-b border-border-subtle last:border-b-0"
          >
            <span className="type-body-sm text-on-surface-secondary">
              {detail.label}
            </span>
            <span className="type-label-lg text-on-surface font-semibold">
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
