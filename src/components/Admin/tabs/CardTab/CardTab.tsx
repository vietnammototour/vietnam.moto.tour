'use client';

import {useState} from 'react';
import {useForm, FormProvider} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type * as VMT from '@/domain';
import {ImageUploadField} from '../../ImageUploadField';
import {AdminIntlProvider} from '../../AdminIntlProvider';
import {TourCard} from '@/components/TourCard/TourCard';
import {Button} from '@/components/ui';
import {flushImageSlots} from '@/lib/submit-with-images';
import type {ImageSlot} from '@/lib/image-slot';
import {cardTabSchema, type CardTabFormData} from './CardTab.form-utils';

type CardTabProps = {
  tourId: string | null;
  locale: 'en' | 'vi';
  initialData: CardTabFormData;
  previewTour: VMT.Tour;
  onSaved?: (slot: ImageSlot) => void;
};

function imageSlotToUrl(slot: ImageSlot | undefined): string {
  if (!slot) return '';
  if (slot.kind === 'saved') return slot.url;
  if (slot.kind === 'pending-replace') return slot.previewUrl;
  return '';
}

export function CardTab({
  tourId,
  locale,
  initialData,
  previewTour,
  onSaved,
}: CardTabProps) {
  const [submitError, setSubmitError] = useState('');

  const methods = useForm<CardTabFormData>({
    resolver: yupResolver(cardTabSchema),
    defaultValues: initialData,
  });

  const {
    handleSubmit,
    watch,
    formState: {isSubmitting, isDirty},
    reset,
  } = methods;

  const imageCard = watch('imageCard');

  async function onSubmit(data: CardTabFormData) {
    setSubmitError('');
    if (!tourId) {
      setSubmitError('Save General tab first');
      return;
    }
    try {
      const {errors, updated} = await flushImageSlots({
        entityType: 'tour',
        entityId: tourId,
        slots: {card: data.imageCard as ImageSlot},
      });
      if (errors.card) throw new Error(errors.card);
      const next = (updated.card ?? data.imageCard) as ImageSlot;
      reset({imageCard: next});
      onSaved?.(next);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  const livePreviewTour: VMT.Tour = {
    ...previewTour,
    imageUrl: imageSlotToUrl(imageCard as ImageSlot | undefined),
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5"
      >
        <div className="space-y-4">
          <ImageUploadField name="imageCard" preset="card" label="Card image" />
          {submitError && (
            <p className="type-body-sm text-red-500">{submitError}</p>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            loading={isSubmitting}
            size="lg"
          >
            Save Card
          </Button>
          {isDirty && (
            <p className="type-label-sm text-amber-500">Unsaved changes</p>
          )}
        </div>
        <aside>
          <AdminIntlProvider locale={locale}>
            <TourCard tour={livePreviewTour} interactive={false} />
          </AdminIntlProvider>
        </aside>
      </form>
    </FormProvider>
  );
}
