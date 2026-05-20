import {useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {RoleForm} from '@/components/Admin/RoleForm';
import type {RoleFormValues} from '@/components/Admin/RoleForm/RoleForm.form-utils';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
import {LocalePicker, type Locale} from '@/components/Admin/LocalePicker';
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
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {label: t('title'), href: routes.admin.roles.list.path()},
              {label: t('new')},
            ]}
          />
          <h1 className="type-headline-sm truncate">{t('new')}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LocalePicker value={locale} onChange={setLocale} />
        </div>
      </div>
      <RoleForm mode="create" locale={locale} onSubmit={onSubmit} />
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
