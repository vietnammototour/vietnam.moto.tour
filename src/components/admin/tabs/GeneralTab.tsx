'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {ImageUploadField} from '@/components/admin/ImageUploadField';
import {StatusPicker} from '@/components/admin/StatusPicker';
import {FormFieldError} from '@/components/admin/FormFieldError';
import {
  generalTabSchema,
  type GeneralTabFormData,
} from './GeneralTab.form-utils';

export type {GeneralTabFormData as GeneralTabData};

type GeneralTabProps = {
  initialData: GeneralTabFormData;
  destinations: Array<{id: string; name: string}>;
  tourId: string | null;
  onDestinationChange?: (destinationId: string) => void;
  onSave: (data: GeneralTabFormData) => Promise<void>;
};

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  onDestinationChange,
  onSave,
}: GeneralTabProps) {
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {errors, isSubmitting, isDirty},
    reset,
  } = useForm<GeneralTabFormData>({
    resolver: yupResolver(generalTabSchema),
    defaultValues: initialData,
    shouldFocusError: true,
  });

  const status = watch('status');
  const imageUrl = watch('imageUrl');

  async function onSubmit(data: GeneralTabFormData) {
    setSubmitError('');
    try {
      await onSave(data);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
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
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Slug
          </label>
          <input
            type="text"
            {...register('slug')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
          <FormFieldError message={errors.slug?.message} />
        </div>
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
          <FormFieldError message={errors.destinationId?.message} />
        </div>
      </div>

      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Title
        </label>
        <input
          type="text"
          {...register('title')}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        />
        <FormFieldError message={errors.title?.message} />
      </div>

      {/* Localized descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={4}
            {...register('descriptionEn')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (VI)
          </label>
          <textarea
            rows={4}
            {...register('descriptionVi')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {key: 'price' as const, label: 'Price ($)'},
          {key: 'duration' as const, label: 'Duration (days)'},
          {key: 'distance' as const, label: 'Distance (km)'},
          {key: 'groupSize' as const, label: 'Group Size'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="number"
              {...register(key, {valueAsNumber: true})}
              min={0}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
            <FormFieldError message={errors[key]?.message} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {key: 'transportation' as const, label: 'Transportation'},
          {key: 'hotel' as const, label: 'Hotel'},
          {key: 'guided' as const, label: 'Guided'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="text"
              {...register(key)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Image */}
      <ImageUploadField
        entityType="tour"
        entityId={tourId}
        imageType="card"
        currentUrl={imageUrl}
        onUploadComplete={(url) =>
          setValue('imageUrl', url, {shouldDirty: true})
        }
        label="Card Image"
      />

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Save General'}
        </button>
      </div>

      {isDirty && (
        <p className="type-label-sm text-amber-500">Unsaved changes</p>
      )}
    </form>
  );
}
