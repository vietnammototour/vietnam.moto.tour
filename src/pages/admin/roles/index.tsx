import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import type * as VMT from '@/domain';

export default function RolesListPage() {
  const t = useTranslations('admin.roles');
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleDelete(role: VMT.OrgRole) {
    if (!confirm(t('deleteConfirm', {label: role.labelEn}))) return;
    const {error} = await api.admin.roles.delete(role.id);
    if (error) {
      alert(error.includes('Role in use') ? t('deleteInUse') : error);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="type-headline-sm">{t('title')}</h1>
        <Link
          href={routes.admin.roles.new.path()}
          className="bg-primary text-white px-4 py-2 rounded-lg cursor-pointer"
        >
          {t('new')}
        </Link>
      </header>
      <table className="w-full bg-surface-elevated rounded-xl border border-border">
        <thead>
          <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
            <th className="p-3">{t('orderLabel')}</th>
            <th className="p-3">{t('keyLabel')}</th>
            <th className="p-3">{t('labelViLabel')}</th>
            <th className="p-3">{t('labelEnLabel')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3">{r.order}</td>
              <td className="p-3 font-mono text-sm">{r.key}</td>
              <td className="p-3">{r.labelVi}</td>
              <td className="p-3">{r.labelEn}</td>
              <td className="p-3 flex gap-2">
                <Link
                  href={routes.admin.roles.edit.path({id: r.id})}
                  className="text-primary hover:underline cursor-pointer"
                >
                  {t('edit')}
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  className="text-error hover:underline cursor-pointer"
                >
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
