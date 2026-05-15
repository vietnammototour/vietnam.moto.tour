import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {Button, TextInput, NumberInput} from '@/components/ui';
import {
  buildRoleSchema,
  roleFormDefaults,
  type RoleFormValues,
} from './RoleForm.form-utils';

type RoleFormProps = {
  mode: 'create' | 'edit';
  defaults?: RoleFormValues;
  onSubmit: (data: RoleFormValues) => void;
};

export function RoleForm({mode, defaults, onSubmit}: RoleFormProps) {
  const t = useTranslations('admin.roles');
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<RoleFormValues>({
    resolver: yupResolver(buildRoleSchema(t)),
    defaultValues: defaults ?? roleFormDefaults,
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="space-y-6"
    >
      <TextInput
        label={t('keyLabel')}
        {...register('key')}
        disabled={mode === 'edit'}
        error={errors.key?.message}
      />
      <TextInput
        label={t('labelViLabel')}
        {...register('labelVi')}
        error={errors.labelVi?.message}
      />
      <TextInput
        label={t('labelEnLabel')}
        {...register('labelEn')}
        error={errors.labelEn?.message}
      />
      <NumberInput
        label={t('orderLabel')}
        {...register('order', {valueAsNumber: true})}
        error={errors.order?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        {t('save')}
      </Button>
    </form>
  );
}
