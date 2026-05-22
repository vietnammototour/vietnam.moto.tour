import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {Button} from '@/components/ui';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
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
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {label: t('title')},
            ]}
          />
          <h1 className="type-headline-sm truncate">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={routes.admin.users.new.path()}
            className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            {t('new')}
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
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
                <td className="p-3 flex gap-2">
                  <Link
                    href={routes.admin.users.edit.path({id: u.id})}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {t('edit')}
                  </Link>
                  {session?.user.id !== u.id && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(u)}
                    >
                      {t('delete')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shrink-0 border-t border-border pt-3 mt-4 type-label-sm text-on-surface-secondary">
        {t('count', {count: users.length})}
      </div>
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
