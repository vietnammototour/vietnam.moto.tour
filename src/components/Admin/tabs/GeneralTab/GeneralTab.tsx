'use client';

import {useEffect, useRef, useState, useCallback} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type * as VMT from '@/domain';
import {EditableProvider} from '../../EditableContext';
import {AdminIntlProvider} from '../../AdminIntlProvider';
import {TourHero} from '@/components/TourHero';
import {TourDescription} from '@/components/tour-detail/TourDescription';
import {Button, Select, TextInput} from '@/components/ui';
import {
  generalTabSchema,
  type GeneralTabFormData,
} from './GeneralTab.form-utils';

export type {GeneralTabFormData as GeneralTabData};

type GeneralTabProps = {
  initialData: GeneralTabFormData;
  destinations: Array<{id: string; name: string; heroImage: string}>;
  tourId: string | null;
  locale: 'en' | 'vi';
  externalSlug?: string;
  onSlugChange?: (slug: string) => void;
  onTitleChange?: (title: string) => void;
  onDestinationChange?: (destinationId: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (data: GeneralTabFormData) => Promise<string>;
};

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  locale,
  externalSlug,
  onSlugChange,
  onTitleChange,
  onDestinationChange,
  onDirtyChange,
  onSave,
}: GeneralTabProps) {
  const [submitError, setSubmitError] = useState('');

  const {
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: {isSubmitting, isDirty},
    reset,
  } = useForm<GeneralTabFormData>({
    resolver: yupResolver(generalTabSchema),
    defaultValues: initialData,
  });

  const values = useWatch({control}) as GeneralTabFormData;

  const lastSlug = useRef(initialData.slug);
  const lastTitle = useRef(
    initialData[locale === 'en' ? 'titleEn' : 'titleVi'],
  );
  useEffect(() => {
    if (values.slug !== lastSlug.current) {
      lastSlug.current = values.slug;
      onSlugChange?.(values.slug);
    }
    const activeTitle = locale === 'en' ? values.titleEn : values.titleVi;
    if (activeTitle !== lastTitle.current) {
      lastTitle.current = activeTitle;
      onTitleChange?.(activeTitle);
    }
  }, [
    values.slug,
    values.titleEn,
    values.titleVi,
    locale,
    onSlugChange,
    onTitleChange,
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (externalSlug !== undefined && externalSlug !== getValues('slug')) {
      setValue('slug', externalSlug, {shouldDirty: true});
      lastSlug.current = externalSlug;
    }
  }, [externalSlug, setValue, getValues]);

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      let rhfPath: keyof GeneralTabFormData | null = null;
      if (path === 'description.en') rhfPath = 'descriptionEn';
      else if (path === 'description.vi') rhfPath = 'descriptionVi';
      else if (path === 'title.en') rhfPath = 'titleEn';
      else if (path === 'title.vi') rhfPath = 'titleVi';
      else if (
        path === 'duration' ||
        path === 'distance' ||
        path === 'transportation' ||
        path === 'hotel' ||
        path === 'guided'
      ) {
        rhfPath = path as keyof GeneralTabFormData;
      }
      if (!rhfPath) return;
      setValue(rhfPath as never, value as never, {shouldDirty: true});
    },
    [setValue],
  );

  async function onSubmit(data: GeneralTabFormData) {
    setSubmitError('');
    try {
      await onSave(data);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  const destination = destinations.find((d) => d.id === values.destinationId);
  const heroImage = destination?.heroImage ?? '';
  const destinationName = destination?.name ?? '';

  const previewTour: VMT.Tour = {
    id: tourId ?? 'preview',
    slug: values.slug,
    destinationId: values.destinationId,
    destinationName: {en: destinationName, vi: destinationName},
    destinationHeroImage: heroImage,
    title: {en: values.titleEn, vi: values.titleVi},
    description: {en: values.descriptionEn, vi: values.descriptionVi},
    imageUrl: '',
    images: [],
    duration: values.duration,
    distance: values.distance,
    transportation: values.transportation,
    hotel: values.hotel,
    guided: values.guided,
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {en: '', vi: ''},
    notes: [],
    mealsInfo: {en: '', vi: ''},
    status: 'PUBLISHED',
    highlights: [],
    included: [],
    excluded: [],
  };

  const destinationSelector = (
    <Select
      aria-label="Destination"
      value={values.destinationId}
      onChange={(id) => {
        setValue('destinationId', id, {shouldDirty: true});
        onDestinationChange?.(id);
      }}
      className="bg-surface-elevated/90 backdrop-blur"
      placeholder="Select destination..."
      options={destinations.map((d) => ({value: d.id, label: d.name}))}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <AdminIntlProvider locale={locale}>
        <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
          <TourHero tour={previewTour} destinationSlot={destinationSelector} />

          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
            <TourDescription
              description={previewTour.description}
              locale={locale}
            />

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <TextInput
                label="Hotel"
                value={values.hotel}
                onChange={(e) =>
                  setValue('hotel', e.target.value, {shouldDirty: true})
                }
              />
              <TextInput
                label="Guided"
                value={values.guided}
                onChange={(e) =>
                  setValue('guided', e.target.value, {shouldDirty: true})
                }
              />
            </section>
          </div>
        </EditableProvider>
      </AdminIntlProvider>

      <div className="border-t border-border bg-surface-elevated p-4 flex items-center justify-between gap-3 sticky bottom-0">
        {submitError && (
          <span className="type-label-sm text-red-500">{submitError}</span>
        )}
        {!submitError && isDirty && (
          <span className="type-label-sm text-amber-500">Unsaved changes</span>
        )}
        {!submitError && !isDirty && <span />}
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          loading={isSubmitting}
          size="lg"
        >
          Save General
        </Button>
      </div>
    </form>
  );
}
