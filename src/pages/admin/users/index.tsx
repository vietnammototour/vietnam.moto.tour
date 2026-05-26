import {useEffect, useState} from 'react';
import {useSession} from 'next-auth/react';
import {Button} from '@/components/ui';
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
  const {data: session} = useSession();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [users, setUsers] = useState<VMT.UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.users.list().then(({data}) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleDelete(u: VMT.UserAdmin) {
    if (!confirm(t('deleteConfirm', {name: u.name}))) return;
    const {error} = await api.admin.users.delete(u.id);
    if (error) {
      alert(error);
      return;
    }
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
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
      <table className="w-full bg-surface-elevated rounded-xl border border-border">
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
                  <img
                    src={u.photo.url}
                    alt=""
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-surface-alt rounded" />
                )}
              </td>
              <td className="p-3 font-medium">{u.name}</td>
              <td className="p-3 text-on-surface-secondary">
                {u.email ?? '—'}
              </td>
              <td className="p-3">{u.orgRole.labelEn}</td>
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
                    {t('edit')}
                  </Button>
                  {session?.user.id !== u.id && (
                    <Button
                      variant="ghost-danger"
                      size="sm"
                      onClick={() => handleDelete(u)}
                      icon={<i className="fa fa-trash text-xs" />}
                    >
                      {t('delete')}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
