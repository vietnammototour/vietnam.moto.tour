import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {Button, FormField, TextInput} from '@/components/ui';
import {
  newCollectionSchema,
  newCollectionDefaults,
  type NewCollectionForm,
} from '@/components/Admin/ImageCollectionNew/new.form-utils';

export default function NewImageCollectionPage() {
  const router = useRouter();
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    setError,
  } = useForm<NewCollectionForm>({
    resolver: yupResolver(newCollectionSchema),
    defaultValues: newCollectionDefaults,
  });

  async function onSubmit(values: NewCollectionForm) {
    const res = await api.admin.imageCollections.create(values);
    if (res.error || !res.data) {
      setError('key', {message: res.error ?? 'create failed'});
      return;
    }
    router.push(routes.admin.imageCollections.edit.path({id: res.data.id}));
  }

  return (
    <div className="max-w-xl">
      <h1 className="type-headline-sm mb-6">
        {t('admin.imageCollections.newTitle')}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label={t('admin.imageCollections.key')}
          error={errors.key?.message}
        >
          <TextInput {...register('key')} placeholder="home-gallery" />
        </FormField>
        <FormField
          label={t('admin.imageCollections.label')}
          error={errors.label?.message}
        >
          <TextInput {...register('label')} placeholder="Home Gallery" />
        </FormField>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {t('common.create')}
        </Button>
      </form>
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
