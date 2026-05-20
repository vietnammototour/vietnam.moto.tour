import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {Button, TextInput, NumberInput} from '@/components/ui';
import type {Locale} from '../LocalePicker';
import {
  buildRoleSchema,
  roleFormDefaults,
  type RoleFormValues,
} from './RoleForm.form-utils';

type RoleFormProps = {
  mode: 'create' | 'edit';
  locale: Locale;
  defaults?: RoleFormValues;
  onSubmit: (data: RoleFormValues) => void;
};

export function RoleForm({mode, locale, defaults, onSubmit}: RoleFormProps) {
  const t = useTranslations('admin.roles');
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<RoleFormValues>({
    resolver: yupResolver(buildRoleSchema(t)),
    defaultValues: defaults ?? roleFormDefaults,
  });

  const labelField = locale === 'en' ? 'labelEn' : 'labelVi';

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        <TextInput
          label={t('keyLabel')}
          {...register('key')}
          disabled={mode === 'edit'}
          error={errors.key?.message}
        />
        <TextInput
          key={labelField}
          label={t('labelLabel')}
          {...register(labelField)}
          error={errors[labelField]?.message}
        />
        <NumberInput
          label={t('orderLabel')}
          {...register('order', {valueAsNumber: true})}
          error={errors.order?.message}
        />
      </div>
      <div className="shrink-0 flex justify-end gap-3 border-t border-border pt-4 mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
