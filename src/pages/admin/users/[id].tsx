import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {UserForm} from '@/components/Admin/UserForm';
import type {UserFormValues} from '@/components/Admin/UserForm/UserForm.form-utils';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminPageFooter,
} from '@/components/Admin/AdminPageShell';
import {
  Button,
  LocaleSwitcher,
  type AdminLocale as Locale,
} from '@/components/ui';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

export default function EditUserPage() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [user, setUser] = useState<VMT.UserAdmin | null>(null);
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [locale, setLocale] = useState<Locale>('en');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.admin.users.get(id).then(({data}) => {
      if (data) setUser(data);
    });
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
  }, [id]);

  async function onSubmit(values: UserFormValues) {
    setSubmitError(null);
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    if (!values.password) delete payload.password;
    const {error} = await api.admin.users.update(id, payload);
    if (error) {
      setSubmitError(error);
      return;
    }
    router.push(routes.admin.users.list.path());
  }

  if (!user) return null;
  const defaults: UserFormValues = {
    name: user.name,
    email: user.email ?? '',
    password: '',
    orgRoleId: user.orgRole.id,
    bioVi: user.bioVi,
    bioEn: user.bioEn,
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
    imageId: user.imageId,
    isCoreTeam: user.isCoreTeam,
    allowAuth: user.allowAuth,
    teamOrder: user.teamOrder,
  };

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={user.name || t('edit')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.users.list.path()},
            {label: user.name || id},
          ]}
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
        />
      }
      footer={
        <AdminPageFooter
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(routes.admin.users.list.path())}
              >
                {t('cancel')}
              </Button>
              <Button variant="primary" type="submit" form="user-form">
                {t('save')}
              </Button>
            </>
          }
        />
      }
    >
      {submitError && (
        <div
          role="alert"
          className="mb-4 bg-error/10 text-error type-body-sm p-3 border border-error/30"
        >
          {submitError}
        </div>
      )}
      <UserForm
        mode="edit"
        locale={locale}
        defaults={defaults}
        roles={roles}
        onSubmit={onSubmit}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
