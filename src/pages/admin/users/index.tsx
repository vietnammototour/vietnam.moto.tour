import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="type-headline-sm">{t('title')}</h1>
        <Link
          href={routes.admin.users.new.path()}
          className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
        >
          {t('new')}
        </Link>
      </header>
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
                  Edit
                </Link>
                {session?.user.id !== u.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="text-error hover:underline cursor-pointer"
                  >
                    {t('delete')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
