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
import {LocalePicker, type Locale} from '@/components/Admin/LocalePicker';
import {Button} from '@/components/ui';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TeamImage = {id: string; url: string | null; altVi: string; altEn: string};

export default function EditUserPage() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [user, setUser] = useState<VMT.UserAdmin | null>(null);
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<TeamImage[]>([]);
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    if (!id) return;
    api.admin.users.get(id).then(({data}) => {
      if (data) setUser(data);
    });
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
    });
    fetch('/api/admin/image-collections?key=team')
      .then((r) => r.json())
      .then(async (collections) => {
        const found = Array.isArray(collections)
          ? collections.find((c: {key: string}) => c.key === 'team')
          : null;
        if (!found) return;
        if (Array.isArray(found.images)) {
          setImages(found.images);
        } else {
          const detail = await fetch(
            `/api/admin/image-collections/${found.id}`,
          ).then((r) => r.json());
          if (Array.isArray(detail.images)) setImages(detail.images);
        }
      });
  }, [id]);

  async function onSubmit(values: UserFormValues) {
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    if (!values.password) delete payload.password;
    const {error} = await api.admin.users.update(id, payload);
    if (error) {
      alert(error);
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
          localeSwitcher={<LocalePicker value={locale} onChange={setLocale} />}
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
      <UserForm
        mode="edit"
        locale={locale}
        defaults={defaults}
        roles={roles}
        images={images}
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
