'use client';

import {useWatch, type Control} from 'react-hook-form';
import type * as VMT from '@/domain';
import type {ImageSlot} from '@/lib/image-slot';
import {TourCard} from '@/components/TourCard/TourCard';
import {TourDetails} from '@/components/tour-detail/TourDetails/TourDetails';
import {AdminIntlProvider} from '../AdminIntlProvider';
import type {GeneralTabFormData} from '../tabs/GeneralTab/GeneralTab.form-utils';

type Props = {
  control: Control<GeneralTabFormData>;
  locale: 'en' | 'vi';
  destinationName: string;
};

function imageSlotToUrl(slot: ImageSlot | undefined): string {
  if (!slot) return '';
  switch (slot.kind) {
    case 'saved':
      return slot.url;
    case 'pending-replace':
      return slot.previewUrl;
    case 'empty':
    case 'pending-delete':
    default:
      return '';
  }
}

export function TourPreviewPanel({control, locale, destinationName}: Props) {
  const values = useWatch({control}) as Partial<GeneralTabFormData>;

  const titleEn = values.titleEn ?? values.title ?? '';
  const titleVi = values.titleVi ?? values.title ?? '';
  const descriptionEn = values.descriptionEn ?? '';
  const descriptionVi = values.descriptionVi ?? '';

  const previewTour: VMT.Tour = {
    id: 'preview',
    slug: values.slug ?? 'preview',
    destinationId: values.destinationId ?? '',
    destinationName,
    destinationHeroImage: '',
    title: {en: titleEn, vi: titleVi},
    description: {en: descriptionEn, vi: descriptionVi},
    imageUrl: imageSlotToUrl(values.imageCard as ImageSlot | undefined),
    images: (values.images as string[] | undefined) ?? [],
    duration: values.duration ?? 0,
    distance: values.distance ?? 0,
    transportation: values.transportation ?? '',
    hotel: values.hotel ?? '',
    guided: values.guided ?? '',
    itinerary: [],
    pricingGroups: [],
    paymentDetails: (values.paymentDetails as
      | VMT.LocalizedText
      | undefined) ?? {
      en: '',
      vi: '',
    },
    notes: (values.notes as VMT.LocalizedText[] | undefined) ?? [],
    mealsInfo: (values.mealsInfo as VMT.LocalizedText | undefined) ?? {
      en: '',
      vi: '',
    },
    status: values.status ?? 'DRAFT',
    highlights: [],
  };

  return (
    <AdminIntlProvider locale={locale}>
      <div className="space-y-4 sticky top-4">
        <TourCard tour={previewTour} interactive={false} />
        <TourDetails tour={previewTour} />
      </div>
    </AdminIntlProvider>
  );
}
