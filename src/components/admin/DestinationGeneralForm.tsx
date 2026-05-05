'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {routes, useNavigate} from '@/routes';
import {FormFieldError} from './FormFieldError';
import {
  destinationSchema,
  submitDestination,
  type DestinationFormData,
} from './DestinationGeneralForm.form-utils';
import type {Locale} from './LocalePicker';

type DestinationGeneralFormProps = {
  initialData: DestinationFormData;
  locale: Locale;
  mode: 'create' | 'edit';
  destinationId: string | null;
  onSaved?: (id: string) => void;
};

export function DestinationGeneralForm({
  initialData,
  locale,
  mode,
  destinationId,
  onSaved,
}: DestinationGeneralFormProps) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = useForm<DestinationFormData>({
    resolver: yupResolver(destinationSchema),
    defaultValues: initialData,
    shouldFocusError: true,
  });

  const nameField = locale === 'en' ? 'nameEn' : 'nameVi';
  const descField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';

  async function onSubmit(data: DestinationFormData) {
    setSubmitError('');
    const result = await submitDestination(data, mode, destinationId);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    reset(data);

    if (onSaved) {
      onSaved(String(result.data?.id));
    } else {
      navigate.to(routes.admin.destinations.list);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {submitError}
        </div>
      )}

      <div className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Slug
            </label>
            <input
              type="text"
              {...register('slug')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FormFieldError message={errors.slug?.message} />
          </div>
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Name ({locale.toUpperCase()})
            </label>
            <input
              type="text"
              {...register(nameField)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FormFieldError message={errors[nameField]?.message} />
          </div>
        </div>

        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description ({locale.toUpperCase()})
          </label>
          <textarea
            rows={4}
            {...register(descField)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <FormFieldError message={errors[descField]?.message} />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Destination'
                : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
