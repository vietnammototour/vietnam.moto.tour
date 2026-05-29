import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button, ConfirmModal, LocaleSwitcher} from '@/components/ui';
import type {AdminLocale} from '@/components/ui/LocaleSwitcher';
import type {GetServerSidePropsContext} from 'next';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import type * as VMT from '@/domain';

export default function RolesListPage() {
  const t = useTranslations('admin.roles');
  const tCommon = useTranslations('common');
  const [locale, setLocale] = useState<AdminLocale>('en');
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [roles, setRoles] = useState<VMT.OrgRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<VMT.OrgRole | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.roles.list().then(({data}) => {
      if (data) setRoles(data);
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
    const {error} = await api.admin.roles.delete(deleteTarget.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.includes('Role in use') ? t('deleteInUse') : error);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
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
              href={routes.admin.roles.new.path()}
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
            <th className="p-3">{t('keyLabel')}</th>
            <th className="p-3">{t('labelLabel')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3">{r.order}</td>
              <td className="p-3 font-mono text-sm">{r.key}</td>
              <td className="p-3">
                {locale === 'en' ? r.labelEn : r.labelVi}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    href={routes.admin.roles.edit.path({id: r.id})}
                    icon={<i className="fa fa-pencil text-xs" />}
                  >
                    {tCommon('edit')}
                  </Button>
                  <Button
                    variant="ghost-danger"
                    size="sm"
                    onClick={() => setDeleteTarget(r)}
                    icon={<i className="fa fa-trash text-xs" />}
                  >
                    {tCommon('delete')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget ? t('deleteConfirm', {label: deleteTarget.labelEn}) : ''
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
