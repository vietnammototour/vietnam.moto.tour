'use client';

import {useState} from 'react';
import {useForm, FormProvider} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {ImageUploadField} from '../../ImageUploadField';
import {StatusPicker} from '../../StatusPicker';
import {TourPreviewPanel} from '../../TourPreviewPanel';
import {TextInput, Textarea, NumberInput, Button} from '@/components/ui';
import {flushImageSlots} from '@/lib/submit-with-images';
import {
  generalTabSchema,
  type GeneralTabFormData,
} from './GeneralTab.form-utils';

export type {GeneralTabFormData as GeneralTabData};

type GeneralTabProps = {
  initialData: GeneralTabFormData;
  destinations: Array<{id: string; name: string}>;
  tourId: string | null;
  locale: 'en' | 'vi';
  destinationName: string;
  onDestinationChange?: (destinationId: string) => void;
  onSave: (data: Omit<GeneralTabFormData, 'imageCard'>) => Promise<string>;
};

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  locale,
  destinationName,
  onDestinationChange,
  onSave,
}: GeneralTabProps) {
  const [submitError, setSubmitError] = useState('');

  const methods = useForm<GeneralTabFormData>({
    resolver: yupResolver(generalTabSchema),
    defaultValues: initialData,
    shouldFocusError: true,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: {errors, isSubmitting, isDirty},
    reset,
  } = methods;

  const status = watch('status');
  const descriptionField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';
  const descriptionLabel = `Description (${locale.toUpperCase()})`;

  async function onSubmit(data: GeneralTabFormData) {
    setSubmitError('');
    try {
      const {imageCard, ...textFields} = data;
      const id = await onSave(textFields);
      const {errors: imgErrors, updated} = await flushImageSlots({
        entityType: 'tour',
        entityId: id,
        slots: {card: imageCard},
      });
      if (imgErrors.card) throw new Error(imgErrors.card);
      reset({
        ...data,
        imageCard: updated.card ?? imageCard,
      });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="type-title-lg text-on-surface">General Info</h2>
            <StatusPicker
              value={status}
              onChange={(s) => {
                setValue('status', s, {shouldDirty: true});
              }}
            />
          </div>

          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
              {submitError}
            </div>
          )}

          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Slug"
              {...register('slug')}
              error={errors.slug?.message}
            />
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Destination
              </label>
              <select
                {...register('destinationId', {
                  onChange: (e) => onDestinationChange?.(e.target.value),
                })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="">Select...</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextInput
            label="Title"
            {...register('title')}
            error={errors.title?.message}
          />

          <Textarea
            key={descriptionField}
            label={descriptionLabel}
            {...register(descriptionField)}
          />

          {/* Numeric fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {key: 'duration' as const, label: 'Duration (days)'},
              {key: 'distance' as const, label: 'Distance (km)'},
            ].map(({key, label}) => (
              <NumberInput
                key={key}
                label={label}
                {...register(key, {valueAsNumber: true})}
                min={0}
                error={errors[key]?.message}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {key: 'transportation' as const, label: 'Transportation'},
              {key: 'hotel' as const, label: 'Hotel'},
              {key: 'guided' as const, label: 'Guided'},
            ].map(({key, label}) => (
              <TextInput key={key} label={label} {...register(key)} />
            ))}
          </div>

          {/* Image */}
          <ImageUploadField name="imageCard" preset="card" label="Card Image" />

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              loading={isSubmitting}
              size="lg"
            >
              Save General
            </Button>
          </div>

          {isDirty && (
            <p className="type-label-sm text-amber-500">Unsaved changes</p>
          )}
        </form>

        <aside className="lg:col-span-1">
          <TourPreviewPanel
            control={control}
            locale={locale}
            destinationName={destinationName}
          />
        </aside>
      </div>
    </FormProvider>
  );
}
