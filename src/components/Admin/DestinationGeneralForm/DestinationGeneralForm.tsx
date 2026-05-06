'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {routes, useNavigate} from '@/routes';
import {TextInput, Textarea, Button} from '@/components/ui';
import {
  destinationSchema,
  submitDestination,
  type DestinationFormData,
} from './DestinationGeneralForm.form-utils';
import type {Locale} from '../LocalePicker';

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
          <TextInput
            label="Slug"
            {...register('slug')}
            error={errors.slug?.message}
          />
          <TextInput
            label={`Name (${locale.toUpperCase()})`}
            {...register(nameField)}
            error={errors[nameField]?.message}
          />
        </div>

        <Textarea
          label={`Description (${locale.toUpperCase()})`}
          rows={4}
          {...register(descField)}
          error={errors[descField]?.message}
        />

        <div className="flex gap-4 pt-4">
          <Button type="submit" loading={isSubmitting} size="lg">
            {mode === 'create' ? 'Create Destination' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
