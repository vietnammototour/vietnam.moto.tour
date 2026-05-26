import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {TextInput, NumberInput} from '@/components/ui';
import type {Locale} from '../LocalePicker';
import {
  buildRoleSchema,
  roleFormDefaults,
  type RoleFormValues,
} from './RoleForm.form-utils';

type RoleFormProps = {
  id?: string;
  mode: 'create' | 'edit';
  locale: Locale;
  defaults?: RoleFormValues;
  onSubmit: (data: RoleFormValues) => void;
};

export function RoleForm({
  id = 'role-form',
  mode,
  locale,
  defaults,
  onSubmit,
}: RoleFormProps) {
  const t = useTranslations('admin.roles');
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<RoleFormValues>({
    resolver: yupResolver(buildRoleSchema(t)),
    defaultValues: defaults ?? roleFormDefaults,
  });

  const labelField = locale === 'en' ? 'labelEn' : 'labelVi';
  const labelText = locale === 'en' ? t('labelEnLabel') : t('labelViLabel');

  return (
    <form
      id={id}
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="max-w-2xl space-y-6 bg-surface-elevated rounded-xl border border-border p-6"
    >
      <TextInput
        label={t('keyLabel')}
        {...register('key')}
        disabled={mode === 'edit'}
        error={errors.key?.message}
      />
      <TextInput
        key={labelField}
        label={labelText}
        {...register(labelField)}
        error={errors[labelField]?.message}
      />
      <NumberInput
        label={t('orderLabel')}
        {...register('order', {valueAsNumber: true})}
        error={errors.order?.message}
      />
    </form>
  );
}
