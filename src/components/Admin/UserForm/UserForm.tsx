import {useId} from 'react';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {
  Button,
  TextInput,
  Textarea,
  NumberInput,
  FormField,
} from '@/components/ui';
import {TeamPhotoPicker} from './TeamPhotoPicker';
import type {Locale} from '../LocalePicker';
import {
  buildUserSchema,
  userFormDefaults,
  type UserFormValues,
} from './UserForm.form-utils';
import type * as VMT from '@/domain';

type PickableImage = Pick<
  VMT.CollectionImage,
  'id' | 'url' | 'altVi' | 'altEn'
>;

type UserFormProps = {
  mode: 'create' | 'edit';
  locale: Locale;
  roles: VMT.OrgRole[];
  images: PickableImage[];
  defaults?: UserFormValues;
  onSubmit: (data: UserFormValues) => void;
};

export function UserForm({
  mode,
  locale,
  roles,
  images,
  defaults,
  onSubmit,
}: UserFormProps) {
  const t = useTranslations('admin.users');
  const roleSelectId = useId();
  const isCoreTeamId = useId();
  const allowAuthId = useId();

  const {
    register,
    handleSubmit,
    control,
    formState: {errors, isSubmitting},
  } = useForm<UserFormValues>({
    resolver: yupResolver(buildUserSchema(t, mode)),
    defaultValues: defaults ?? userFormDefaults,
  });

  const bioField = locale === 'en' ? 'bioEn' : 'bioVi';

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
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
          {...register('password')}
          error={errors.password?.message}
        />
        <FormField
          label={t('roleLabel')}
          htmlFor={roleSelectId}
          error={errors.orgRoleId?.message}
        >
          <select
            id={roleSelectId}
            {...register('orgRoleId')}
            className="w-full bg-surface-elevated border border-border rounded-lg p-2 cursor-pointer"
          >
            <option value="">—</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.labelEn}
              </option>
            ))}
          </select>
        </FormField>
        <Textarea
          key={bioField}
          label={t('bioLabel')}
          {...register(bioField)}
          rows={4}
          error={errors[bioField]?.message}
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
        <Controller
          control={control}
          name="imageId"
          render={({field}) => (
            <TeamPhotoPicker
              images={images}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <label
          htmlFor={isCoreTeamId}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            id={isCoreTeamId}
            type="checkbox"
            {...register('isCoreTeam')}
            className="cursor-pointer"
          />
          {t('isCoreTeamLabel')}
        </label>
        <label
          htmlFor={allowAuthId}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            id={allowAuthId}
            type="checkbox"
            {...register('allowAuth')}
            className="cursor-pointer"
          />
          {t('allowAuthLabel')}
        </label>
      </div>
      <div className="shrink-0 flex justify-end gap-3 border-t border-border pt-4 mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
