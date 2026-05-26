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

export default function NewUserPage() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [images, setImages] = useState<TeamImage[]>([]);
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
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
  }, []);

  async function onSubmit(values: UserFormValues) {
    const payload: Record<string, unknown> = {
      ...values,
      birthDate: values.birthDate || null,
    };
    const {error} = await api.admin.users.create(payload);
    if (error) {
      alert(error);
      return;
    }
    router.push(routes.admin.users.list.path());
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('new')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.users.list.path()},
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
        mode="create"
        locale={locale}
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
