import {useId} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {
  TextInput,
  Textarea,
  NumberInput,
  FormField,
  Select,
} from '@/components/ui';
import {TeamPhotoPicker} from './TeamPhotoPicker';
import type {Locale} from '../LocalePicker';
import {
  buildUserSchema,
  userFormDefaults,
  type UserFormValues,
} from './UserForm.form-utils';
import type * as VMT from '@/domain';

type UserFormProps = {
  id?: string;
  mode: 'create' | 'edit';
  locale: Locale;
  roles: VMT.OrgRole[];
  defaults?: UserFormValues;
  onSubmit: (data: UserFormValues) => void;
};

export function UserForm({
  id = 'user-form',
  mode,
  locale,
  roles,
  defaults,
  onSubmit,
}: UserFormProps) {
  const t = useTranslations('admin.users');
  const isCoreTeamId = useId();
  const allowAuthId = useId();

  const {
    register,
    handleSubmit,
    control,
    formState: {errors},
  } = useForm<UserFormValues>({
    resolver: yupResolver(buildUserSchema(t, mode)),
    defaultValues: defaults ?? userFormDefaults,
  });

  const bioField = locale === 'en' ? 'bioEn' : 'bioVi';

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: locale === 'en' ? r.labelEn : r.labelVi,
  }));

  return (
    <form
      id={id}
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="max-w-4xl bg-surface-elevated border border-border p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label={t('nameLabel')}
          {...register('name')}
          error={errors.name?.message}
        />
        <TextInput
          label={t('emailLabel')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <TextInput
          label={t('passwordLabel')}
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
          hint={mode === 'edit' ? t('passwordHelp') : undefined}
        />
        <Controller
          control={control}
          name="orgRoleId"
          render={({field}) => (
            <Select
              label={t('roleLabel')}
              value={field.value ?? ''}
              onChange={field.onChange}
              options={roleOptions}
              placeholder="—"
              error={errors.orgRoleId?.message}
            />
          )}
        />
        <TextInput
          label={t('birthDateLabel')}
          type="date"
          {...register('birthDate')}
          error={errors.birthDate?.message}
        />
        <NumberInput
          label={t('orderLabel')}
          {...register('teamOrder', {valueAsNumber: true})}
          error={errors.teamOrder?.message}
        />
      </div>

      <Textarea
        key={bioField}
        label={t('bioLabel')}
        {...register(bioField)}
        rows={4}
        error={errors[bioField]?.message}
      />

      <Controller
        control={control}
        name="imageId"
        render={({field}) => (
          <TeamPhotoPicker value={field.value} onChange={field.onChange} />
        )}
      />

      <FormField label=" ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            htmlFor={isCoreTeamId}
            className="flex items-center gap-2 cursor-pointer border border-border bg-surface px-3 py-2 hover:bg-surface-alt transition-colors"
          >
            <input
              id={isCoreTeamId}
              type="checkbox"
              {...register('isCoreTeam')}
              className="cursor-pointer accent-primary"
            />
            <span className="type-body-sm">{t('isCoreTeamLabel')}</span>
          </label>
          <label
            htmlFor={allowAuthId}
            className="flex items-center gap-2 cursor-pointer border border-border bg-surface px-3 py-2 hover:bg-surface-alt transition-colors"
          >
            <input
              id={allowAuthId}
              type="checkbox"
              {...register('allowAuth')}
              className="cursor-pointer accent-primary"
            />
            <span className="type-body-sm">{t('allowAuthLabel')}</span>
          </label>
        </div>
      </FormField>
    </form>
  );
}
