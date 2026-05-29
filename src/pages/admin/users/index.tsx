import {useEffect, useState} from 'react';
import Image from 'next/image';
import {useSession} from 'next-auth/react';
import {Button, ConfirmModal, LocaleSwitcher} from '@/components/ui';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import type * as VMT from '@/domain';

export default function UsersListPage() {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const [locale, setLocale] = useState<AdminLocale>('en');
  const {data: session} = useSession();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [users, setUsers] = useState<VMT.UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<VMT.UserAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.users.list().then(({data}) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function performDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const {error} = await api.admin.users.delete(deleteTarget.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          localeSwitcher={
            <LocaleSwitcher value={locale} onChange={setLocale} />
          }
          actions={
            <Button
              variant="primary"
              href={routes.admin.users.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('new')}
            </Button>
          }
        />
      }
    >
      <table className="w-full bg-surface-elevated border border-border">
        <thead>
          <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
            <th className="p-3">{t('orderLabel')}</th>
            <th className="p-3" />
            <th className="p-3">{t('nameLabel')}</th>
            <th className="p-3">{t('emailLabel')}</th>
            <th className="p-3">{t('roleLabel')}</th>
            <th className="p-3">{t('isCoreTeamLabel')}</th>
            <th className="p-3">{t('allowAuthLabel')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.teamOrder}</td>
              <td className="p-3">
                {u.photo?.url ? (
                  <Image
                    src={u.photo.url}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 bg-surface-alt" />
                )}
              </td>
              <td className="p-3 font-medium">{u.name}</td>
              <td className="p-3 text-on-surface-secondary">
                {u.email ?? '—'}
              </td>
              <td className="p-3">
                {locale === 'en' ? u.orgRole.labelEn : u.orgRole.labelVi}
              </td>
              <td className="p-3">{u.isCoreTeam ? '✓' : '—'}</td>
              <td className="p-3">{u.allowAuth ? '✓' : '—'}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    href={routes.admin.users.edit.path({id: u.id})}
                    icon={<i className="fa fa-pencil text-xs" />}
                  >
                    {tCommon('edit')}
                  </Button>
                  {session?.user.id !== u.id && (
                    <Button
                      variant="ghost-danger"
                      size="sm"
                      onClick={() => setDeleteTarget(u)}
                      icon={<i className="fa fa-trash text-xs" />}
                    >
                      {tCommon('delete')}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget ? t('deleteConfirm', {name: deleteTarget.name}) : ''
        }
        confirmLabel={tCommon('delete')}
        variant="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={performDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
