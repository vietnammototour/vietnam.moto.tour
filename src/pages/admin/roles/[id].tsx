import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {RoleForm} from '@/components/Admin/RoleForm';
import type {RoleFormValues} from '@/components/Admin/RoleForm/RoleForm.form-utils';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
import {LocalePicker, type Locale} from '@/components/Admin/LocalePicker';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

export default function EditRolePage() {
  const router = useRouter();
  const t = useTranslations('admin.roles');
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [role, setRole] = useState<VMT.OrgRole | null>(null);
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    if (!id) return;
    api.admin.roles.get(id).then(({data}) => {
      if (data) setRole(data);
    });
  }, [id]);

  async function onSubmit(values: RoleFormValues) {
    const {error} = await api.admin.roles.update(
      id,
      values as unknown as Record<string, unknown>,
    );
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.roles.list.path());
  }

  const currentLabel = role
    ? locale === 'en'
      ? role.labelEn
      : role.labelVi
    : '';

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {label: t('title'), href: routes.admin.roles.list.path()},
              {label: role?.key ?? id},
            ]}
          />
          <h1 className="type-headline-sm truncate">
            {currentLabel || t('edit')}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LocalePicker value={locale} onChange={setLocale} />
        </div>
      </div>
      {role && (
        <RoleForm
          mode="edit"
          locale={locale}
          defaults={role}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
