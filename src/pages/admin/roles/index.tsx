import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui';
import type {GetServerSidePropsContext} from 'next';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
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
            href={routes.admin.roles.new.path()}
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
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(r)}
                  >
                    {t('delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shrink-0 border-t border-border pt-3 mt-4 type-label-sm text-on-surface-secondary">
        {t('count', {count: roles.length})}
      </div>
    </div>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
