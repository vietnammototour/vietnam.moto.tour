import {useEffect, useState} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {Button} from '@/components/ui';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';

type Row = {id: string; key: string; label: string; imageCount: number};

export default function ImageCollectionsListPage() {
  const t = useTranslations();
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.imageCollections.list().then((res) => {
      if (res.data) setRows(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleDelete(id: string) {
    if (!confirm(t('admin.imageCollections.confirmDelete'))) return;
    const res = await api.admin.imageCollections.delete(id);
    if (!res.error) setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('admin.imageCollections.title')}
          actions={
            <Button
              variant="primary"
              href={routes.admin.imageCollections.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('admin.imageCollections.new')}
            </Button>
          }
        />
      }
    >
      {loading && <p>{t('common.loading')}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-on-surface-secondary">
          {t('admin.imageCollections.empty')}
        </p>
      )}
      {!loading && rows.length > 0 && (
        <table className="w-full bg-surface-elevated border border-border">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="p-3 type-label-sm uppercase text-on-surface-secondary">
                {t('admin.imageCollections.label')}
              </th>
              <th className="p-3 type-label-sm uppercase text-on-surface-secondary">
                {t('admin.imageCollections.key')}
              </th>
              <th className="p-3 type-label-sm uppercase text-on-surface-secondary">
                {t('admin.imageCollections.imageCount')}
              </th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.label}</td>
                <td className="p-3 font-mono text-sm">{r.key}</td>
                <td className="p-3">{r.imageCount}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost-primary"
                      size="sm"
                      href={routes.admin.imageCollections.edit.path({id: r.id})}
                      icon={<i className="fa fa-pencil text-xs" />}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost-danger"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      icon={<i className="fa fa-trash text-xs" />}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
