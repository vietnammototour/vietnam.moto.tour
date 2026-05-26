import {useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {RoleForm} from '@/components/Admin/RoleForm';
import type {RoleFormValues} from '@/components/Admin/RoleForm/RoleForm.form-utils';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminPageFooter,
} from '@/components/Admin/AdminPageShell';
import {LocalePicker, type Locale} from '@/components/Admin/LocalePicker';
import {Button} from '@/components/ui';
import {api, routes} from '@/routes';

export default function NewRolePage() {
  const router = useRouter();
  const t = useTranslations('admin.roles');
  const [locale, setLocale] = useState<Locale>('en');

  async function onSubmit(values: RoleFormValues) {
    const {error} = await api.admin.roles.create(
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.roles.list.path());
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('new')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.roles.list.path()},
            {label: t('new')},
          ]}
          localeSwitcher={<LocalePicker value={locale} onChange={setLocale} />}
        />
      }
      footer={
        <AdminPageFooter
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(routes.admin.roles.list.path())}
              >
                {t('cancel')}
              </Button>
              <Button variant="primary" type="submit" form="role-form">
                {t('save')}
              </Button>
            </>
          }
        />
      }
    >
      <RoleForm mode="create" locale={locale} onSubmit={onSubmit} />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
