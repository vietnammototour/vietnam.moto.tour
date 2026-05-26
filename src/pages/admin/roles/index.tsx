import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui';
import type {GetServerSidePropsContext} from 'next';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminPageFooter,
} from '@/components/Admin/AdminPageShell';
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
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title')},
          ]}
          actions={
            <Button
              variant="primary"
              href={routes.admin.roles.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('new')}
            </Button>
          }
        />
      }
      footer={<AdminPageFooter status={t('count', {count: roles.length})} />}
    >
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
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    href={routes.admin.roles.edit.path({id: r.id})}
                    icon={<i className="fa fa-pencil text-xs" />}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    variant="ghost-danger"
                    size="sm"
                    onClick={() => handleDelete(r)}
                    icon={<i className="fa fa-trash text-xs" />}
                  >
                    {t('delete')}
                  </Button>
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
