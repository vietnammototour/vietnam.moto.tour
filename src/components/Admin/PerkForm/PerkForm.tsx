'use client';

import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {Button, FormField, TextInput, IconPicker} from '@/components/ui';
import {
  perkFormSchema,
  perkFormDefaults,
  PERK_CATEGORIES,
  type PerkFormValues,
} from './PerkForm.form-utils';

type PerkFormProps = {
  mode: 'create' | 'edit';
  initialData?: PerkFormValues;
  onSubmit: (values: PerkFormValues) => Promise<void>;
};

export function PerkForm({mode, initialData, onSubmit}: PerkFormProps) {
  const t = useTranslations('admin.perks');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<PerkFormValues>({
    resolver: yupResolver(perkFormSchema),
    defaultValues: initialData ?? perkFormDefaults,
  });

  const iconValue = watch('icon');

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values))}
      className="space-y-4 max-w-xl"
    >
      <TextInput
        id="labelEn"
        label={t('form.labelEn')}
        {...register('labelEn')}
        error={errors.labelEn?.message}
      />

      <TextInput
        id="labelVi"
        label={t('form.labelVi')}
        {...register('labelVi')}
        error={errors.labelVi?.message}
      />

      <FormField
        label={t('form.category')}
        htmlFor="category"
        error={errors.category?.message}
      >
        <select
          id="category"
          {...register('category')}
          className="cursor-pointer w-full px-3 py-2 border rounded"
        >
          {PERK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`category.${c}`)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={t('form.icon')}
        htmlFor="icon"
        error={errors.icon?.message}
      >
        <IconPicker
          value={iconValue}
          onChange={(v) => setValue('icon', v, {shouldDirty: true})}
        />
      </FormField>

      {mode === 'edit' && (
        <FormField label={t('form.archived')} htmlFor="archived">
          <input
            id="archived"
            type="checkbox"
            {...register('archived')}
            className="cursor-pointer"
          />
        </FormField>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('form.saving') : t('form.save')}
      </Button>
    </form>
  );
}
