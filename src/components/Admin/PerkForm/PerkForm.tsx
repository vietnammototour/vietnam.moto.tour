'use client';

import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {
  Button,
  FormField,
  TextInput,
  IconPicker,
  Select,
} from '@/components/ui';
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
  const tc = useTranslations('common');
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
        label={tc('form.labelEn')}
        {...register('labelEn')}
        error={errors.labelEn?.message}
      />

      <TextInput
        id="labelVi"
        label={tc('form.labelVi')}
        {...register('labelVi')}
        error={errors.labelVi?.message}
      />

      <Select
        id="category"
        label={tc('form.category')}
        error={errors.category?.message}
        {...register('category')}
      >
        {PERK_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {t(`category.${c}`)}
          </option>
        ))}
      </Select>

      <FormField
        label={tc('form.icon')}
        htmlFor="icon"
        error={errors.icon?.message}
      >
        <IconPicker
          value={iconValue}
          onChange={(v) => setValue('icon', v, {shouldDirty: true})}
        />
      </FormField>

      {mode === 'edit' && (
        <FormField label={tc('form.archived')} htmlFor="archived">
          <input
            id="archived"
            type="checkbox"
            {...register('archived')}
            className="cursor-pointer"
          />
        </FormField>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tc('form.saving') : tc('form.save')}
      </Button>
    </form>
  );
}
